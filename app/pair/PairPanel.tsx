"use client";

import { useCallback, useEffect, useState } from "react";

import { failureText } from "@/lib/client/api";
import {
  claimDevice,
  listDevices,
  readDeviceState,
  sendAction,
  sendCapsule,
  unpairDevice,
} from "@/lib/client/devices";
import { useInstallId } from "@/lib/client/token";
import type { Action, Capsule } from "@/lib/devices/capsule";
import { formatClock } from "@/lib/devices/machine";
import type { DeviceSummary, StateAnswer } from "@/lib/devices/relay";

const OFFLINE_AFTER_MS = 15_000;
const BUTTON = "min-h-11 rounded-full px-5 text-[14px] font-medium disabled:opacity-50";
const PRIMARY = `${BUTTON} bg-brand text-white`;
const QUIET = `${BUTTON} bg-surface-2 text-text`;
const CARD = "mt-5 rounded-card bg-surface p-5 shadow-[var(--h-shadow)]";

function deviceName(device: { id: string; kind: string }): string {
  const what = device.kind === "wrist" ? "Wrist companion" : device.kind === "web" ? "Browser tab" : device.kind;
  return `${what} · ${device.id.slice(-4)}`;
}

export function PairPanel({ scanned }: { scanned: string | null }) {
  // The relay's user side is keyed by the install ID, not the publishing owner token.
  const token = useInstallId();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [devices, setDevices] = useState<DeviceSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  // The scanned code was refused (used or expired): offer the field for typing the current one.
  const [scanFailed, setScanFailed] = useState(false);

  const refresh = useCallback(async () => {
    if (token === "") {
      return;
    }
    const answer = await listDevices(token);
    if (answer.ok) {
      setDevices(answer.data.devices);
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    if (token !== "") {
      void listDevices(token).then((answer) => {
        if (!cancelled && answer.ok) {
          setDevices(answer.data.devices);
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function pair(code: string): Promise<void> {
    setBusy(true);
    setMessage(null);
    const answer = await claimDevice(token, code);
    setBusy(false);
    if (!answer.ok) {
      setMessage({ ok: false, text: `Not paired. ${failureText(answer.failure)}` });
      if (code === scanned && (answer.failure.code === "code_not_found" || answer.failure.code === "invalid_code")) {
        setScanFailed(true);
      }
      return;
    }
    setMessage({ ok: true, text: "Paired. The code on the device goes away within a few seconds." });
    setSelected(answer.data.id);
    setTyped("");
    await refresh();
  }

  async function unpair(id: string): Promise<void> {
    await unpairDevice(token, id);
    setSelected((current) => (current === id ? null : current));
    await refresh();
  }

  const paired = message?.ok === true;

  return (
    <>
      {scanned !== null && !paired && !scanFailed && (
        <section className={CARD}>
          <p className="text-[14px] text-text-2">The device shows these three words:</p>
          <p className="mt-2 break-words font-mono text-[24px] font-semibold tracking-tight">{scanned}</p>
          <p className="mt-2 text-[14px] leading-6 text-text-2">
            Pairing lets this browser send it a timer or a counter. Check the words match before you
            continue.
          </p>
          <button type="button" className={`${PRIMARY} mt-4 w-full`} disabled={busy || token === ""} onClick={() => void pair(scanned)}>
            {busy ? "Pairing…" : "Pair this device"}
          </button>
        </section>
      )}

      {(scanned === null || (scanFailed && !paired)) && (
        <form
          className={CARD}
          onSubmit={(event) => {
            event.preventDefault();
            void pair(typed);
          }}
        >
          <label htmlFor="pair-code" className="text-[14px] text-text-2">
            {scanFailed
              ? "That code is no longer valid. Type the three words the device shows now"
              : "Type the three words the device shows"}
          </label>
          <input
            id="pair-code"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            placeholder="brave otter lamp"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={64}
            className="mt-2 min-h-11 w-full rounded-input border border-line bg-bg px-4 font-mono text-[16px]"
          />
          <button type="submit" className={`${PRIMARY} mt-4 w-full`} disabled={busy || token === "" || typed.trim() === ""}>
            {busy ? "Pairing…" : "Pair this device"}
          </button>
        </form>
      )}

      {message !== null && (
        <p
          role="status"
          className={`mt-4 rounded-2xl p-4 text-[14px] leading-6 ${message.ok ? "bg-brand-soft text-text" : "bg-danger-soft text-danger"}`}
        >
          {message.text}
        </p>
      )}

      {devices.length > 0 && (
        <section className={CARD}>
          <h2 className="text-[17px] font-semibold">Your devices</h2>
          <ul className="mt-3 space-y-2">
            {devices.map((device) => (
              <li key={device.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(device.id)}
                  aria-pressed={selected === device.id}
                  className={`min-h-11 flex-1 truncate rounded-2xl px-4 text-left text-[14px] ${selected === device.id ? "bg-brand-soft font-medium" : "bg-surface-2"}`}
                >
                  {deviceName(device)}
                  <span className="ml-2 text-[12px] text-text-3">
                    {device.last_seen_ms_ago > OFFLINE_AFTER_MS ? "offline" : "online"}
                  </span>
                </button>
                <button type="button" className={QUIET} onClick={() => void unpair(device.id)}>
                  Unpair
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {selected !== null && devices.some((device) => device.id === selected) && (
        <Remote key={selected} token={token} id={selected} />
      )}
    </>
  );
}

/** Sends a timer or a counter to one paired device and shows what it reports back. */
function Remote({ token, id }: { token: string; id: string }) {
  const [label, setLabel] = useState("");
  const [minutes, setMinutes] = useState("1");
  const [state, setState] = useState<StateAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function read(): Promise<void> {
      const answer = await readDeviceState(token, id);
      if (!cancelled && answer.ok) {
        setState(answer.data);
      }
    }
    void read();
    const timer = setInterval(() => void read(), 2000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [token, id]);

  async function send(capsule: Capsule): Promise<void> {
    const answer = await sendCapsule(token, id, capsule);
    setError(answer.ok ? null : failureText(answer.failure));
  }

  async function act(action: Action): Promise<void> {
    const answer = await sendAction(token, id, action);
    setError(answer.ok ? null : failureText(answer.failure));
  }

  const seconds = Math.round(Number(minutes) * 60);
  const offline = state !== null && state.last_seen_ms_ago > OFFLINE_AFTER_MS;

  return (
    <section className={CARD}>
      <h2 className="text-[17px] font-semibold">Send a capsule</h2>
      <label htmlFor="capsule-label" className="mt-3 block text-[13px] text-text-2">
        Label
      </label>
      <input
        id="capsule-label"
        value={label}
        onChange={(event) => setLabel(event.target.value)}
        placeholder="Pasta"
        maxLength={47}
        className="mt-1 min-h-11 w-full rounded-input border border-line bg-bg px-4 text-[16px]"
      />
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="text-[13px] text-text-2">
          Minutes
          <input
            value={minutes}
            onChange={(event) => setMinutes(event.target.value)}
            inputMode="decimal"
            className="mt-1 block min-h-11 w-24 rounded-input border border-line bg-bg px-4 text-[16px] text-text"
          />
        </label>
        <button
          type="button"
          className={PRIMARY}
          disabled={!(seconds >= 1 && seconds <= 359999)}
          onClick={() => void send({ type: "timer", label, seconds })}
        >
          Send timer
        </button>
        <button type="button" className={PRIMARY} onClick={() => void send({ type: "counter", label, count: 0 })}>
          Send counter
        </button>
      </div>

      <div className="mt-5 rounded-2xl bg-surface-2 p-4" role="status">
        {state === null || state.type === undefined ? (
          <p className="text-[14px] text-text-2">{offline ? "The device is offline." : "Nothing reported yet."}</p>
        ) : (
          <>
            <p className="text-[13px] text-text-2">
              {offline ? "Offline · last seen showing" : "The device shows"}
            </p>
            <p className="mt-1 truncate text-[15px] font-medium">
              {state.type === "idle" ? "Nothing" : state.label || (state.type === "timer" ? "Timer" : "Counter")}
            </p>
            {state.type === "timer" && (
              <p className="font-mono text-[32px] font-semibold tabular-nums">
                {formatClock(state.remaining_seconds ?? 0)}
                <span className="ml-2 font-sans text-[13px] font-normal text-text-2">
                  {state.done ? "done" : state.running ? "running" : "paused"}
                </span>
              </p>
            )}
            {state.type === "counter" && (
              <p className="font-mono text-[32px] font-semibold tabular-nums">{state.count ?? 0}</p>
            )}
          </>
        )}
      </div>

      {state?.type === "timer" && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={QUIET} onClick={() => void act("toggle")}>
            {state.running ? "Pause" : "Start"}
          </button>
          <button type="button" className={QUIET} onClick={() => void act("reset")}>
            Reset
          </button>
        </div>
      )}
      {state?.type === "counter" && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={QUIET} onClick={() => void act("increment")}>
            +1
          </button>
          <button type="button" className={QUIET} onClick={() => void act("reset")}>
            Reset
          </button>
        </div>
      )}

      {error !== null && <p className="mt-3 rounded-2xl bg-danger-soft p-3 text-[13px] text-danger">{error}</p>}
    </section>
  );
}
