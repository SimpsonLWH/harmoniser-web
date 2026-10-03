/**
 * Mirrors entry/src/test/CapsuleV1.test.ets and the v1.1 trigger rules from the pinned validator.
 */

import { describe, expect, it } from "vitest";

import { validateCapsule, validateCapsuleObject } from "@/lib/validator";

const SHOPPING = `{
  "schemaVersion": 1, "id": "shop", "name": "Shopping", "permissions": [],
  "state": { "item": { "type": "text", "initial": "" }, "items": { "type": "list", "initial": [] } },
  "ui": [
    { "type": "input", "bind": "item", "kind": "text", "label": "Item" },
    { "type": "button", "label": "Add", "enabledIf": "len(item) > 0",
      "do": [ { "push": "items", "value": "item" }, { "set": "item", "to": "''" } ] },
    { "type": "button", "label": "Undo", "enabledIf": "len(items) > 0", "do": [ { "pop": "items" } ] },
    { "type": "display", "text": "{len(items)} items" },
    { "type": "list", "source": "items" }
  ]
}`;

const TENNIS = `{
  "schemaVersion": 1, "id": "tennis", "name": "Tennis scoreboard", "permissions": [],
  "state": {
    "p1": { "type": "number", "initial": 0 }, "p2": { "type": "number", "initial": 0 },
    "g1": { "type": "number", "initial": 0 }, "g2": { "type": "number", "initial": 0 }
  },
  "computed": {
    "deuce": "p1 >= 3 and p1 == p2",
    "adv1": "p1 >= 3 and p2 >= 3 and p1 == p2 + 1",
    "adv2": "p1 >= 3 and p2 >= 3 and p2 == p1 + 1",
    "call1": "if(p1 >= 3 and p2 >= 3, if(adv1, 'AD', '40'), if(p1 == 0, '0', if(p1 == 1, '15', if(p1 == 2, '30', '40'))))",
    "call2": "if(p1 >= 3 and p2 >= 3, if(adv2, 'AD', '40'), if(p2 == 0, '0', if(p2 == 1, '15', if(p2 == 2, '30', '40'))))",
    "status": "if(deuce, 'Deuce', if(adv1, 'Advantage P1', if(adv2, 'Advantage P2', call1 + ' - ' + call2)))"
  },
  "ui": [
    { "type": "display", "text": "Games {g1} - {g2}" },
    { "type": "display", "text": "{status}" },
    { "type": "row", "items": [
      { "type": "button", "label": "Point P1", "do": [
        { "set": "g1", "to": "if(p1 >= 3 and p1 > p2, g1 + 1, g1)" },
        { "set": "p2", "to": "if(p1 >= 3 and p1 > p2, 0, p2)" },
        { "set": "p1", "to": "if(p1 >= 3 and p1 > p2, 0, p1 + 1)" } ] },
      { "type": "button", "label": "Point P2", "do": [
        { "set": "g2", "to": "if(p2 >= 3 and p2 > p1, g2 + 1, g2)" },
        { "set": "p1", "to": "if(p2 >= 3 and p2 > p1, 0, p1)" },
        { "set": "p2", "to": "if(p2 >= 3 and p2 > p1, 0, p2 + 1)" } ] }
    ] },
    { "type": "when", "if": "g1 + g2 > 0", "show": [
      { "type": "display", "text": "{if(g1 > g2, 'P1 leads', if(g2 > g1, 'P2 leads', 'Level'))}" } ] },
    { "type": "button", "label": "Reset match", "enabledIf": "p1 + p2 + g1 + g2 > 0",
      "do": [ { "reset": "p1" }, { "reset": "p2" }, { "reset": "g1" }, { "reset": "g2" } ] }
  ]
}`;

function errors(json: string): string {
  return validateCapsule(json).errors.join("\n");
}

function v1(extra: string, ui = "[]"): string {
  return `{"schemaVersion":1,"id":"x","name":"X","permissions":["reminders","motion"]${extra},"ui":${ui}}`;
}

describe("CapsuleValidator (v1 parity)", () => {
  it("accepts the app's v1 fixtures", () => {
    expect(errors(SHOPPING)).toBe("");
    expect(errors(TENNIS)).toBe("");
  });

  it("rejects unknown names and wrong types", () => {
    expect(errors(v1(',"state":{"n":{"type":"number","initial":0}}', '[{"type":"display","text":"{missing + 1}"}]'))).toContain(
      'unknown name "missing"',
    );
    expect(errors(v1(',"state":{"n":{"type":"text","initial":"a"}}', '[{"type":"when","if":"n > 1","show":[]}]'))).toContain(
      "must be number, got text",
    );
    expect(errors(v1(',"state":{"n":{"type":"number","initial":0}}', '[{"type":"input","bind":"n","kind":"text","label":"N"}]'))).toContain(
      'a text input cannot bind "n", which is number',
    );
  });

  it("rejects computed cycles and bad initial values", () => {
    expect(errors(v1(',"computed":{"a":"b + 1","b":"a + 1"}'))).toContain("computed values form a cycle");
    expect(errors(v1(',"state":{"n":{"type":"number","initial":"no"}}'))).toContain("must be a number, got");
    expect(
      errors('{"schemaVersion":1,"id":"x","name":"X","permissions":["reminders","reminders"],"ui":[]}'),
    ).toContain('duplicate permission "reminders"');
  });

  it("rejects duplicates between state and computed", () => {
    expect(errors(v1(',"state":{"n":{"type":"number","initial":0}},"computed":{"n":"1"}'))).toContain(
      "is already a state variable",
    );
  });

  it("enforces the state, computed, step, nesting and component limits", () => {
    const state: Record<string, unknown> = {};
    for (let i = 0; i < 30; i += 1) {
      state[`v${i}`] = { type: "number", initial: 0 };
    }
    expect(validateCapsuleObject(JSON.parse(v1(`,"state":${JSON.stringify(state)}`))).ok).toBe(true);
    state.v30 = { type: "number", initial: 0 };
    expect(errors(v1(`,"state":${JSON.stringify(state)}`))).toContain("has 31 variables (max 30)");

    const longDo = Array.from({ length: 21 }, () => ({ push: "items", value: "1" }));
    expect(
      errors(
        v1(
          ',"state":{"items":{"type":"list","initial":[]}}',
          `[{"type":"button","label":"Too many","do":${JSON.stringify(longDo)}}]`,
        ),
      ),
    ).toContain("has 21 steps (max 20)");

    const text = { type: "text", text: "hi" };
    const many = Array.from({ length: 61 }, () => text);
    expect(errors(v1("", JSON.stringify(many)))).toContain("has 61 components including nested ones (max 60)");

    const fourDeep = { type: "when", if: "true", show: [{ type: "when", if: "true", show: [{ type: "when", if: "true", show: [{ type: "when", if: "true", show: [text] }] }] }] };
    expect(validateCapsuleObject(JSON.parse(v1("", JSON.stringify([fourDeep])))).ok).toBe(true);
    const fiveDeep = { type: "when", if: "true", show: [fourDeep] };
    expect(errors(v1("", JSON.stringify([fiveDeep])))).toContain("nested too deeply");
  });

  it("accepts a valid time trigger and rejects its mistakes", () => {
    const base = ',"state":{"n":{"type":"number","initial":0}}';
    const good = v1(
      `${base},"triggers":[{"on":"time","at":"08:00","label":"Morning","do":[{"set":"n","to":"n + 1"}]}]`,
    );
    expect(errors(good)).toBe("");

    const noPermission = `{"schemaVersion":1,"id":"x","name":"X","permissions":[],"state":{"n":{"type":"number","initial":0}},"triggers":[{"on":"time","at":"08:00","do":[{"set":"n","to":"n + 1"}]}],"ui":[]}`;
    expect(errors(noPermission)).toContain('a "time" trigger needs permission "reminders"');

    const badTime = v1(`${base},"triggers":[{"on":"time","at":"25:00","do":[{"set":"n","to":"n + 1"}]}]`);
    expect(errors(badTime)).toContain('must be a 24-hour time "HH:MM"');

    const badStep = v1(`${base},"triggers":[{"on":"time","at":"08:00","do":[{"set":"missing","to":"1"}]}]`);
    expect(errors(badStep)).toContain('"missing" is not a state variable');

    const six = v1(
      `${base},"triggers":${JSON.stringify(
        Array.from({ length: 6 }, () => ({ on: "time", at: "08:00", do: [{ set: "n", to: "n + 1" }] })),
      )}`,
    );
    expect(errors(six)).toContain("has 6 triggers (max 5)");
  });

  it("accepts a motion trigger only with the motion permission", () => {
    const withMotion = v1(
      ',"state":{"n":{"type":"number","initial":0}},"triggers":[{"on":"motion","do":[{"set":"n","to":"n + 1"}]}]',
    );
    expect(errors(withMotion)).toBe("");
    const without = `{"schemaVersion":1,"id":"x","name":"X","permissions":[],"state":{"n":{"type":"number","initial":0}},"triggers":[{"on":"motion","do":[{"set":"n","to":"n + 1"}]}],"ui":[]}`;
    expect(errors(without)).toContain('a "motion" trigger needs permission "motion"');
  });
});
