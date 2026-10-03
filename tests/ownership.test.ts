import { describe, expect, it } from "vitest";

import { hashPrincipal, hashToken, isValidTokenShape, newToken, tokenMatches } from "@/lib/ownership";

describe("anonymous device tokens", () => {
  it("generates tokens of at least 32 bytes of entropy, base64url shaped", () => {
    const token = newToken();
    expect(token.length).toBeGreaterThanOrEqual(43); // 32 bytes -> 43 base64url chars
    expect(isValidTokenShape(token)).toBe(true);
    expect(newToken()).not.toBe(token);
  });

  it("hashes with the deployment secret and never returns the token", () => {
    const token = newToken();
    const hash = hashToken(token);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain(token);
    expect(hashToken(token)).toBe(hash);
    expect(hashToken(newToken())).not.toBe(hash);
  });

  it("compares tokens in constant time and rejects non-matches", () => {
    const token = newToken();
    const stored = hashToken(token);
    expect(tokenMatches(token, stored)).toBe(true);
    expect(tokenMatches(newToken(), stored)).toBe(false);
    expect(tokenMatches(token, "not-hex")).toBe(false);
  });

  it("keeps the principal hash separate from the owner hash", () => {
    const token = newToken();
    expect(hashPrincipal(token)).not.toBe(hashToken(token));
  });

  it("rejects malformed tokens", () => {
    expect(isValidTokenShape("short")).toBe(false);
    expect(isValidTokenShape("a".repeat(33))).toBe(true);
    expect(isValidTokenShape(`${"a".repeat(33)}!`)).toBe(false);
  });
});
