// The virtual device: what the wrist board does with a capsule, an action and a poll answer,
// as pure functions over immutable values (no DOM, no timers, no network). The rules are
// those of main/capsule.c and main/relay_sync.c in the firmware; /device renders the result.
import { MAX_COUNT, type Action, type Capsule, type DeviceState } from "./capsule";
import type { PollAnswer } from "./relay";

export interface Shown {
  readonly type: "idle" | "timer" | "counter";
  readonly label: string;
  readonly count: number;
  readonly seconds: number;
  readonly running: boolean;
  readonly done: boolean;
  readonly remainingMs: number; // while paused
  readonly deadlineMs: number; // while running
}

export const IDLE: Shown = {
  type: "idle",
  label: "",
  count: 0,
  seconds: 0,
  running: false,
  done: false,
  remainingMs: 0,
  deadlineMs: 0,
};

function resetTimer(shown: Shown): Shown {
  return { ...shown, remainingMs: shown.seconds * 1000, running: false, done: false };
}

function startTimer(shown: Shown, now: number): Shown {
  const from = shown.done ? resetTimer(shown) : shown;
  return from.running ? from : { ...from, deadlineMs: now + from.remainingMs, running: true };
}

function pauseTimer(shown: Shown, now: number): Shown {
  return shown.running ? { ...shown, remainingMs: shown.deadlineMs - now, running: false } : shown;
}

// Nothing ticks in the background: expiry is noticed whenever the state is read or changed.
export function sync(shown: Shown, now: number): Shown {
  if (shown.type === "timer" && shown.running && now >= shown.deadlineMs) {
    return { ...shown, remainingMs: 0, running: false, done: true };
  }
  return shown;
}

// A capsule from the relay replaces what is shown. A timer runs from the top unless
// "running" is false. (Motion counting needs a sensor: a browser tab has none.)
export function showCapsule(capsule: Capsule, now: number): Shown {
  if (capsule.type === "timer") {
    const loaded = resetTimer({ ...IDLE, type: "timer", label: capsule.label, seconds: capsule.seconds });
    return capsule.running === false ? loaded : startTimer(loaded, now);
  }
  return { ...IDLE, type: "counter", label: capsule.label, count: capsule.count };
}

// The state after an action, or null if the action does not fit what is shown.
export function applyAction(before: Shown, action: Action, now: number): Shown | null {
  const shown = sync(before, now);
  if (shown.type === "timer") {
    switch (action) {
      case "start":
        return startTimer(shown, now);
      case "pause":
        return pauseTimer(shown, now);
      case "toggle":
        return shown.done ? resetTimer(shown) : shown.running ? pauseTimer(shown, now) : startTimer(shown, now);
      case "reset":
        return resetTimer(shown);
      default:
        return null;
    }
  }
  if (shown.type === "counter") {
    switch (action) {
      case "increment":
        return { ...shown, count: Math.min(MAX_COUNT, shown.count + 1) };
      case "reset":
        return { ...shown, count: 0 };
      default:
        return null; // motion_on / motion_off: no sensor here
    }
  }
  return null;
}

export function remainingSeconds(before: Shown, now: number): number {
  const shown = sync(before, now);
  if (shown.type !== "timer") {
    return 0;
  }
  const ms = shown.running ? shown.deadlineMs - now : shown.remainingMs;
  return Math.floor((ms + 999) / 1000);
}

// The body of POST /api/devices/{id}/state.
export function report(before: Shown, version: number, now: number): DeviceState {
  const shown = sync(before, now);
  return {
    type: shown.type,
    label: shown.label,
    count: shown.count,
    seconds: shown.seconds,
    remaining_seconds: remainingSeconds(shown, now),
    running: shown.running,
    done: shown.done,
    motion: false,
    version,
  };
}

// Whether two reports differ in a way worth sending. A running timer's remaining time alone
// is not a change (no request per second); a stopped timer's is (a reset).
export function reportChanged(a: DeviceState, b: DeviceState): boolean {
  return (
    a.version !== b.version ||
    a.type !== b.type ||
    a.label !== b.label ||
    a.count !== b.count ||
    a.seconds !== b.seconds ||
    a.running !== b.running ||
    a.done !== b.done ||
    a.motion !== b.motion ||
    (!b.running && a.remaining_seconds !== b.remaining_seconds)
  );
}

// What the device remembers between polls.
export interface SyncState {
  readonly synced: boolean; // false until the first answer after a start or a registration
  readonly version: number; // the relay version last taken (-1: none)
  readonly shownVersion: number; // the relay version on the screen (0: nothing from the relay)
  readonly actionSeq: number;
  readonly claimed: boolean;
  readonly code: string | null;
  readonly pairUrl: string | null;
  readonly shown: Shown;
}

export const UNSYNCED: SyncState = {
  synced: false,
  version: -1,
  shownVersion: 0,
  actionSeq: 0,
  claimed: false,
  code: null,
  pairUrl: null,
  shown: IDLE,
};

// Takes one poll answer. A new version applies the capsule (null leaves the screen alone);
// a new action_seq runs the action once, except on the first answer, where it is only noted.
// When both are new the capsule comes first.
export function takePoll(before: SyncState, answer: PollAnswer, now: number): SyncState {
  let shown = before.shown;
  let shownVersion = before.shownVersion;
  if (answer.version !== before.version && answer.capsule !== null) {
    shown = showCapsule(answer.capsule, now);
    shownVersion = answer.version;
  }
  if (!answer.claimed) {
    // Unpaired (or registered again): whatever a previous owner sent leaves the screen.
    shown = IDLE;
    shownVersion = 0;
  }
  const actionIsNew = before.synced && answer.action_seq !== before.actionSeq;
  if (actionIsNew && answer.action !== null) {
    shown = applyAction(shown, answer.action, now) ?? shown;
  }
  return {
    synced: true,
    version: answer.version,
    shownVersion,
    actionSeq: answer.action_seq,
    claimed: answer.claimed,
    code: answer.code,
    pairUrl: answer.code === null ? null : answer.pair_url,
    shown,
  };
}

// A tap on the device itself: + on a counter, the dial on a timer.
export function tap(before: SyncState, now: number): SyncState {
  const action: Action | null =
    before.shown.type === "counter" ? "increment" : before.shown.type === "timer" ? "toggle" : null;
  if (action === null) {
    return before;
  }
  return { ...before, shown: applyAction(before.shown, action, now) ?? before.shown };
}

export function formatClock(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const two = (value: number) => String(value).padStart(2, "0");
  return hours > 0 ? `${hours}:${two(minutes)}:${two(seconds)}` : `${two(minutes)}:${two(seconds)}`;
}
