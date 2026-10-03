import { describe, expect, it } from "vitest";

import type { PollAnswer } from "@/lib/devices/relay";
import {
  IDLE,
  UNSYNCED,
  afterUnauthorized,
  applyAction,
  nextRequestDelayMs,
  formatClock,
  remainingSeconds,
  report,
  reportChanged,
  showCapsule,
  takePoll,
  tap,
} from "@/lib/devices/machine";

const answer = (over: Partial<PollAnswer> = {}): PollAnswer => ({
  claimed: true,
  version: 0,
  capsule: null,
  action_seq: 0,
  action: null,
  code: null,
  pair_url: null,
  ...over,
});
const timer = { type: "timer", label: "Pasta", seconds: 10 } as const;
const counter = { type: "counter", label: "Squats", count: 3 } as const;

describe("timer", () => {
  it("runs from the top as soon as it arrives, and rounds the time left up", () => {
    const shown = showCapsule(timer, 1000);
    expect(shown.running).toBe(true);
    expect(remainingSeconds(shown, 1000)).toBe(10);
    expect(remainingSeconds(shown, 1001)).toBe(10);
    expect(remainingSeconds(shown, 2000)).toBe(9);
    expect(remainingSeconds(shown, 10_999)).toBe(1);
  });

  it("is done at zero, and reports so", () => {
    const shown = showCapsule(timer, 0);
    expect(report(shown, 4, 10_000)).toEqual({
      type: "timer",
      label: "Pasta",
      count: 0,
      seconds: 10,
      remaining_seconds: 0,
      running: false,
      done: true,
      motion: false,
      version: 4,
    });
  });

  it("loads paused when running is false", () => {
    const shown = showCapsule({ ...timer, running: false }, 0);
    expect(shown.running).toBe(false);
    expect(remainingSeconds(shown, 60_000)).toBe(10);
  });

  it("pauses and resumes without losing time", () => {
    const paused = applyAction(showCapsule(timer, 0), "pause", 4000)!;
    expect(paused.running).toBe(false);
    expect(remainingSeconds(paused, 99_000)).toBe(6);
    const resumed = applyAction(paused, "start", 100_000)!;
    expect(remainingSeconds(resumed, 101_000)).toBe(5);
    expect(applyAction(resumed, "start", 102_000)).toEqual(resumed);
  });

  it("toggles: pause, run, and after the end back to the full time, paused", () => {
    const running = showCapsule(timer, 0);
    const paused = applyAction(running, "toggle", 1000)!;
    expect(paused.running).toBe(false);
    expect(applyAction(paused, "toggle", 2000)!.running).toBe(true);
    const afterEnd = applyAction(running, "toggle", 20_000)!;
    expect(afterEnd).toMatchObject({ running: false, done: false });
    expect(remainingSeconds(afterEnd, 20_000)).toBe(10);
  });

  it("starts from the top after it finished, and resets to paused", () => {
    const restarted = applyAction(showCapsule(timer, 0), "start", 50_000)!;
    expect(restarted).toMatchObject({ running: true, done: false });
    expect(remainingSeconds(restarted, 50_000)).toBe(10);
    const reset = applyAction(showCapsule(timer, 0), "reset", 3000)!;
    expect(reset.running).toBe(false);
    expect(remainingSeconds(reset, 3000)).toBe(10);
  });

  it("does not take counter actions", () => {
    expect(applyAction(showCapsule(timer, 0), "increment", 0)).toBeNull();
    expect(applyAction(showCapsule(timer, 0), "motion_on", 0)).toBeNull();
  });
});

describe("counter", () => {
  it("increments, stops at 999999 and resets", () => {
    const shown = showCapsule(counter, 0);
    expect(applyAction(shown, "increment", 0)!.count).toBe(4);
    expect(applyAction({ ...shown, count: 999999 }, "increment", 0)!.count).toBe(999999);
    expect(applyAction(shown, "reset", 0)!.count).toBe(0);
  });

  it("does not take timer or motion actions, and idle takes none", () => {
    for (const action of ["start", "pause", "toggle", "motion_on", "motion_off"] as const) {
      expect(applyAction(showCapsule(counter, 0), action, 0)).toBeNull();
    }
    expect(applyAction(IDLE, "reset", 0)).toBeNull();
    expect(applyAction(IDLE, "increment", 0)).toBeNull();
  });
});

describe("takePoll", () => {
  it("shows the pairing code while unclaimed and nothing from the relay", () => {
    const state = takePoll(UNSYNCED, answer({ claimed: false, code: "a-b-c", pair_url: "https://x/pair?code=a-b-c" }), 0);
    expect(state).toMatchObject({ claimed: false, code: "a-b-c", pairUrl: "https://x/pair?code=a-b-c", shownVersion: 0 });
    expect(state.shown).toEqual(IDLE);
  });

  it("ignores a pair URL that comes without a code", () => {
    expect(takePoll(UNSYNCED, answer({ claimed: false, pair_url: "https://x/pair" }), 0).pairUrl).toBeNull();
  });

  it("applies a capsule when the version changes, and only then", () => {
    const first = takePoll(UNSYNCED, answer({ version: 1, capsule: counter }), 0);
    expect(first.shown).toMatchObject({ type: "counter", count: 3 });
    expect(first.shownVersion).toBe(1);
    const tapped = tap(first, 0);
    expect(tapped.shown.count).toBe(4);
    // The same version again does not undo the tap.
    expect(takePoll(tapped, answer({ version: 1, capsule: counter }), 0).shown.count).toBe(4);
    expect(takePoll(tapped, answer({ version: 2, capsule: counter }), 0).shown.count).toBe(3);
  });

  it("leaves the screen alone when a new version has no capsule", () => {
    const first = takePoll(UNSYNCED, answer({ version: 1, capsule: counter }), 0);
    const next = takePoll(first, answer({ version: 2, capsule: null }), 0);
    expect(next.shown.type).toBe("counter");
    expect(next.shownVersion).toBe(1);
    expect(next.version).toBe(2);
  });

  it("applies the capsule of the first answer but only notes its action", () => {
    const first = takePoll(UNSYNCED, answer({ version: 5, capsule: counter, action_seq: 9, action: "increment" }), 0);
    expect(first.shown.count).toBe(3);
    expect(first.actionSeq).toBe(9);
  });

  it("runs a new action once", () => {
    const first = takePoll(UNSYNCED, answer({ version: 1, capsule: counter }), 0);
    const second = takePoll(first, answer({ version: 1, capsule: counter, action_seq: 1, action: "increment" }), 0);
    expect(second.shown.count).toBe(4);
    const third = takePoll(second, answer({ version: 1, capsule: counter, action_seq: 1, action: "increment" }), 0);
    expect(third.shown.count).toBe(4);
  });

  it("applies the capsule before the action when both are new", () => {
    const first = takePoll(UNSYNCED, answer({ version: 1, capsule: counter }), 0);
    const both = takePoll(
      first,
      answer({ version: 2, capsule: { type: "counter", label: "New", count: 10 }, action_seq: 1, action: "increment" }),
      0,
    );
    expect(both.shown).toMatchObject({ label: "New", count: 11 });
  });

  it("skips an action that does not fit, and does not try it again", () => {
    const first = takePoll(UNSYNCED, answer({ version: 1, capsule: counter }), 0);
    const second = takePoll(first, answer({ version: 1, capsule: counter, action_seq: 1, action: "pause" }), 0);
    expect(second.shown).toEqual(first.shown);
    expect(second.actionSeq).toBe(1);
  });

  it("clears the screen when the device is unpaired", () => {
    const first = takePoll(UNSYNCED, answer({ version: 1, capsule: counter }), 0);
    const freed = takePoll(first, answer({ claimed: false, version: 1, code: "a-b-c", pair_url: "u" }), 0);
    expect(freed.shown).toEqual(IDLE);
    expect(freed.shownVersion).toBe(0);
  });
});

describe("tap and reports", () => {
  it("taps + on a counter and the dial on a timer; nothing while idle", () => {
    const withTimer = takePoll(UNSYNCED, answer({ version: 1, capsule: timer }), 0);
    expect(tap(withTimer, 1000).shown.running).toBe(false);
    expect(tap(UNSYNCED, 0)).toBe(UNSYNCED);
  });

  it("reports idle with version 0", () => {
    expect(report(IDLE, 0, 0)).toMatchObject({ type: "idle", version: 0, remaining_seconds: 0 });
  });

  it("does not call a running countdown a change, but calls a reset one", () => {
    const shown = showCapsule(timer, 0);
    expect(reportChanged(report(shown, 1, 0), report(shown, 1, 3000))).toBe(false);
    expect(reportChanged(report(shown, 1, 0), report(shown, 1, 10_000))).toBe(true); // done
    const paused = applyAction(shown, "pause", 4000)!;
    const reset = applyAction(paused, "reset", 5000)!;
    expect(reportChanged(report(paused, 1, 5000), report(reset, 1, 5000))).toBe(true);
    const counted = showCapsule(counter, 0);
    expect(reportChanged(report(counted, 1, 0), report(applyAction(counted, "increment", 0)!, 1, 0))).toBe(true);
    expect(reportChanged(report(counted, 1, 0), report(counted, 2, 0))).toBe(true);
  });
});

describe("afterUnauthorized", () => {
  const used = { hw: "web-1", id: "dev_1", token: "old-token" };

  it("registers again under the same hardware id when storage still holds the refused registration", () => {
    expect(afterUnauthorized(used, used)).toEqual({ kind: "register", hw: "web-1" });
  });

  it("takes over the registration another tab stored meanwhile, instead of registering again", () => {
    expect(afterUnauthorized(used, { hw: "web-1", id: "dev_1", token: "new-token" })).toEqual({
      kind: "adopt",
      hw: "web-1",
      id: "dev_1",
      token: "new-token",
    });
    expect(afterUnauthorized(used, { hw: "web-2", id: "dev_2", token: "other" })).toMatchObject({
      kind: "adopt",
      hw: "web-2",
      id: "dev_2",
    });
  });

  it.each([{}, { hw: "web-1" }, { id: "dev_9" }, { token: "t" }, { id: "", token: "" }])(
    "registers again when storage holds no complete registration: %j",
    (stored) => {
      expect(afterUnauthorized(used, stored)).toEqual({ kind: "register", hw: "web-1" });
    },
  );

  it("falls back to the stored hardware id when the tab has none", () => {
    expect(afterUnauthorized({}, { hw: "web-7" })).toEqual({ kind: "register", hw: "web-7" });
  });

  it("settles two tabs that share one refused registration on a single new one", () => {
    // Tab A is refused first and registers again; what it stores is what tab B then finds.
    const stale = { hw: "web-1", id: "dev_1", token: "stale" };
    expect(afterUnauthorized(stale, stale).kind).toBe("register");
    const storedByA = { hw: "web-1", id: "dev_1", token: "from-a" };
    const b = afterUnauthorized(stale, storedByA);
    expect(b).toMatchObject({ kind: "adopt", token: "from-a" });
    // And if B's adopted token is refused as well while storage has not changed, it registers.
    expect(afterUnauthorized(storedByA, storedByA).kind).toBe("register");
  });
});

describe("nextRequestDelayMs", () => {
  it("is the poll interval after a good answer and never 0", () => {
    expect(nextRequestDelayMs(0)).toBe(2000);
    expect(nextRequestDelayMs(-1)).toBe(2000);
  });

  it("grows with failures in a row: 2, 4, 8, 16, then 30 seconds", () => {
    expect([1, 2, 3, 4, 5, 6, 50].map(nextRequestDelayMs)).toEqual([2000, 4000, 8000, 16_000, 30_000, 30_000, 30_000]);
  });
});

describe("formatClock", () => {
  it.each([
    [0, "00:00"],
    [59, "00:59"],
    [540, "09:00"],
    [3599, "59:59"],
    [3600, "1:00:00"],
    [359999, "99:59:59"],
  ])("%d -> %s", (seconds, text) => {
    expect(formatClock(seconds)).toBe(text);
  });
});
