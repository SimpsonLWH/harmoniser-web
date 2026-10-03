// Reading an untrusted request body the way the board does (main/validate.c,
// main/capsule_json.c): size, nesting and NUL are checked on the raw bytes before parsing.
import { ERR_BAD_JSON, ERR_HAS_NUL, ERR_TOO_DEEP, ERR_TOO_LARGE, RelayError } from "./errors";

export const MAX_BODY_BYTES = 1024;
export const MAX_JSON_DEPTH = 8;

export type JsonObject = Record<string, unknown>;
export type JsonScan = "ok" | "deep" | "nul";

const QUOTE = 0x22;
const BACKSLASH = 0x5c;
const U0000 = [0x75, 0x30, 0x30, 0x30, 0x30]; // "u0000"

function isEscapedNul(body: Uint8Array, backslashAt: number): boolean {
  if (body.length - backslashAt <= U0000.length) {
    return false;
  }
  return U0000.every((byte, offset) => body[backslashAt + 1 + offset] === byte);
}

// Byte for byte the same as json_scan() in the firmware; tests/vectors/json_scan.txt there
// holds this port to it (tests/core.json.test.ts).
export function jsonScan(body: Uint8Array, maxDepth: number = MAX_JSON_DEPTH): JsonScan {
  let depth = 0;
  let inString = false;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === 0) {
      return "nul";
    }
    if (inString) {
      if (c === BACKSLASH) {
        if (isEscapedNul(body, i)) {
          return "nul";
        }
        i++; // whatever is escaped, it cannot end the string
      } else if (c === QUOTE) {
        inString = false;
      }
    } else if (c === QUOTE) {
      inString = true;
    } else if (c === 0x5b || c === 0x7b) {
      depth += 1;
      if (depth > maxDepth) {
        return "deep";
      }
    } else if ((c === 0x5d || c === 0x7d) && depth > 0) {
      depth -= 1;
    }
  }
  return "ok";
}

// True if the string has no lone surrogate. JSON.parse lets "\ud83d" through; the board's
// parser refuses the whole body.
export function isWellFormed(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    const unit = text.charCodeAt(i);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = text.charCodeAt(i + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        return false;
      }
      i++;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      return false;
    }
  }
  return true;
}

function allStringsWellFormed(value: unknown): boolean {
  if (typeof value === "string") {
    return isWellFormed(value);
  }
  if (Array.isArray(value)) {
    return value.every(allStringsWellFormed);
  }
  if (value !== null && typeof value === "object") {
    return Object.entries(value).every(([key, item]) => isWellFormed(key) && allStringsWellFormed(item));
  }
  return true;
}

// The body as one JSON object, or a RelayError (413 or 400).
export function parseJsonObject(body: Uint8Array, maxBytes: number = MAX_BODY_BYTES): JsonObject {
  if (body.length > maxBytes) {
    throw new RelayError(ERR_TOO_LARGE);
  }
  const scan = jsonScan(body);
  if (scan === "deep") {
    throw new RelayError(ERR_TOO_DEEP);
  }
  if (scan === "nul") {
    throw new RelayError(ERR_HAS_NUL);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
  } catch {
    throw new RelayError(ERR_BAD_JSON);
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed) || !allStringsWellFormed(parsed)) {
    throw new RelayError(ERR_BAD_JSON);
  }
  return parsed as JsonObject;
}

// An own property of a parsed body. Never a member of Object.prototype.
export function field(body: JsonObject, key: string): unknown {
  return Object.hasOwn(body, key) ? body[key] : undefined;
}

export function hasField(body: JsonObject, key: string): boolean {
  return Object.hasOwn(body, key);
}
