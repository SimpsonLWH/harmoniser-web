/** The public DTOs: default shape unchanged, include=capsule adds exactly one field. */

import { describe, expect, it } from "vitest";

import { toSummary, toSummaryWithCapsule } from "@/lib/dto";

const doc = {
  _id: "65f1c0d0b1a2c3d4e5f6a7b8",
  name: "Squat counter",
  description: "Counts squats.",
  tags: ["fitness"],
  schemaVersion: 0 as const,
  installs: 3,
  capsule: { schemaVersion: 0, id: "squats", name: "Squat counter", permissions: [], ui: [] },
  contentHash: "a".repeat(64),
  ownerTokenHash: "must-not-leave",
  ownerUserId: "must-not-leave",
  reports: 1,
  status: "visible",
  review: { status: "clean", revision: "review-0.1.0", redactions: 0 },
  createdAt: new Date("2026-10-03T20:00:00Z"),
  updatedAt: new Date("2026-10-03T20:00:00Z"),
};

const PRIVATE = ["ownerTokenHash", "ownerUserId", "reports", "status", "contentHash"];

describe("capsule DTOs", () => {
  it("returns the unchanged default summary shape", () => {
    const summary = toSummary(doc);
    expect(Object.keys(summary).sort()).toEqual(
      [
        "id",
        "name",
        "description",
        "tags",
        "schemaVersion",
        "installs",
        "widget",
        "widgetReason",
        "createdAt",
        "updatedAt",
      ].sort(),
    );
    expect(summary).not.toHaveProperty("capsule");
  });

  it("adds the capsule payload only for include=capsule", () => {
    const withCapsule = toSummaryWithCapsule(doc);
    expect(withCapsule.capsule).toEqual(doc.capsule);
    expect(Object.keys(withCapsule).sort()).toEqual([...Object.keys(toSummary(doc)), "capsule"].sort());
  });

  it("never exposes private fields, in either shape", () => {
    for (const dto of [toSummary(doc), toSummaryWithCapsule(doc)]) {
      for (const field of PRIVATE) {
        expect(dto).not.toHaveProperty(field);
      }
      expect(JSON.stringify(dto)).not.toContain("must-not-leave");
    }
  });
});
