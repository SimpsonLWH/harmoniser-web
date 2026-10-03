/** The browser's two identities and the migration from the one-token era. */

import { describe, expect, it } from "vitest";

import { resolveTokenState } from "@/lib/client/token";

const LEGACY = "legacy-token-value-that-is-long-enough-abcdef";
const OWNER = "own_existing-owner-token-value-abcdefghij";
const INSTALL = "ins_existing-install-token-value-abcdefghij";

describe("resolveTokenState", () => {
  it("creates two independent tokens for a new browser", () => {
    const generated: string[] = [];
    const result = resolveTokenState({ ownerToken: null, installId: null, legacy: null }, (kind) => {
      const value = `${kind}-${generated.length}`;
      generated.push(value);
      return value;
    });
    expect(result.ownerToken).toBe("owner-0");
    expect(result.installId).toBe("install-1");
    expect(result.persist).toEqual({ ownerToken: "owner-0", installId: "install-1" });
  });

  it("keeps existing two-token browsers exactly as they are", () => {
    const result = resolveTokenState({ ownerToken: OWNER, installId: INSTALL, legacy: null }, () => {
      throw new Error("must not generate");
    });
    expect(result.ownerToken).toBe(OWNER);
    expect(result.installId).toBe(INSTALL);
    expect(result.persist).toEqual({});
  });

  it("migrates a legacy single token into both identities without resetting either", () => {
    const result = resolveTokenState({ ownerToken: null, installId: null, legacy: LEGACY }, () => {
      throw new Error("must not generate");
    });
    expect(result.ownerToken).toBe(LEGACY);
    expect(result.installId).toBe(LEGACY);
    expect(result.persist).toEqual({ ownerToken: LEGACY, installId: LEGACY });
  });

  it("only fills the missing half when a partial migration was interrupted", () => {
    const result = resolveTokenState({ ownerToken: OWNER, installId: null, legacy: LEGACY }, (kind) => {
      expect(kind).toBe("install");
      return "fresh-install";
    });
    expect(result.ownerToken).toBe(OWNER);
    expect(result.installId).toBe(LEGACY);
    expect(result.persist).toEqual({ installId: LEGACY });
  });
});
