/**
 * The schema v1 expression language: a tiny, safe language parsed by our own parser (never eval).
 *
 *   or      := and ("or" and)*
 *   and     := not ("and" not)*
 *   not     := "not" not | cmp
 *   cmp     := add (("==" | "!=" | "<" | "<=" | ">" | ">=") add)?
 *   add     := mul (("+" | "-") mul)*
 *   mul     := unary (("*" | "/" | "%") unary)*
 *   unary   := "-" unary | primary
 *   primary := number | string | "true" | "false" | name | func "(" args ")" | "(" or ")"
 *   func    := if | min | max | round | abs | len
 *
 * Limits: 200 characters and nesting depth 10 (a chain like a + b + c counts once).
 *
 * Ported from the app's entry/src/main/ets/core/Expr.ets at the pinned upstream SHA.
 * The marketplace only parses, type-checks and reads names; capsule execution (evalExpr) stays
 * on the device and is intentionally not ported here.
 */

import type { Scalar, Value, VarType } from './types';

export const MAX_EXPR_LENGTH = 200;
export const MAX_EXPR_DEPTH = 10;
export const MAX_TEXT_LENGTH = 500;
export const MAX_LIST_ITEMS = 100;
export const DEFAULT_STEP_BUDGET = 10000;
export const KEYWORDS: string[] = [
  'true',
  'false',
  'and',
  'or',
  'not',
  'if',
  'min',
  'max',
  'round',
  'abs',
  'len',
];
const FUNCTIONS: string[] = ['if', 'min', 'max', 'round', 'abs', 'len'];
const NAME_RE = /^[A-Za-z_][A-Za-z0-9_]{0,31}$/;

/** An expression or evaluation problem. Message is user-facing. */
export class ExprError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExprError';
  }
}

export function isValidName(name: string): boolean {
  return NAME_RE.test(name) && !KEYWORDS.includes(name);
}

// ---- Lexer ----

type TokenKind = 'num' | 'str' | 'name' | 'op' | 'lparen' | 'rparen' | 'comma' | 'end';

interface Token {
  kind: TokenKind;
  text: string;
  num: number;
  pos: number;
}

const TWO_CHAR_OPS: string[] = ['==', '!=', '<=', '>='];
const ONE_CHAR_OPS = '+-*/%<>';

function makeToken(kind: TokenKind, text: string, pos: number): Token {
  return { kind, text, num: 0, pos };
}

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src.charAt(i);
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i++;
      continue;
    }
    if (ch >= '0' && ch <= '9') {
      const m = src.substring(i).match(/^\d+(\.\d+)?/);
      const text = m === null ? ch : m[0];
      const t = makeToken('num', text, i);
      t.num = parseFloat(text);
      tokens.push(t);
      i += text.length;
      continue;
    }
    if (ch === "'" || ch === '"') {
      let j = i + 1;
      let out = '';
      let closed = false;
      while (j < src.length) {
        const c = src.charAt(j);
        if (c === '\\' && j + 1 < src.length) {
          out += src.charAt(j + 1);
          j += 2;
        } else if (c === ch) {
          closed = true;
          j++;
          break;
        } else {
          out += c;
          j++;
        }
      }
      if (!closed) {
        throw new ExprError(`unterminated text starting at position ${i + 1}`);
      }
      tokens.push(makeToken('str', out, i));
      i = j;
      continue;
    }
    if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_') {
      const m = src.substring(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
      const text = m === null ? ch : m[0];
      tokens.push(makeToken('name', text, i));
      i += text.length;
      continue;
    }
    const two = src.substring(i, i + 2);
    if (TWO_CHAR_OPS.includes(two)) {
      tokens.push(makeToken('op', two, i));
      i += 2;
      continue;
    }
    if (ch === '=') {
      throw new ExprError(`use == to compare (position ${i + 1})`);
    }
    if (ONE_CHAR_OPS.includes(ch)) {
      tokens.push(makeToken('op', ch, i));
      i++;
      continue;
    }
    if (ch === '(') {
      tokens.push(makeToken('lparen', ch, i));
    } else if (ch === ')') {
      tokens.push(makeToken('rparen', ch, i));
    } else if (ch === ',') {
      tokens.push(makeToken('comma', ch, i));
    } else {
      throw new ExprError(`unexpected character "${ch}" at position ${i + 1}`);
    }
    i++;
  }
  tokens.push(makeToken('end', '', src.length));
  return tokens;
}

// ---- AST ----

export type NodeKind = 'num' | 'str' | 'bool' | 'name' | 'neg' | 'not' | 'chain' | 'cmp' | 'call';

/** chain: args[0] ops[0] args[1] ops[1] ... at one precedence level: (+ -), (* / %), and, or. */
export interface ExprNode {
  kind: NodeKind;
  num: number;
  str: string;
  bool: boolean;
  name: string;
  ops: string[];
  args: ExprNode[];
}

function node(kind: NodeKind): ExprNode {
  return { kind, num: 0, str: '', bool: false, name: '', ops: [], args: [] };
}

function height(n: ExprNode): number {
  let h = 0;
  n.args.forEach((a) => {
    h = Math.max(h, height(a));
  });
  return h + 1;
}

// ---- Parser ----

class Parser {
  private tokens: Token[];
  private i = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  peek(): Token {
    return this.tokens[this.i];
  }

  next(): Token {
    const t = this.tokens[this.i];
    if (this.i < this.tokens.length - 1) {
      this.i++;
    }
    return t;
  }

  isWord(word: string): boolean {
    const t = this.peek();
    return t.kind === 'name' && t.text === word;
  }

  isOp(op: string): boolean {
    const t = this.peek();
    return t.kind === 'op' && t.text === op;
  }

  describe(t: Token): string {
    return t.kind === 'end'
      ? 'the end'
      : `"${t.kind === 'str' ? "'" + t.text + "'" : t.text}" at position ${t.pos + 1}`;
  }

  parseAll(): ExprNode {
    const n = this.parseOr();
    const t = this.peek();
    if (t.kind !== 'end') {
      throw new ExprError(`unexpected ${this.describe(t)}`);
    }
    return n;
  }

  private chain(ops: string[], words: boolean, sub: () => ExprNode): ExprNode {
    const first = sub();
    const n = node('chain');
    n.args.push(first);
    for (;;) {
      const t = this.peek();
      const matches = words
        ? t.kind === 'name' && ops.includes(t.text)
        : t.kind === 'op' && ops.includes(t.text);
      if (!matches) {
        break;
      }
      this.next();
      n.ops.push(t.text);
      n.args.push(sub());
    }
    return n.ops.length === 0 ? first : n;
  }

  parseOr(): ExprNode {
    return this.chain(['or'], true, () => this.parseAnd());
  }

  parseAnd(): ExprNode {
    return this.chain(['and'], true, () => this.parseNot());
  }

  parseNot(): ExprNode {
    if (this.isWord('not')) {
      this.next();
      const n = node('not');
      n.args.push(this.parseNot());
      return n;
    }
    return this.parseCmp();
  }

  parseCmp(): ExprNode {
    const left = this.parseAdd();
    const t = this.peek();
    if (t.kind === 'op' && ['==', '!=', '<', '<=', '>', '>='].includes(t.text)) {
      this.next();
      const n = node('cmp');
      n.ops.push(t.text);
      n.args.push(left);
      n.args.push(this.parseAdd());
      const after = this.peek();
      if (after.kind === 'op' && ['==', '!=', '<', '<=', '>', '>='].includes(after.text)) {
        throw new ExprError(`comparisons cannot be chained; use "and" (position ${after.pos + 1})`);
      }
      return n;
    }
    return left;
  }

  parseAdd(): ExprNode {
    return this.chain(['+', '-'], false, () => this.parseMul());
  }

  parseMul(): ExprNode {
    return this.chain(['*', '/', '%'], false, () => this.parseUnary());
  }

  parseUnary(): ExprNode {
    if (this.isOp('-')) {
      this.next();
      const n = node('neg');
      n.args.push(this.parseUnary());
      return n;
    }
    return this.parsePrimary();
  }

  parsePrimary(): ExprNode {
    const t = this.next();
    if (t.kind === 'num') {
      const n = node('num');
      n.num = t.num;
      return n;
    }
    if (t.kind === 'str') {
      const n = node('str');
      n.str = t.text;
      return n;
    }
    if (t.kind === 'lparen') {
      const inner = this.parseOr();
      const close = this.next();
      if (close.kind !== 'rparen') {
        throw new ExprError(`expected ")" but found ${this.describe(close)}`);
      }
      return inner;
    }
    if (t.kind === 'name') {
      if (t.text === 'true' || t.text === 'false') {
        const n = node('bool');
        n.bool = t.text === 'true';
        return n;
      }
      if (FUNCTIONS.includes(t.text)) {
        const open = this.next();
        if (open.kind !== 'lparen') {
          throw new ExprError(`${t.text} needs "(" after it (position ${t.pos + 1})`);
        }
        const call = node('call');
        call.name = t.text;
        if (this.peek().kind !== 'rparen') {
          call.args.push(this.parseOr());
          while (this.peek().kind === 'comma') {
            this.next();
            call.args.push(this.parseOr());
          }
        }
        const close = this.next();
        if (close.kind !== 'rparen') {
          throw new ExprError(`expected "," or ")" in ${t.text}(...) but found ${this.describe(close)}`);
        }
        return call;
      }
      if (KEYWORDS.includes(t.text)) {
        throw new ExprError(`unexpected "${t.text}" at position ${t.pos + 1}`);
      }
      if (this.peek().kind === 'lparen') {
        throw new ExprError(`unknown function "${t.text}" (allowed: ${FUNCTIONS.join(', ')})`);
      }
      const n = node('name');
      n.name = t.text;
      return n;
    }
    throw new ExprError(`unexpected ${this.describe(t)}`);
  }
}

const parseCache = new Map<string, ExprNode>();
const MAX_CACHE = 1000;

/** Parses an expression or throws ExprError. Results are cached; treat the node as read-only. */
export function parseExpr(src: string): ExprNode {
  const cached = parseCache.get(src);
  if (cached !== undefined) {
    return cached;
  }
  if (src.trim().length === 0) {
    throw new ExprError('empty expression');
  }
  if (src.length > MAX_EXPR_LENGTH) {
    throw new ExprError(`expression is ${src.length} characters (max ${MAX_EXPR_LENGTH})`);
  }
  const n = new Parser(tokenize(src)).parseAll();
  if (height(n) > MAX_EXPR_DEPTH) {
    throw new ExprError(`expression is nested too deeply (max depth ${MAX_EXPR_DEPTH})`);
  }
  if (parseCache.size >= MAX_CACHE) {
    parseCache.clear();
  }
  parseCache.set(src, n);
  return n;
}

/** Every name an expression reads, in order of first use. */
export function namesIn(n: ExprNode): string[] {
  const out: string[] = [];
  const walk = (x: ExprNode): void => {
    if (x.kind === 'name' && !out.includes(x.name)) {
      out.push(x.name);
    }
    x.args.forEach(walk);
  };
  walk(n);
  return out;
}

// ---- Type checking ----

/** Returns the type of a name, or null if it does not exist. */
export type TypeLookup = (name: string) => VarType | null;

function expectType(actual: VarType, wanted: VarType, what: string): void {
  if (actual !== wanted) {
    throw new ExprError(`${what} must be ${wanted}, got ${actual}`);
  }
}

/** Static type of an expression. Throws ExprError for unknown names or type mismatches. */
export function typeOf(n: ExprNode, lookup: TypeLookup): VarType {
  switch (n.kind) {
    case 'num':
      return 'number';
    case 'str':
      return 'text';
    case 'bool':
      return 'bool';
    case 'name': {
      const t = lookup(n.name);
      if (t === null) {
        throw new ExprError(`unknown name "${n.name}"`);
      }
      return t;
    }
    case 'neg':
      expectType(typeOf(n.args[0], lookup), 'number', 'the value after "-"');
      return 'number';
    case 'not':
      expectType(typeOf(n.args[0], lookup), 'bool', 'the value after "not"');
      return 'bool';
    case 'cmp': {
      const a = typeOf(n.args[0], lookup);
      const b = typeOf(n.args[1], lookup);
      const op = n.ops[0];
      if (op === '==' || op === '!=') {
        if (a === 'list' || b === 'list') {
          throw new ExprError(`lists cannot be compared with ${op}; compare len(...) instead`);
        }
        if (a !== b) {
          throw new ExprError(`cannot compare ${a} with ${b} using ${op}`);
        }
      } else {
        expectType(a, 'number', `the left side of ${op}`);
        expectType(b, 'number', `the right side of ${op}`);
      }
      return 'bool';
    }
    case 'chain': {
      const types = n.args.map((a: ExprNode) => typeOf(a, lookup));
      const op0 = n.ops[0];
      if (op0 === 'and' || op0 === 'or') {
        types.forEach((t: VarType) => expectType(t, 'bool', `each side of "${op0}"`));
        return 'bool';
      }
      if (op0 === '+' || op0 === '-') {
        // Left to right: number + number stays number; once text appears, + concatenates.
        let acc: VarType = types[0];
        n.ops.forEach((op: string, k: number) => {
          const rhs = types[k + 1];
          if (acc === 'list' || rhs === 'list') {
            throw new ExprError(`lists cannot be used with ${op}`);
          }
          if (op === '+' && (acc === 'text' || rhs === 'text')) {
            acc = 'text';
          } else {
            expectType(acc, 'number', `the left side of ${op}`);
            expectType(rhs, 'number', `the right side of ${op}`);
            acc = 'number';
          }
        });
        return acc;
      }
      types.forEach((t: VarType) => expectType(t, 'number', `each side of ${n.ops.join(' ')}`));
      return 'number';
    }
    case 'call':
      return typeOfCall(n, lookup);
    default:
      throw new ExprError('unknown expression');
  }
}

function arity(n: ExprNode, min: number, max: number): void {
  const count = n.args.length;
  if (count < min || count > max) {
    const want = min === max ? `${min}` : `${min} to ${max}`;
    throw new ExprError(`${n.name}() takes ${want} argument${max === 1 ? '' : 's'}, got ${count}`);
  }
}

function typeOfCall(n: ExprNode, lookup: TypeLookup): VarType {
  const types = n.args.map((a: ExprNode) => typeOf(a, lookup));
  switch (n.name) {
    case 'if': {
      arity(n, 3, 3);
      expectType(types[0], 'bool', 'the condition of if()');
      if (types[1] !== types[2]) {
        throw new ExprError(`both branches of if() must have the same type, got ${types[1]} and ${types[2]}`);
      }
      return types[1];
    }
    case 'min':
    case 'max':
      arity(n, 2, 10);
      types.forEach((t: VarType) => expectType(t, 'number', `each argument of ${n.name}()`));
      return 'number';
    case 'round':
      arity(n, 1, 2);
      types.forEach((t: VarType) => expectType(t, 'number', 'each argument of round()'));
      return 'number';
    case 'abs':
      arity(n, 1, 1);
      expectType(types[0], 'number', 'the argument of abs()');
      return 'number';
    case 'len':
      arity(n, 1, 1);
      if (types[0] !== 'list' && types[0] !== 'text') {
        throw new ExprError(`len() needs a list or text, got ${types[0]}`);
      }
      return 'number';
    default:
      throw new ExprError(`unknown function "${n.name}"`);
  }
}

// ---- Templates ----

/** A display template piece: literal text, or an expression source to evaluate. */
export interface TemplatePart {
  literal: string;
  expr: string;
  isExpr: boolean;
}

function part(): TemplatePart {
  return { literal: '', expr: '', isExpr: false };
}

/** Splits "{a} - {b}" into parts. "{{" and "}}" are literal braces. Throws ExprError. */
export function parseTemplate(template: string): TemplatePart[] {
  const parts: TemplatePart[] = [];
  let lit = '';
  let i = 0;
  const flush = (): void => {
    if (lit.length > 0) {
      const p = part();
      p.literal = lit;
      parts.push(p);
      lit = '';
    }
  };
  while (i < template.length) {
    const ch = template.charAt(i);
    if (ch === '{' && template.charAt(i + 1) === '{') {
      lit += '{';
      i += 2;
    } else if (ch === '}' && template.charAt(i + 1) === '}') {
      lit += '}';
      i += 2;
    } else if (ch === '}') {
      throw new ExprError(`unmatched "}" at position ${i + 1}; write "}}" for a literal brace`);
    } else if (ch === '{') {
      // Find the closing brace, skipping quoted text inside the expression.
      let j = i + 1;
      let quote = '';
      while (j < template.length) {
        const c = template.charAt(j);
        if (quote.length > 0) {
          if (c === '\\') {
            j++;
          } else if (c === quote) {
            quote = '';
          }
        } else if (c === "'" || c === '"') {
          quote = c;
        } else if (c === '}') {
          break;
        }
        j++;
      }
      if (j >= template.length) {
        throw new ExprError(`unclosed "{" at position ${i + 1}`);
      }
      flush();
      const p = part();
      p.expr = template.substring(i + 1, j);
      p.isExpr = true;
      parts.push(p);
      i = j + 1;
    } else {
      lit += ch;
      i++;
    }
  }
  flush();
  return parts;
}

/** Kept for API parity with the app; the web marketplace never executes capsules. */
export function typeOfValue(v: Value): VarType {
  if (Array.isArray(v)) {
    return 'list';
  }
  if (typeof v === 'number') {
    return 'number';
  }
  if (typeof v === 'boolean') {
    return 'bool';
  }
  return 'text';
}

export type { Scalar, Value };
