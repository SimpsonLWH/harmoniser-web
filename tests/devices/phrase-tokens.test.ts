import { describe, expect, it } from "vitest";

import {
  BLOCKED_WORDS,
  CODE_PATTERN,
  CODE_WORDS,
  generateCode,
  normaliseCode,
  parseCode,
} from "@/lib/devices/phrase";
import { deviceTokenMatches, hashDeviceToken, newDeviceId, newDeviceToken, parseBearer } from "@/lib/devices/tokens";
import { hashPrincipal, hashToken } from "@/lib/ownership";
import { EFF_SHORT_WORDLIST } from "@/lib/devices/wordlist";

describe("word list", () => {
  it("is the EFF short list: 1,296 different words, first and last as published", () => {
    expect(EFF_SHORT_WORDLIST).toHaveLength(1296);
    expect(new Set(EFF_SHORT_WORDLIST).size).toBe(1296);
    expect(EFF_SHORT_WORDLIST[0]).toBe("acid");
    expect(EFF_SHORT_WORDLIST[1295]).toBe("zoom");
  });

  it("leaves out the hyphenated word and every blocked word", () => {
    const leftOut = EFF_SHORT_WORDLIST.filter((word) => !CODE_WORDS.includes(word));
    expect(leftOut.sort()).toEqual(["yo-yo", ...BLOCKED_WORDS].sort());
    expect(CODE_WORDS.every((word) => /^[a-z]{3,5}$/.test(word))).toBe(true);
  });

  it("has a blocklist of real EFF words that never reach a code", () => {
    expect(BLOCKED_WORDS.length).toBeGreaterThan(50);
    expect(new Set(BLOCKED_WORDS).size).toBe(BLOCKED_WORDS.length);
    for (const word of BLOCKED_WORDS) {
      expect(EFF_SHORT_WORDLIST).toContain(word);
      expect(CODE_WORDS).not.toContain(word);
    }
  });

  it("cannot draw the words of a phrase that was seen in the wild", () => {
    for (const word of ["islam", "goofy", "evil"]) {
      if (BLOCKED_WORDS.includes(word)) {
        expect(CODE_WORDS).not.toContain(word);
      }
    }
    expect(CODE_WORDS).not.toContain("islam");
    expect(CODE_WORDS).not.toContain("evil");
  });
});

describe("generateCode", () => {
  it("makes three words the board can show (at most 32 bytes) and the test script accepts", () => {
    for (let i = 0; i < 500; i++) {
      const code = generateCode();
      expect(code).toMatch(CODE_PATTERN);
      expect(code.length).toBeLessThanOrEqual(17);
      expect(code.split("-").every((word) => CODE_WORDS.includes(word))).toBe(true);
      expect(code.split("-").some((word) => BLOCKED_WORDS.includes(word))).toBe(false);
    }
  });

  it("asks the random source for an index into the whole list, three times", () => {
    const asked: number[] = [];
    const picks = [0, CODE_WORDS.length - 1, 1];
    const code = generateCode((max) => {
      asked.push(max);
      return picks[asked.length - 1] ?? 0;
    });
    expect(asked).toEqual([CODE_WORDS.length, CODE_WORDS.length, CODE_WORDS.length]);
    expect(code).toBe(`acid-zoom-acorn`);
  });

  it("does not repeat itself", () => {
    const codes = new Set(Array.from({ length: 200 }, () => generateCode()));
    expect(codes.size).toBeGreaterThan(195);
  });
});

describe("normaliseCode and parseCode", () => {
  it.each([
    ["brave-otter-lamp", "brave-otter-lamp"],
    ["Brave Otter Lamp", "brave-otter-lamp"],
    ["  BRAVE  otter-LAMP \n", "brave-otter-lamp"],
    ["brave - otter - lamp", "brave-otter-lamp"],
    ["brave\totter--lamp", "brave-otter-lamp"],
  ])("%j -> %s", (typed, code) => {
    expect(normaliseCode(typed)).toBe(code);
    expect(parseCode(typed)).toBe(code);
  });

  it.each([
    "123456",
    "only-two",
    "one-two-three-four",
    "",
    "   ",
    "brave_otter_lamp",
    "bravest-otter-lamp",
    "br-otter-lamp",
    "brave-otter-lamp/../x",
    "brave-ötter-lamp",
    "a".repeat(65),
    42,
    null,
    undefined,
    ["brave-otter-lamp"],
  ])("refuses %j", (typed) => {
    expect(parseCode(typed)).toBeNull();
  });
});

describe("tokens", () => {
  it("makes tokens the board accepts: 43 characters of the URL-safe alphabet", () => {
    const token = newDeviceToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(newDeviceToken()).not.toBe(token);
  });

  it("makes ids that fit a URL path", () => {
    expect(newDeviceId()).toMatch(/^dev_[0-9a-f]{16}$/);
  });

  it("hashes with HMAC-SHA-256 under the site secret, apart from the user-token hashes", () => {
    const token = newDeviceToken();
    expect(hashDeviceToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashDeviceToken(token)).toBe(hashDeviceToken(token));
    expect(hashDeviceToken(token)).not.toBe(hashToken(token));
    expect(hashDeviceToken(token)).not.toBe(hashPrincipal(token));
  });

  it("matches a token against its hash only", () => {
    const token = newDeviceToken();
    expect(deviceTokenMatches(token, hashDeviceToken(token))).toBe(true);
    expect(deviceTokenMatches(token + "x", hashDeviceToken(token))).toBe(false);
    expect(deviceTokenMatches("", hashDeviceToken(token))).toBe(false);
    expect(deviceTokenMatches(token, "")).toBe(false);
    expect(deviceTokenMatches(token, token)).toBe(false);
  });

  it("compares against a malformed stored hash without throwing", () => {
    expect(deviceTokenMatches("abc", "not hex")).toBe(false);
    expect(deviceTokenMatches("abc", "abcd")).toBe(false);
  });

  it.each([
    ["Bearer abc", "abc"],
    ["bearer abc", "abc"],
    ["BEARER   abc  ", "abc"],
  ])("reads %j", (header, token) => {
    expect(parseBearer(header)).toBe(token);
  });

  it.each([null, undefined, "", "Bearer", "Bearer ", "Basic abc", "abc", "Bearer a b", "Bearer " + "a".repeat(513)])(
    "refuses %j",
    (header) => {
      expect(parseBearer(header)).toBeNull();
    },
  );
});
