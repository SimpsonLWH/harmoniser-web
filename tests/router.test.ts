/** Mirrors entry/src/test/CapsuleRouter.test.ets using JSON-built capsules. */

import { describe, expect, it } from "vitest";

import { routeCapsule, validateCapsule } from "@/lib/validator";
import type { Capsule } from "@/lib/validator";

function fromJson(ui: string, permissions = "[]"): Capsule {
  const result = validateCapsule(`{"schemaVersion":0,"id":"x","name":"X","permissions":${permissions},"ui":${ui}}`);
  expect(result.errors.join("\n")).toBe("");
  return result.capsule as Capsule;
}

describe("CapsuleRouter (parity with the app)", () => {
  it("routes small v0 capsules to widgets", () => {
    const route = routeCapsule(
      fromJson(
        '[{"type":"text","text":"Dinner"},{"type":"timer","id":"t","label":"Pasta","minutes":9},{"type":"button","label":"Start","action":"startTimer:t"}]',
        '["reminders"]',
      ),
    );
    expect(route.widget).toBe(true);
    expect(route.reason).toContain("Widget-suitable");
  });

  it("sends capsules with more than 4 components to the app", () => {
    const route = routeCapsule(
      fromJson(
        '[{"type":"text","text":"a"},{"type":"text","text":"b"},{"type":"text","text":"c"},{"type":"text","text":"d"},{"type":"text","text":"e"}]',
      ),
    );
    expect(route.widget).toBe(false);
    expect(route.reason).toBe("App only: 5 components (a widget fits at most 4).");
  });

  it("sends capsules with number inputs to the app", () => {
    const route = routeCapsule(fromJson('[{"type":"number","id":"n","label":"Guests"}]'));
    expect(route.widget).toBe(false);
    expect(route.reason).toContain("number inputs");
  });

  it("allows checklists up to 6 items, not 7", () => {
    expect(routeCapsule(fromJson('[{"type":"checklist","id":"c","items":["1","2","3","4","5","6"]}]')).widget).toBe(true);
    const seven = routeCapsule(fromJson('[{"type":"checklist","id":"c","items":["1","2","3","4","5","6","7"]}]'));
    expect(seven.widget).toBe(false);
    expect(seven.reason).toContain("7 items");
  });

  it("sends an empty capsule and schema v1 capsules to the app", () => {
    expect(routeCapsule(fromJson("[]")).widget).toBe(false);
    const v1 = validateCapsule(
      '{"schemaVersion":1,"id":"x","name":"X","permissions":[],"state":{"n":{"type":"number","initial":0}},"ui":[{"type":"text","text":"a"}]}',
    );
    expect(v1.ok).toBe(true);
    const route = routeCapsule(v1.capsule as Capsule);
    expect(route.widget).toBe(false);
    expect(route.reason).toContain("state");
  });
});
