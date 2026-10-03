/**
 * Mirrors the parse/type/template/name half of entry/src/test/Expr.test.ets. Evaluation stays on
 * the device, so the evalExpr cases are intentionally not ported.
 */

import { describe, expect, it } from "vitest";

import { ExprError, isValidName, namesIn, parseExpr, parseTemplate, typeOf } from "@/lib/validator";
import type { Value, VarType } from "@/lib/validator";

const VALUES: Record<string, Value> = {
  a: 7,
  b: 2,
  name: "Ash",
  on: true,
  off: false,
  items: ["milk", "eggs"],
  zero: 0,
};

function lookupType(n: string): VarType | null {
  const v = VALUES[n];
  if (v === undefined) {
    return null;
  }
  return Array.isArray(v) ? "list" : typeof v === "number" ? "number" : typeof v === "boolean" ? "bool" : "text";
}

function parseError(src: string): string {
  try {
    parseExpr(src);
    return "";
  } catch (e) {
    return e instanceof ExprError ? e.message : String(e);
  }
}

function typeError(src: string): string {
  try {
    typeOf(parseExpr(src), lookupType);
    return "";
  } catch (e) {
    return e instanceof ExprError ? e.message : String(e);
  }
}

describe("Expr (parity with the app)", () => {
  it("rejects syntax errors with clear messages", () => {
    expect(parseError("a = 1")).toContain("use == to compare");
    expect(parseError("1 +")).toContain("unexpected the end");
    expect(parseError("(1 + 2")).toContain('expected ")"');
    expect(parseError("sqrt(4)")).toContain('unknown function "sqrt"');
    expect(parseError("a < b < 3")).toContain("cannot be chained");
    expect(parseError("'open")).toContain("unterminated text");
    expect(parseError("a $ b")).toContain('unexpected character "$"');
    expect(parseError("")).toContain("empty expression");
  });

  it("enforces the 200 character and depth limits", () => {
    expect(parseError("1" + " + 1".repeat(60))).toContain("max 200");
    expect(parseError("1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1")).toBe("");
    const nine = "abs(".repeat(9) + "1" + ")".repeat(9);
    const ten = "abs(".repeat(10) + "1" + ")".repeat(10);
    expect(parseError(nine)).toBe("");
    expect(parseError(ten)).toContain("nested too deeply");
  });

  it("type-checks names, operators and function arguments", () => {
    expect(typeError("a + b")).toBe("");
    expect(typeError("missing + 1")).toContain('unknown name "missing"');
    expect(typeError("a and on")).toContain("must be bool, got number");
    expect(typeError("name < 3")).toContain("must be number, got text");
    expect(typeError("if(on, 1, 'x')")).toContain("same type");
    expect(typeError("if(a, 1, 2)")).toContain("condition of if() must be bool");
    expect(typeError("len(a)")).toContain("needs a list or text");
    expect(typeError("items + 1")).toContain("lists cannot be used");
    expect(typeError("a == name")).toContain("cannot compare number with text");
    expect(typeError("min(a)")).toContain("takes 2 to 10 arguments");
  });

  it("parses display templates, including quoted braces", () => {
    const parts = parseTemplate("{p1} - {p2} {{braces}} {if(on, '}', 'x')}");
    expect(parts.map((p) => (p.isExpr ? `[${p.expr}]` : p.literal)).join("")).toBe(
      "[p1] - [p2] {braces} [if(on, '}', 'x')]",
    );
    let message = "";
    try {
      parseTemplate("{a");
    } catch (e) {
      message = e instanceof ExprError ? e.message : String(e);
    }
    expect(message).toContain('unclosed "{"');
  });

  it("checks names and lists the names in an expression", () => {
    expect(isValidName("p1")).toBe(true);
    expect(isValidName("_tip")).toBe(true);
    expect(isValidName("1p")).toBe(false);
    expect(isValidName("if")).toBe(false);
    expect(isValidName("a-b")).toBe(false);
    expect(namesIn(parseExpr("a + b + a"))).toEqual(["a", "b"]);
  });
});
