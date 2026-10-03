"use client";

import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useRef, useState } from "react";

import { pollDevice, registerDevice, reportDevice } from "@/lib/client/devices";
import type { DeviceState } from "@/lib/devices/capsule";
import {
  afterUnauthorized,
  formatClock,
  nextRequestDelayMs,
  remainingSeconds,
  report,
  reportChanged,
  sync,
  takePoll,
  tap,
  UNSYNCED,
  type StoredRegistration,
  type SyncState,
} from "@/lib/devices/machine";

/**
 * A browser tab that behaves like the wrist board: it registers with the relay, shows its
 * pairing QR code and phrase, then polls for a capsule and reports its state. Same routes,
 * same rules (lib/devices/machine.ts mirrors the firmware).
 */

const STORAGE_KEY = "harmoniser.virtualDevice";
const HEARTBEAT_MS = 10_000;

type Registration = StoredRegistration;

// Whoever knows a device's hw can register it again and so unpair it: 128 random bits.
function randomHw(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return "web-" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function loadRegistration(): Registration {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    return typeof parsed === "object" && parsed !== null ? (parsed as Registration) : {};
  } catch {
    return {};
  }
}

function saveRegistration(registration: Registration): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(registration));
  } catch {
    // Storage disabled: the device lives as long as this tab.
  }
}

type Link = "starting" | "online" | "offline";

export function VirtualDevice() {
  const [view, setView] = useState<SyncState>(UNSYNCED);
  const [link, setLink] = useState<Link>("starting");
  const [now, setNow] = useState(0);
  const [generation, setGeneration] = useState(0);

  const state = useRef<SyncState>(UNSYNCED);
  const registration = useRef<Registration>({});
  const lastReport = useRef<{ body: DeviceState; at: number } | null>(null);

  const sendReport = useCallback(async (force: boolean) => {
    const { id, token } = registration.current;
    if (id === undefined || token === undefined || !state.current.synced) {
      return;
    }
    const time = Date.now();
    const body = report(state.current.shown, state.current.shownVersion, time);
    const last = lastReport.current;
    const due = last === null || time - last.at >= HEARTBEAT_MS || reportChanged(last.body, body);
    if (force || due) {
      lastReport.current = { body, at: time };
      await reportDevice(id, token, body);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;

    function adopt(next: Registration): void {
      registration.current = next;
      state.current = UNSYNCED;
      lastReport.current = null;
    }

    async function step(): Promise<void> {
      if (cancelled) {
        return;
      }
      const used = registration.current;
      if (used.id === undefined || used.token === undefined) {
        // Another tab of this browser may have registered since this one last looked.
        const stored = loadRegistration();
        if (stored.id !== undefined && stored.token !== undefined) {
          adopt(stored);
        } else {
          const hw = used.hw ?? stored.hw ?? randomHw();
          const answer = await registerDevice(hw);
          if (cancelled) {
            return;
          }
          if (answer.ok) {
            adopt({ hw, id: answer.data.id, token: answer.data.token });
            saveRegistration(registration.current);
            state.current = { ...UNSYNCED, code: answer.data.code, pairUrl: answer.data.pair_url };
          } else {
            failures += 1;
          }
        }
      } else {
        const answer = await pollDevice(used.id, used.token);
        if (cancelled) {
          return;
        }
        if (answer.ok) {
          failures = 0;
          state.current = takePoll(state.current, answer.data, Date.now());
          await sendReport(false);
        } else {
          failures += 1;
          if (answer.status === 401 || answer.status === 404) {
            // The relay no longer takes this token. If another tab has registered again, use
            // its registration; only otherwise register again (lib/devices/machine.ts).
            const next = afterUnauthorized(used, loadRegistration());
            if (next.kind === "adopt") {
              adopt({ hw: next.hw, id: next.id, token: next.token });
            } else {
              adopt({ hw: next.hw });
              saveRegistration(registration.current);
            }
          }
        }
      }
      if (cancelled) {
        return;
      }
      setLink(failures >= 2 ? "offline" : "online");
      setView(state.current);
      // Never at once: the poll interval after a good answer or a registration, longer and
      // longer after refusals and failures.
      timer = setTimeout(() => void step(), nextRequestDelayMs(failures));
    }

    registration.current = loadRegistration();
    state.current = UNSYNCED;
    void step();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [generation, sendReport]);

  // The clock: nothing in the state changes while a timer runs, so the screen needs its own tick.
  useEffect(() => {
    const tick = setInterval(() => {
      const time = Date.now();
      const before = state.current.shown;
      const after = sync(before, time);
      if (after !== before) {
        state.current = { ...state.current, shown: after };
        setView(state.current);
        void sendReport(true); // the timer just finished
      }
      setNow(time);
    }, 250);
    return () => clearInterval(tick);
  }, [sendReport]);

  function onTap(): void {
    state.current = tap(state.current, Date.now());
    setView(state.current);
    void sendReport(true);
  }

  function forget(): void {
    registration.current = {};
    saveRegistration({});
    setView(UNSYNCED);
    setLink("starting");
    setGeneration((value) => value + 1);
  }

  const shown = view.shown;
  const paired = view.synced && view.claimed;

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="relative flex aspect-[4/5] w-full flex-col items-center justify-center overflow-hidden rounded-[44px] border border-[var(--frame-border)] bg-device p-6 text-center text-device-text shadow-[var(--shadow-frame)]">
        <p className="absolute top-5 text-badge font-semibold text-device-text-2" role="status">
          {link === "offline" ? "cloud offline" : link === "starting" ? "connecting…" : paired ? "paired" : "not paired"}
        </p>

        {!paired && view.code !== null && (
          <>
            {view.pairUrl !== null && (
              <div className="rounded-card bg-white p-3">
                <QRCodeSVG value={view.pairUrl} level="M" size={200} marginSize={2} title="Pairing QR code" />
              </div>
            )}
            <p className="mt-4 text-badge text-device-text-2">scan, or type</p>
            <p className="font-mono text-title font-semibold tracking-tight" data-testid="pairing-code">
              {view.code}
            </p>
          </>
        )}

        {!paired && view.code === null && <p className="text-label text-device-text-2">Getting a pairing code…</p>}

        {paired && shown.type === "idle" && (
          <p className="max-w-[14rem] text-label leading-6 text-device-text-2">
            Paired. Send a timer or a counter from the app to see it here.
          </p>
        )}

        {paired && shown.type === "timer" && (
          <>
            <p className="max-w-full truncate text-body text-device-text-2">{shown.label || "Timer"}</p>
            <p className="mt-1 text-hero font-extrabold leading-none tracking-[-1px] tabular-nums" data-testid="timer">
              {formatClock(remainingSeconds(shown, now))}
            </p>
            <button
              type="button"
              onClick={onTap}
              className="btn mt-6 min-h-12 bg-device-key px-7 text-device-text"
            >
              {shown.done ? "Reset" : shown.running ? "Pause" : "Start"}
            </button>
            {shown.done && <p className="mt-3 text-label font-semibold text-device-alert">Time is up</p>}
          </>
        )}

        {paired && shown.type === "counter" && (
          <>
            <p className="max-w-full truncate text-body text-device-text-2">{shown.label || "Counter"}</p>
            <p className="mt-1 text-hero font-extrabold leading-none tracking-[-1px] tabular-nums" data-testid="count">
              {shown.count}
            </p>
            <button
              type="button"
              onClick={onTap}
              aria-label="Add one"
              className="mt-6 grid size-20 place-items-center rounded-full bg-blue text-display font-medium leading-none text-on-blue transition-colors hover:bg-blue-hover"
            >
              +
            </button>
          </>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-caption text-text-2">
        <span>This tab is a device of kind “web”.</span>
        <button type="button" onClick={forget} className="btn btn-secondary">
          New device
        </button>
      </div>
    </div>
  );
}
