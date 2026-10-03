/** GET /api/capsules query parsing and pagination, without a database. */

import { describe, expect, it } from "vitest";

import { buildListFilter, pageOf, parseInclude, parseLimit } from "@/lib/list-query";

const id = (n: number): string => n.toString(16).padStart(24, "0");
const rows = (count: number): { _id: string }[] =>
  Array.from({ length: count }, (_, i) => ({ _id: id(count - i) }));

describe("parseLimit", () => {
  it("defaults to 20 and accepts whole numbers up to 50", () => {
    expect(parseLimit(null)).toEqual({ ok: true, limit: 20 });
    expect(parseLimit("1")).toEqual({ ok: true, limit: 1 });
    expect(parseLimit("50")).toEqual({ ok: true, limit: 50 });
  });

  it("rejects prefixes, exponents and anything out of range", () => {
    for (const raw of ["10junk", "1e2", "0x10", "1.5", "", " 12x", "51", "0", "-1", "abc"]) {
      expect(parseLimit(raw).ok, raw).toBe(false);
    }
    // Surrounding whitespace is trimmed, as elsewhere in the query parsing.
    expect(parseLimit(" 12 ")).toEqual({ ok: true, limit: 12 });
  });
});

describe("parseInclude", () => {
  it("defaults to no inline payloads and accepts only include=capsule", () => {
    expect(parseInclude(null)).toEqual({ ok: true, includeCapsule: false });
    expect(parseInclude("")).toEqual({ ok: true, includeCapsule: false });
    expect(parseInclude("capsule")).toEqual({ ok: true, includeCapsule: true });
    expect(parseInclude(" capsule ")).toEqual({ ok: true, includeCapsule: true });
  });

  it("refuses unknown include values rather than ignoring them", () => {
    for (const raw of ["capsules", "all", "1", "capsule,owner"]) {
      expect(parseInclude(raw).ok, raw).toBe(false);
    }
  });
});

describe("pageOf", () => {
  it("returns at most limit rows and never the look-ahead record", () => {
    const page = pageOf(rows(6), 5);
    expect(page.items).toHaveLength(5);
    expect(page.items.map((row) => row._id)).toEqual([id(6), id(5), id(4), id(3), id(2)]);
    expect(page.nextCursorId).toBe(id(2));
  });

  it("has no cursor on an empty page or the final page", () => {
    expect(pageOf([], 20)).toEqual({ items: [], nextCursorId: null });
    expect(pageOf(rows(3), 20)).toEqual({ items: rows(3), nextCursorId: null });
  });

  it("walks a set exactly once, in id order, when each cursor feeds the next filter", () => {
    const all = rows(7);
    const seen: string[] = [];
    let cursor: string | null = null;
    for (let guard = 0; guard < 10; guard += 1) {
      const filter = buildListFilter({ q: "", tag: "", cursorId: cursor });
      const matching = all.filter((row) => {
        const below = (filter._id as { $lt?: string } | undefined)?.$lt;
        return below === undefined || row._id < below;
      });
      const page = pageOf(matching.concat(matching.length > 3 ? [{ _id: "extra" }] : []).slice(0, 4), 3);
      seen.push(...page.items.map((row) => row._id));
      if (page.nextCursorId === null) {
        break;
      }
      cursor = String(page.nextCursorId);
    }
    expect(seen).toEqual(all.map((row) => row._id));
  });
});

describe("buildListFilter", () => {
  it("always restricts to visible capsules", () => {
    expect(buildListFilter({ q: "", tag: "", cursorId: null })).toEqual({ status: "visible" });
  });

  it("adds the tag, cursor and text filters it is given", () => {
    expect(buildListFilter({ q: "pasta", tag: "cooking", cursorId: id(9) })).toEqual({
      status: "visible",
      tags: "cooking",
      _id: { $lt: id(9) },
      $text: { $search: "pasta" },
    });
  });
});
