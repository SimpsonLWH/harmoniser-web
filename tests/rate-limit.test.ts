import { describe, expect, it } from "vitest";

import { BUCKET_CLEANUP_MS, bucketKey, PUBLISH_LIMIT, PUBLISH_WINDOW_MS } from "@/lib/rate-limit";

describe("rate-limit buckets", () => {
  it("groups requests into one-hour windows", () => {
    const now = Date.parse("2026-10-03T20:00:00Z");
    const a = bucketKey("publish", "203.0.113.7", now);
    const b = bucketKey("publish", "203.0.113.7", now + PUBLISH_WINDOW_MS - 1);
    const c = bucketKey("publish", "203.0.113.7", now + PUBLISH_WINDOW_MS);
    expect(a.key).toBe(b.key);
    expect(a.key).not.toBe(c.key);
    expect(c.windowStart - a.windowStart).toBe(PUBLISH_WINDOW_MS);
  });

  it("separates routes and addresses", () => {
    const now = Date.parse("2026-10-03T20:00:00Z");
    expect(bucketKey("publish", "203.0.113.7", now).key).not.toBe(bucketKey("publish", "203.0.113.8", now).key);
    expect(bucketKey("publish", "203.0.113.7", now).key).not.toBe(bucketKey("report", "203.0.113.7", now).key);
  });

  it("never stores the raw address", () => {
    const { key } = bucketKey("publish", "203.0.113.7", Date.now());
    expect(key).not.toContain("203.0.113.7");
    expect(key).toMatch(/^[0-9a-f]{64}$/);
  });

  it("keeps the stated limits", () => {
    expect(PUBLISH_LIMIT).toBe(10);
    expect(BUCKET_CLEANUP_MS).toBeGreaterThan(PUBLISH_WINDOW_MS);
  });
});
