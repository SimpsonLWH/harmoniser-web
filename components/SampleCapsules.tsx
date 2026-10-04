/**
 * Three capsules drawn exactly like the app's canvas boards (harmoniser-canvas: Packing, Pomodoro,
 * Split). Static pictures of the app: nothing in them is interactive, so the controls are spans and
 * each frame is one labelled image for screen readers.
 */
import type { ReactNode } from "react";

import { AppFrame } from "@/components/AppFrame";
import {
  AddHomeIcon,
  CheckIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CloseIcon,
  CloudIcon,
  CupIcon,
  MinusIcon,
  PencilIcon,
  PhoneIcon,
  PlayIcon,
  PlusIcon,
  ReceiptIcon,
  ShareIcon,
  SuitcaseIcon,
  TimerIcon,
} from "@/components/Icons";

function Footer() {
  return (
    <>
      <span className="pill min-w-0 flex-1">
        <span className="text-blue">
          <PencilIcon />
        </span>
        Change it…
      </span>
      <span className="btn btn-icon">
        <ShareIcon />
      </span>
      <span className="btn btn-icon">
        <AddHomeIcon />
      </span>
    </>
  );
}

function Close() {
  return (
    <span className="btn btn-icon btn-icon-soft">
      <CloseIcon />
    </span>
  );
}

function Picture({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div role="img" aria-label={label} className={`select-none ${className}`}>
      <div aria-hidden="true" className="h-full">
        {children}
      </div>
    </div>
  );
}

function Box({ on }: { on: boolean }) {
  return on ? (
    <span className="grid size-6 shrink-0 place-items-center rounded-[7px] bg-blue text-white">
      <CheckIcon />
    </span>
  ) : (
    <span className="size-6 shrink-0 rounded-[7px] border-2 border-[var(--checkbox-off)] bg-surface" />
  );
}

const CLOTHES: [string, boolean][] = [
  ["Light jacket for the salt mine", true],
  ["Walking shoes for the cobbles", true],
  ["Two T-shirts", true],
  ["Jeans", false],
  ["Something to sleep in", false],
];

const GROUPS: [string, string, number][] = [
  ["Documents and money", "1 of 3", 33],
  ["Tech", "1 of 2", 50],
  ["Toiletries", "0 of 2", 0],
];

export function PackingCapsule({ className = "" }: { className?: string }) {
  return (
    <Picture label="Example capsule: a packing list, 5 of 12 packed" className={className}>
      <AppFrame
        className="h-full"
        icon={<SuitcaseIcon />}
        name="Weekend in Kraków"
        chips={
          <span className="chip">
            <CloudIcon />
            Made with Mistral EU
          </span>
        }
        action={<Close />}
        footer={<Footer />}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-[22px] font-extrabold tracking-[-0.3px] tabular-nums">5 of 12 packed</span>
            <span className="text-[13px] font-semibold text-text-2 tabular-nums">42%</span>
          </div>
          <div className="progress">
            <span style={{ width: "42%" }} />
          </div>
        </div>
        <div className="flex flex-col rounded-[20px] bg-card pb-2 pt-0.5">
          <div className="flex h-12 items-center gap-2.5 pl-4 pr-3.5">
            <span className="flex-1 text-[16px] font-bold">Clothes</span>
            <span className="text-[13px] font-semibold text-text-2">3 of 5</span>
            <span className="text-text-2">
              <ChevronUpIcon />
            </span>
          </div>
          {CLOTHES.map(([item, on]) => (
            <div key={item} className={`flex min-h-11 items-center gap-3 px-4 text-[15px] ${on ? "text-text-2" : "text-text"}`}>
              <Box on={on} />
              {item}
            </div>
          ))}
        </div>
        <div className="flex flex-col rounded-[20px] bg-card">
          {GROUPS.map(([group, count, pct], index) => (
            <div key={group} className={`flex h-[58px] items-center gap-2.5 pl-4 pr-3.5 ${index > 0 ? "card-row" : ""}`}>
              <span className="flex flex-1 flex-col gap-1.5">
                <span className="text-[16px] font-bold">{group}</span>
                <span className="block h-1 w-[120px] rounded-sm bg-track">
                  <span className="block h-1 rounded-sm bg-blue" style={{ width: `${pct}%` }} />
                </span>
              </span>
              <span className="text-[13px] font-semibold text-text-2">{count}</span>
              <span className="text-text-2">
                <ChevronRightIcon />
              </span>
            </div>
          ))}
        </div>
      </AppFrame>
    </Picture>
  );
}

const ON_PHONE = (
  <span className="chip">
    <PhoneIcon size={13} />
    Made on your phone · no internet
  </span>
);

export function PomodoroCapsule({ className = "" }: { className?: string }) {
  return (
    <Picture label="Example capsule: a 50 minute focus timer" className={className}>
      <AppFrame className="h-full" icon={<TimerIcon />} name="Pomodoro 50/10" chips={ON_PHONE} action={<Close />} footer={<Footer />}>
        <div className="segmented w-full">
          <span className="segment flex flex-1 items-center justify-center" aria-pressed="true">
            Focus 50 min
          </span>
          <span className="segment flex flex-1 items-center justify-center">Break 10 min</span>
        </div>
        <div className="flex justify-center py-4">
          <div className="relative grid size-[232px] place-items-center rounded-full border-[14px] border-blue">
            <span className="absolute -top-[11px] size-2 rounded-full bg-white" />
            <div className="flex flex-col items-center">
              <span className="text-[56px] font-extrabold leading-[64px] tracking-[-1.5px] tabular-nums">50:00</span>
              <span className="text-[15px] font-semibold text-text-2">Ready to focus</span>
            </div>
          </div>
        </div>
        <span className="btn btn-primary btn-lg w-full">
          <PlayIcon />
          Start focus
        </span>
        <span className="btn btn-warn btn-lg w-full">
          <CupIcon />
          Start break
        </span>
        <span className="caption text-center">2 focus sessions done today</span>
      </AppFrame>
    </Picture>
  );
}

export function SplitCapsule({ className = "" }: { className?: string }) {
  return (
    <Picture label="Example capsule: split a dinner bill, each person pays 34.50" className={className}>
      <AppFrame className="h-full" icon={<ReceiptIcon />} name="Split dinner" chips={ON_PHONE} action={<Close />} footer={<Footer />}>
        <div className="hero-card flex flex-col gap-0.5">
          <span className="text-[14px] font-semibold">Each person pays</span>
          <span className="text-[56px] font-extrabold leading-[64px] tracking-[-1.5px] tabular-nums">34.50</span>
          <span className="mt-1.5 flex gap-[18px] text-[14px] font-semibold tabular-nums">
            <span>Total 138.00</span>
            <span>Tip 18.00</span>
          </span>
        </div>
        <div className="flex flex-col rounded-[20px] bg-card">
          <div className="flex items-center justify-between gap-3 py-2.5 pl-4 pr-3">
            <span className="text-[16px] font-semibold">Bill</span>
            <span className="flex h-11 w-[132px] items-center justify-end rounded-[12px] border border-input-border bg-surface px-3.5 text-[18px] font-bold tabular-nums">
              120.00
            </span>
          </div>
          <div className="card-row flex items-center justify-between gap-3 py-2.5 pl-4 pr-3">
            <span className="text-[16px] font-semibold">People</span>
            <span className="flex items-center gap-1.5">
              <span className="btn btn-icon">
                <MinusIcon />
              </span>
              <span className="min-w-9 text-center text-[20px] font-extrabold tabular-nums">4</span>
              <span className="btn btn-icon">
                <PlusIcon />
              </span>
            </span>
          </div>
          <div className="card-row flex flex-col gap-2.5 py-3.5 pl-4 pr-3">
            <span className="text-[16px] font-semibold">Tip</span>
            <span className="flex gap-2">
              {["0%", "10%", "15%", "20%"].map((tip) => (
                <span
                  key={tip}
                  className={`flex h-11 flex-1 items-center justify-center rounded-[12px] border text-[15px] font-bold ${
                    tip === "15%" ? "border-blue bg-tint text-chip-text" : "border-input-border bg-surface text-text"
                  }`}
                >
                  {tip}
                </span>
              ))}
            </span>
          </div>
        </div>
        <span className="caption">Updates as you type. Each share is rounded to the cent.</span>
      </AppFrame>
    </Picture>
  );
}
