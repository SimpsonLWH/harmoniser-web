import { describe, expect, it } from "vitest";

import { canonicalJson, contentHash, utf8Bytes } from "@/lib/canonical";

describe("canonical JSON and content hashes", () => {
  it("sorts object keys at every level so hashes are stable", () => {
    const a = { b: 1, a: { d: [2, 3], c: "x" } };
    const b = { a: { c: "x", d: [2, 3] }, b: 1 };
    expect(canonicalJson(a)).toBe(canonicalJson(b));
    expect(contentHash(a)).toBe(contentHash(b));
  });

  it("keeps array order significant", () => {
    expect(contentHash({ ui: [1, 2] })).not.toBe(contentHash({ ui: [2, 1] }));
  });

  it("measures UTF-8 bytes, not JavaScript characters", () => {
    expect(utf8Bytes("é")).toBe(2);
    expect(utf8Bytes("🙂")).toBe(4);
    expect(utf8Bytes("abc")).toBe(3);
  });

  it("produces a 64-character hex digest", () => {
    expect(contentHash({ a: 1 })).toMatch(/^[0-9a-f]{64}$/);
  });
});
