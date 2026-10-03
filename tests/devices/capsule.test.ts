import { describe, expect, it } from "vitest";

import { ACTIONS, cleanAction, cleanCapsule, cleanLabel, cleanState } from "@/lib/devices/capsule";
import { RelayError } from "@/lib/devices/errors";
import { parseJsonObject } from "@/lib/devices/json";

import { bytes } from "./helpers";

function refused(run: () => unknown): [number, string] | "accepted" {
  try {
    run();
    return "accepted";
  } catch (error) {
    if (error instanceof RelayError) {
      return [error.status, error.code];
    }
    throw error;
  }
}

const capsule = (text: string) => cleanCapsule(parseJsonObject(bytes(text)));

describe("parseJsonObject", () => {
  it("takes an object", () => {
    expect(parseJsonObject(bytes('{"a":1}'))).toEqual({ a: 1 });
  });

  it.each([
    ["", "empty"],
    ["[]", "array"],
    ["null", "null"],
    ['"text"', "string"],
    ["12", "number"],
    ['{"a":1} x', "trailing text"],
    ["{'a':1}", "single quotes"],
    ['{"a":NaN}', "NaN"],
    ['{"label":"\\ud83d"}', "half a surrogate pair"],
    ['{"\\udc00":1}', "a lone surrogate in a key"],
  ])("refuses %s (%s) with 400", (text) => {
    expect(refused(() => parseJsonObject(bytes(text)))).toEqual([400, "invalid_json"]);
  });

  it("refuses bytes that are not UTF-8", () => {
    const raw = Uint8Array.from([...bytes('{"label":"'), 0xff, ...bytes('"}')]);
    expect(refused(() => parseJsonObject(raw))?.[0]).toBe(400);
  });

  it("takes a full surrogate pair", () => {
    expect(parseJsonObject(bytes('{"label":"\\ud83d\\ude00"}'))).toEqual({ label: "😀" });
  });

  it("refuses more than 1024 bytes with 413, and takes exactly 1024", () => {
    const fill = (size: number) => `{"x":"${"a".repeat(size - 8)}"}`;
    expect(bytes(fill(1024)).length).toBe(1024);
    expect(refused(() => parseJsonObject(bytes(fill(1024))))).toBe("accepted");
    expect(refused(() => parseJsonObject(bytes(fill(1025))))).toEqual([413, "payload_too_large"]);
  });

  it("refuses nesting deeper than 8 and NUL before parsing", () => {
    expect(refused(() => parseJsonObject(bytes('{"type":"counter","x":[[[[[[[[1]]]]]]]]}')))).toEqual([400, "invalid_json"]);
    expect(refused(() => parseJsonObject(bytes('{"x":[[[[[[[1]]]]]]]}')))).toBe("accepted");
    expect(refused(() => parseJsonObject(bytes('{"label":"a\\u0000b"}')))).toEqual([400, "invalid_json"]);
  });
});

describe("cleanCapsule", () => {
  it("takes a timer and a counter, dropping unknown fields", () => {
    expect(capsule('{"type":"timer","label":"Pasta","seconds":540,"colour":"red"}')).toEqual({
      type: "timer",
      label: "Pasta",
      seconds: 540,
    });
    expect(capsule('{"type":"counter","label":"Squats","count":3}')).toEqual({
      type: "counter",
      label: "Squats",
      count: 3,
    });
  });

  it("defaults the label to empty and the count to 0", () => {
    expect(capsule('{"type":"counter"}')).toEqual({ type: "counter", label: "", count: 0 });
  });

  it("keeps running and motion only when they were sent", () => {
    expect(capsule('{"type":"timer","seconds":5,"running":false}')).toEqual({
      type: "timer",
      label: "",
      seconds: 5,
      running: false,
    });
    expect(capsule('{"type":"counter","motion":true}')).toEqual({ type: "counter", label: "", count: 0, motion: true });
  });

  it.each([
    ['{"type":"timer","seconds":1}', 1],
    ['{"type":"timer","seconds":359999}', 359999],
    ['{"type":"timer","seconds":1.9}', 1],
    ['{"type":"timer","seconds":1e2}', 100],
    ['{"type":"timer","seconds":359999.0}', 359999],
  ])("takes %s as %d seconds", (text, seconds) => {
    expect(capsule(text)).toMatchObject({ seconds });
  });

  it.each([
    '{"type":"timer","label":"No seconds"}',
    '{"type":"timer","seconds":0}',
    '{"type":"timer","seconds":0.5}',
    '{"type":"timer","seconds":-1}',
    '{"type":"timer","seconds":360000}',
    '{"type":"timer","seconds":359999.5}',
    '{"type":"timer","seconds":"540"}',
    '{"type":"timer","seconds":null}',
    '{"type":"timer","seconds":true}',
    '{"type":"timer","seconds":1e999}',
  ])("refuses the seconds of %s", (text) => {
    expect(refused(() => capsule(text))).toEqual([400, "invalid_capsule"]);
  });

  it.each([
    ['{"type":"counter","count":0}', 0],
    ['{"type":"counter","count":999999}', 999999],
    ['{"type":"counter","count":0.5}', 0],
    ['{"type":"counter","count":7.9}', 7],
  ])("takes %s as count %d", (text, count) => {
    expect(capsule(text)).toMatchObject({ count });
  });

  it.each([
    '{"type":"counter","count":-1}',
    '{"type":"counter","count":-0.5}',
    '{"type":"counter","count":1000000}',
    '{"type":"counter","count":"3"}',
    '{"type":"counter","count":null}',
    '{"type":"counter","count":false}',
  ])("refuses the count of %s", (text) => {
    expect(refused(() => capsule(text))).toEqual([400, "invalid_capsule"]);
  });

  it.each(['{"label":"x"}', '{"type":"stopwatch"}', '{"type":7}', '{"type":null}', '{"type":"Timer","seconds":5}', '{"Type":"timer","seconds":5}'])(
    "refuses the type of %s",
    (text) => {
      expect(refused(() => capsule(text))).toEqual([400, "invalid_capsule"]);
    },
  );

  it.each(['{"type":"counter","label":7}', '{"type":"counter","label":null}', '{"type":"counter","label":["a"]}'])(
    "refuses the label of %s",
    (text) => {
      expect(refused(() => capsule(text))).toEqual([400, "invalid_capsule"]);
    },
  );

  it("refuses running and motion that are not booleans", () => {
    expect(refused(() => capsule('{"type":"timer","seconds":5,"running":1}'))).toEqual([400, "invalid_capsule"]);
    expect(refused(() => capsule('{"type":"counter","motion":"yes"}'))).toEqual([400, "invalid_capsule"]);
  });

  it("checks the type before the label, and the label before the number, like the board", () => {
    expect(() => capsule('{"type":7,"label":7}')).toThrow("type must be");
    expect(() => capsule('{"type":"timer","label":7}')).toThrow("label must be");
  });

  it("does not read fields from Object.prototype", () => {
    expect(refused(() => cleanCapsule(Object.create({ type: "counter" })))).toEqual([400, "invalid_capsule"]);
  });

  it("cuts a long label to 47 bytes without splitting a character", () => {
    expect(cleanLabel("a".repeat(48))).toBe("a".repeat(47));
    expect(cleanLabel("a".repeat(46) + "é")).toBe("a".repeat(46));
    expect(cleanLabel("a".repeat(45) + "é")).toBe("a".repeat(45) + "é");
    expect(cleanLabel("😀".repeat(12))).toBe("😀".repeat(11));
    expect(capsule(`{"type":"counter","label":"${"é".repeat(30)}"}`).label).toBe("é".repeat(23));
  });

  it("refuses a label with a NUL or half a surrogate pair when called directly", () => {
    expect(refused(() => cleanLabel("a\u0000b"))?.[0]).toBe(400);
    expect(refused(() => cleanLabel("a\ud83d"))).toEqual([400, "invalid_capsule"]);
  });
});

describe("cleanAction", () => {
  it.each(ACTIONS)("takes %s", (action) => {
    expect(cleanAction({ action })).toBe(action);
  });

  it.each([{ action: "explode" }, { action: 1 }, {}, { action: "Start" }, { action: null }])("refuses %j", (body) => {
    expect(refused(() => cleanAction(body))?.[0]).toBe(400);
  });
});

describe("cleanState", () => {
  const full = {
    type: "counter",
    label: "Squats",
    count: 4,
    seconds: 0,
    remaining_seconds: 0,
    running: false,
    done: false,
    motion: false,
    version: 3,
  };

  it("keeps the nine fields and drops the rest", () => {
    expect(cleanState({ ...full, token: "leak", extra: [1] })).toEqual(full);
  });

  it("takes the idle state with version 0", () => {
    expect(cleanState({ type: "idle", version: 0 })).toEqual({
      type: "idle",
      label: "",
      count: 0,
      seconds: 0,
      remaining_seconds: 0,
      running: false,
      done: false,
      motion: false,
      version: 0,
    });
  });

  it.each([
    [{ ...full, type: undefined }],
    [{ ...full, type: "stopwatch" }],
    [{ ...full, version: "3" }],
    [{ ...full, version: true }],
    [{ ...full, version: -1 }],
    [{ ...full, version: 2 ** 60 }],
    [{ ...full, count: -1 }],
    [{ ...full, count: "4" }],
    [{ ...full, running: "no" }],
    [{ ...full, label: 5 }],
    [{ ...full, remaining_seconds: 360000 }],
  ])("refuses %j", (body) => {
    const sent = Object.fromEntries(Object.entries(body).filter(([, value]) => value !== undefined));
    expect(refused(() => cleanState(sent))?.[0]).toBe(400);
  });

  it("refuses a report without a version", () => {
    expect(refused(() => cleanState({ type: "idle" }))?.[0]).toBe(400);
  });
});
