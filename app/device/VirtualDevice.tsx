"use client";

import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useRef, useState } from "react";

import { pollDevice, registerDevice, reportDevice } from "@/lib/client/devices";
import type { DeviceState } from "@/lib/devices/capsule";
import {
  formatClock,
  remainingSeconds,
  report,
  reportChanged,
  sync,
  takePoll,
  tap,
  UNSYNCED,
  type SyncState,
} from "@/lib/devices/machine";

/**
 * A browser tab that behaves like the wrist board: it registers with the relay, shows its
 * pairing QR code and phrase, then polls for a capsule and reports its state. Same routes,
 * same rules (lib/devices/machine.ts mirrors the firmware).
 */

const STORAGE_KEY = "harmoniser.virtualDevice";
const POLL_MS = 2000;
const HEARTBEAT_MS = 10_000;
const BACKOFF_MS = [2000, 4000, 8000, 16_000, 30_000];

interface Registration {
  hw: string;
  id: string;
  token: string;
}

function randomHw(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return "web-" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function loadRegistration(): Partial<Registration> {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    return typeof parsed === "object" && parsed !== null ? (parsed as Partial<Registration>) : {};
  } catch {
    return {};
  }
}

function saveRegistration(registration: Partial<Registration>): void {
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
  const registration = useRef<Partial<Registration>>({});
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

    async function step(): Promise<void> {
      if (cancelled) {
        return;
      }
      let ok = false;
      const current = registration.current;
      if (current.id === undefined || current.token === undefined) {
        const hw = current.hw ?? randomHw();
        const answer = await registerDevice(hw);
        if (answer.ok && !cancelled) {
          registration.current = { hw, id: answer.data.id, token: answer.data.token };
          saveRegistration(registration.current);
          state.current = { ...UNSYNCED, code: answer.data.code, pairUrl: answer.data.pair_url };
          lastReport.current = null;
          ok = true;
        }
      } else {
        const answer = await pollDevice(current.id, current.token);
        if (answer.ok && !cancelled) {
          state.current = takePoll(state.current, answer.data, Date.now());
          ok = true;
          await sendReport(false);
        } else if (answer.status === 401 || answer.status === 404) {
          // The relay no longer knows this device: register again under the same hardware id.
          registration.current = { hw: current.hw };
          saveRegistration(registration.current);
          state.current = UNSYNCED;
          ok = true;
        }
      }
      if (cancelled) {
        return;
      }
      failures = ok ? 0 : failures + 1;
      setLink(ok ? "online" : failures >= 2 ? "offline" : "online");
      setView(state.current);
      const registered = registration.current.id !== undefined;
      const wait = ok ? (registered && state.current.synced ? POLL_MS : 0) : BACKOFF_MS[Math.min(failures, BACKOFF_MS.length) - 1];
      timer = setTimeout(() => void step(), wait);
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
      <div className="relative flex aspect-[4/5] w-full flex-col items-center justify-center overflow-hidden rounded-[44px] bg-[#0b0f14] p-6 text-center text-white shadow-[var(--h-shadow)]">
        <p className="absolute top-5 text-[12px] tracking-wide text-white/60" role="status">
          {link === "offline" ? "cloud offline" : link === "starting" ? "connecting…" : paired ? "paired" : "not paired"}
        </p>

        {!paired && view.code !== null && (
          <>
            {view.pairUrl !== null && (
              <div className="rounded-2xl bg-white p-3">
                <QRCodeSVG value={view.pairUrl} level="M" size={200} marginSize={2} title="Pairing QR code" />
              </div>
            )}
            <p className="mt-4 text-[12px] text-white/60">scan, or type</p>
            <p className="font-mono text-[22px] font-semibold tracking-tight" data-testid="pairing-code">
              {view.code}
            </p>
          </>
        )}

        {!paired && view.code === null && <p className="text-[15px] text-white/70">Getting a pairing code…</p>}

        {paired && shown.type === "idle" && (
          <p className="max-w-[14rem] text-[15px] leading-6 text-white/70">
            Paired. Send a timer or a counter from the app to see it here.
          </p>
        )}

        {paired && shown.type === "timer" && (
          <>
            <p className="max-w-full truncate text-[16px] text-white/70">{shown.label || "Timer"}</p>
            <p className="mt-1 font-mono text-[64px] font-semibold leading-none tabular-nums" data-testid="timer">
              {formatClock(remainingSeconds(shown, now))}
            </p>
            <button
              type="button"
              onClick={onTap}
              className="mt-6 min-h-12 rounded-full bg-white/15 px-7 text-[15px] font-medium"
            >
              {shown.done ? "Reset" : shown.running ? "Pause" : "Start"}
            </button>
            {shown.done && <p className="mt-3 text-[14px] text-[#ffb37a]">Time is up</p>}
          </>
        )}

        {paired && shown.type === "counter" && (
          <>
            <p className="max-w-full truncate text-[16px] text-white/70">{shown.label || "Counter"}</p>
            <p className="mt-1 font-mono text-[72px] font-semibold leading-none tabular-nums" data-testid="count">
              {shown.count}
            </p>
            <button
              type="button"
              onClick={onTap}
              aria-label="Add one"
              className="mt-6 grid size-20 place-items-center rounded-full bg-brand text-[40px] font-medium leading-none text-white"
            >
              +
            </button>
          </>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-[13px] text-text-3">
        <span>This tab is a device of kind “web”.</span>
        <button type="button" onClick={forget} className="min-h-9 rounded-full bg-surface-2 px-4 font-medium text-text-2">
          New device
        </button>
      </div>
    </div>
  );
}
