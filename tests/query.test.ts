import { describe, expect, it } from "vitest";

import { parseCursor, encodeCursor } from "@/lib/cursor";
import { normalizeDescription, normalizeTags } from "@/lib/tags";

describe("query and metadata validation", () => {
  it("accepts only hex ObjectId cursors", () => {
    const id = "65f1c0d0b1a2c3d4e5f6a7b8";
    expect(parseCursor(encodeCursor(id))).toEqual({ ok: true, id });
    expect(parseCursor(null)).toEqual({ ok: true, id: null });
    expect(parseCursor("not-a-cursor").ok).toBe(false);
    expect(parseCursor("$where").ok).toBe(false);
  });

  it("normalises and bounds tags", () => {
    expect(normalizeTags([" Cooking ", "timer", "timer"])).toEqual({ ok: true, tags: ["cooking", "timer"] });
    expect(normalizeTags(Array.from({ length: 9 }, (_, i) => `t${i}`)).ok).toBe(false);
    expect(normalizeTags(["UPPER CASE"]).ok).toBe(false);
    expect(normalizeTags("timer").ok).toBe(false);
    expect(normalizeTags(undefined)).toEqual({ ok: true, tags: [] });
  });

  it("bounds descriptions", () => {
    expect(normalizeDescription("  hello  ")).toEqual({ ok: true, description: "hello" });
    expect(normalizeDescription("x".repeat(501)).ok).toBe(false);
    expect(normalizeDescription(42).ok).toBe(false);
  });
});
