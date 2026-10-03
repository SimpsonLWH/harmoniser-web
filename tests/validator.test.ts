/**
 * Mirrors entry/src/test/CapsuleValidator.test.ets from the pinned upstream commit, so a change in
 * the app's validator shows up here as a failing expectation to re-check.
 */

import { describe, expect, it } from "vitest";

import { parseAction, validateCapsule } from "@/lib/validator";
import type { CounterComponent, TimerComponent } from "@/lib/validator";

const VALID = `{
  "schemaVersion": 0,
  "id": "pasta",
  "name": "Pasta night",
  "permissions": ["reminders", "motion", "notifications"],
  "ui": [
    { "type": "text", "text": "Dinner" },
    { "type": "timer", "id": "pasta", "label": "Pasta", "minutes": 9 },
    { "type": "counter", "id": "squats", "label": "Squats", "source": "motion" },
    { "type": "checklist", "id": "shop", "items": ["Basil", "Garlic"] },
    { "type": "number", "id": "guests", "label": "Guests" },
    { "type": "button", "label": "Start", "action": "startTimer:pasta" },
    { "type": "button", "label": "Start all", "action": "startAllTimers" },
    { "type": "button", "label": "+1", "action": "increment:squats" },
    { "type": "button", "label": "Reset", "action": "reset:squats" },
    { "type": "button", "label": "Ping", "action": "notify:Dinner is ready" }
  ]
}`;

function withUi(permissions: string, ui: string): string {
  return `{"schemaVersion":0,"id":"x","name":"X","permissions":${permissions},"ui":${ui}}`;
}

function errorsOf(json: string): string {
  return validateCapsule(json).errors.join("\n");
}

describe("CapsuleValidator (v0, parity with the app)", () => {
  it("accepts a valid capsule using every component and action", () => {
    const result = validateCapsule(VALID);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.capsule?.ui).toHaveLength(10);
    expect((result.capsule?.ui[1] as TimerComponent).minutes).toBe(9);
    expect((result.capsule?.ui[2] as CounterComponent).source).toBe("motion");
  });

  it("rejects bad JSON", () => {
    const result = validateCapsule('{"schemaVersion": 0, "id": ');
    expect(result.ok).toBe(false);
    expect(result.capsule).toBeUndefined();
    expect(result.errors[0]).toContain("not valid JSON");
  });

  it("rejects JSON that is not an object", () => {
    expect(errorsOf("[1,2]")).toContain("capsule must be a JSON object, got an array");
  });

  it("rejects an unknown component type", () => {
    expect(errorsOf(withUi("[]", '[{"type":"slider","id":"s","label":"S"}]'))).toContain(
      '$.ui[0].type: unknown component type "slider"',
    );
  });

  it("rejects v1 components without schemaVersion 1", () => {
    expect(errorsOf(withUi("[]", '[{"type":"display","text":"hi"}]'))).toContain(
      '"display" needs "schemaVersion": 1',
    );
  });

  it("rejects an unknown action", () => {
    expect(errorsOf(withUi("[]", '[{"type":"button","label":"Go","action":"launchRocket:now"}]'))).toContain(
      '$.ui[0].action: unknown action "launchRocket:now"',
    );
  });

  it("rejects a component needing an unlisted permission", () => {
    expect(errorsOf(withUi("[]", '[{"type":"timer","id":"t","label":"T","minutes":5}]'))).toContain(
      'timer "t" needs permission "reminders", which is not listed',
    );
  });

  it("rejects a motion counter without the motion permission", () => {
    expect(errorsOf(withUi('["reminders"]', '[{"type":"counter","id":"c","label":"C","source":"motion"}]'))).toContain(
      'needs permission "motion"',
    );
    expect(validateCapsule(withUi("[]", '[{"type":"counter","id":"c","label":"C","source":"manual"}]')).ok).toBe(true);
  });

  it("rejects an action needing an unlisted permission", () => {
    expect(errorsOf(withUi("[]", '[{"type":"button","label":"Ping","action":"notify:hi"}]'))).toContain(
      'action "notify:hi" needs permission "notifications"',
    );
  });

  it("rejects unknown and missing fields", () => {
    const errs = errorsOf('{"schemaVersion":0,"id":"x","name":"X","ui":[],"script":"alert(1)"}');
    expect(errs).toContain('$: unknown field "script"');
    expect(errs).toContain('$: missing required field "permissions"');
    expect(errorsOf(withUi("[]", '[{"type":"text","text":"hi","color":"red"}]'))).toContain(
      '$.ui[0]: unknown field "color"',
    );
  });

  it("rejects wrong schemaVersion, unknown permission and bad values", () => {
    expect(errorsOf('{"schemaVersion":2,"id":"x","name":"X","permissions":[],"ui":[]}')).toContain(
      "$.schemaVersion: must be 0 or 1",
    );
    expect(errorsOf(withUi('["camera"]', "[]"))).toContain('unknown permission "camera"');
    expect(errorsOf(withUi('["reminders"]', '[{"type":"timer","id":"t","label":"T","minutes":-1}]'))).toContain(
      "$.ui[0].minutes: must be a positive number",
    );
    expect(errorsOf(withUi("[]", '[{"type":"checklist","id":"c","items":[]}]'))).toContain(
      "must contain at least one item",
    );
  });

  it("rejects actions pointing at missing or wrong targets, and duplicate ids", () => {
    expect(errorsOf(withUi('["reminders"]', '[{"type":"button","label":"Go","action":"startTimer:nope"}]'))).toContain(
      'refers to id "nope", which does not exist',
    );
    expect(
      errorsOf(
        withUi(
          '["reminders"]',
          '[{"type":"number","id":"n","label":"N"},{"type":"button","label":"Go","action":"startTimer:n"}]',
        ),
      ),
    ).toContain('needs a timer, but "n" is a number');
    expect(
      errorsOf(withUi("[]", '[{"type":"number","id":"n","label":"A"},{"type":"number","id":"n","label":"B"}]')),
    ).toContain('$.ui[1].id: duplicate id "n"');
  });

  it("parses actions, including the v1.1 timer actions", () => {
    expect(parseAction("startAllTimers")?.kind).toBe("startAllTimers");
    expect(parseAction("notify:a:b")?.arg).toBe("a:b");
    expect(parseAction("pauseTimer:t")?.kind).toBe("pauseTimer");
    expect(parseAction("stopTimer:t")?.kind).toBe("stopTimer");
    expect(parseAction("resetTimer:t")?.kind).toBe("resetTimer");
    expect(parseAction("increment:")).toBeNull();
    expect(parseAction("startAllTimers:x")).toBeNull();
  });

  it("accepts the new timer actions against a timer with reminders", () => {
    const json = withUi(
      '["reminders"]',
      '[{"type":"timer","id":"t","label":"T","minutes":5},{"type":"button","label":"Pause","action":"pauseTimer:t"}]',
    );
    expect(validateCapsule(json).ok).toBe(true);
  });

  it("rejects literal {placeholders} outside a display component", () => {
    expect(errorsOf(withUi("[]", '[{"type":"text","text":"Reading streak: {streak}"}]'))).toContain(
      "would be shown literally",
    );
  });
});
