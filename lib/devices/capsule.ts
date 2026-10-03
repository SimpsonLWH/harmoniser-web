// The capsule rules of the board's POST /capsule (main/capsule_json.c, main/capsule.c), so
// the relay never stores a capsule the board would refuse.
import {
  ERR_BAD_ACTION,
  ERR_BAD_COUNT,
  ERR_BAD_LABEL,
  ERR_BAD_MOTION,
  ERR_BAD_RUNNING,
  ERR_BAD_SECONDS,
  ERR_BAD_STATE,
  ERR_BAD_TYPE,
  ERR_HAS_NUL,
  RelayError,
} from "./errors";
import { field, hasField, isWellFormed, type JsonObject } from "./json";

export const LABEL_MAX_BYTES = 47;
export const MAX_SECONDS = 359999; // 99:59:59
export const MAX_COUNT = 999999;
export const MAX_COUNTER = 2 ** 53; // version and action_seq, as the board reads them

export const ACTIONS = ["start", "pause", "toggle", "reset", "increment", "motion_on", "motion_off"] as const;
export type Action = (typeof ACTIONS)[number];

export interface TimerCapsule {
  type: "timer";
  label: string;
  seconds: number;
  running?: boolean;
}

export interface CounterCapsule {
  type: "counter";
  label: string;
  count: number;
  motion?: boolean;
}

export type Capsule = TimerCapsule | CounterCapsule;

// What the board reports with POST /state: its GET /state object plus the relay version.
export interface DeviceState {
  type: "idle" | "timer" | "counter";
  label: string;
  count: number;
  seconds: number;
  remaining_seconds: number;
  running: boolean;
  done: boolean;
  motion: boolean;
  version: number;
}

// utf8_valid() of the firmware: no overlong forms, no surrogates, nothing above U+10FFFF.
export function utf8Valid(bytes: Uint8Array): boolean {
  let i = 0;
  while (i < bytes.length) {
    const lead = bytes[i++] as number;
    if (lead < 0x80) {
      continue;
    }
    let low = 0x80;
    let high = 0xbf;
    let more: number;
    if (lead >= 0xc2 && lead <= 0xdf) {
      more = 1;
    } else if (lead >= 0xe0 && lead <= 0xef) {
      more = 2;
      low = lead === 0xe0 ? 0xa0 : low;
      high = lead === 0xed ? 0x9f : high;
    } else if (lead >= 0xf0 && lead <= 0xf4) {
      more = 3;
      low = lead === 0xf0 ? 0x90 : low;
      high = lead === 0xf4 ? 0x8f : high;
    } else {
      return false;
    }
    const second = bytes[i];
    if (second === undefined || second < low || second > high) {
      return false;
    }
    i++;
    while (--more > 0) {
      const next = bytes[i];
      if (next === undefined || (next & 0xc0) !== 0x80) {
        return false;
      }
      i++;
    }
  }
  return true;
}

// copy_label() of the firmware: at most 47 bytes, never cut inside a character.
export function cutLabelBytes(bytes: Uint8Array): Uint8Array {
  if (bytes.length <= LABEL_MAX_BYTES) {
    return bytes;
  }
  let end = LABEL_MAX_BYTES;
  while (end > 0 && ((bytes[end] as number) & 0xc0) === 0x80) {
    end--;
  }
  return bytes.slice(0, end);
}

export function cleanLabel(label: string): string {
  if (label.includes("\u0000")) {
    throw new RelayError(ERR_HAS_NUL);
  }
  if (!isWellFormed(label)) {
    throw new RelayError(ERR_BAD_LABEL);
  }
  return new TextDecoder().decode(cutLabelBytes(new TextEncoder().encode(label)));
}

// read_int() of the firmware: optional; a number within [min, max], then cut to a whole number.
function readInt(body: JsonObject, key: string, min: number, max: number, error: RelayError): number | undefined {
  if (!hasField(body, key)) {
    return undefined;
  }
  const value = field(body, key);
  if (typeof value !== "number" || !(value >= min && value <= max)) {
    throw error;
  }
  return Math.trunc(value);
}

function readBool(body: JsonObject, key: string, error: RelayError): boolean | undefined {
  if (!hasField(body, key)) {
    return undefined;
  }
  const value = field(body, key);
  if (typeof value !== "boolean") {
    throw error;
  }
  return value;
}

// The capsule as the relay stores it and hands it to the board. Unknown fields are dropped.
export function cleanCapsule(body: JsonObject): Capsule {
  const type = field(body, "type");
  const rawLabel = hasField(body, "label") ? field(body, "label") : "";
  if (typeof type !== "string") {
    throw new RelayError(ERR_BAD_TYPE);
  }
  if (typeof rawLabel !== "string") {
    throw new RelayError(ERR_BAD_LABEL);
  }
  const label = cleanLabel(rawLabel);
  if (type === "timer") {
    const seconds = readInt(body, "seconds", 1, MAX_SECONDS, new RelayError(ERR_BAD_SECONDS));
    if (seconds === undefined) {
      throw new RelayError(ERR_BAD_SECONDS);
    }
    const running = readBool(body, "running", new RelayError(ERR_BAD_RUNNING));
    return running === undefined ? { type, label, seconds } : { type, label, seconds, running };
  }
  if (type === "counter") {
    const count = readInt(body, "count", 0, MAX_COUNT, new RelayError(ERR_BAD_COUNT)) ?? 0;
    const motion = readBool(body, "motion", new RelayError(ERR_BAD_MOTION));
    return motion === undefined ? { type, label, count } : { type, label, count, motion };
  }
  throw new RelayError(ERR_BAD_TYPE);
}

export function isAction(value: unknown): value is Action {
  return typeof value === "string" && (ACTIONS as readonly string[]).includes(value);
}

export function cleanAction(body: JsonObject): Action {
  const action = field(body, "action");
  if (!isAction(action)) {
    throw new RelayError(ERR_BAD_ACTION);
  }
  return action;
}

const STATE_TYPES = ["idle", "timer", "counter"] as const;

// A state report from a device. `type` and `version` are required (as on mock_relay.py);
// the other fields default to empty, and a field of the wrong kind refuses the report.
export function cleanState(body: JsonObject): DeviceState {
  const bad = new RelayError(ERR_BAD_STATE);
  const type = field(body, "type");
  const label = hasField(body, "label") ? field(body, "label") : "";
  const version = readInt(body, "version", 0, MAX_COUNTER, bad);
  if (typeof type !== "string" || typeof label !== "string" || version === undefined) {
    throw bad;
  }
  const known = STATE_TYPES.find((name) => name === type);
  if (known === undefined) {
    throw bad;
  }
  return {
    type: known,
    label: cleanLabel(label),
    count: readInt(body, "count", 0, MAX_COUNT, bad) ?? 0,
    seconds: readInt(body, "seconds", 0, MAX_SECONDS, bad) ?? 0,
    remaining_seconds: readInt(body, "remaining_seconds", 0, MAX_SECONDS, bad) ?? 0,
    running: readBool(body, "running", bad) ?? false,
    done: readBool(body, "done", bad) ?? false,
    motion: readBool(body, "motion", bad) ?? false,
    version,
  };
}
