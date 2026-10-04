"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { CapsuleFrame, FrameCheck, FrameProgress } from "@/components/frames/CapsuleFrame";
import { ChecklistIcon, CloudIcon, InfoIcon, PlusIcon, RainIcon, SnowIcon, SunIcon } from "@/components/frames/icons";

/*
 * One sentence becomes a running capsule. The three stages swap the body of a
 * single frame, so the device never jumps: it is the same screen advancing.
 */

const STAGES = [
  {
    id: "ask",
    label: "Ask",
    body: "Type it or share it. A rule parser answers most requests on the phone, and the on-device model covers many of the rest.",
  },
  {
    id: "approve",
    label: "Approve",
    body: "Every capsule lists what it needs. You allow or deny each one, and a denied part is drawn as blocked and written to the log.",
  },
  {
    id: "use",
    label: "Use",
    body: "The capsule runs natively: timers ring, checklists tick, and a capsule that fits can sit on the home screen as a widget.",
  },
] as const;

type Stage = (typeof STAGES)[number]["id"];

function AskBody() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div
        style={{
          borderRadius: 22,
          background: "#F5F7FB",
          padding: "18px 18px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: "#5B6478" }}>Your request</span>
        <span style={{ fontSize: 20, fontWeight: 700, lineHeight: "28px" }}>
          {"a task list and the weather for Krak\u00f3w"}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 32,
              padding: "0 12px",
              borderRadius: 16,
              background: "#EAF0FF",
              color: "#2A47C7",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Create
          </span>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#5B6478" }}>English for now</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {["Rules first, offline", "Template if rules miss", "On-device model as a fallback"].map((line) => (
          <span key={line} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, fontWeight: 600 }}>
            <span style={{ width: 26, height: 26, borderRadius: 9, background: "#EAF0FF", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <ChecklistIcon size={15} stroke="#2F5BFF" />
            </span>
            {line}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {["pasta 9 min, sauce 15 min", "3 timers for the gym", "water, 8 glasses"].map((example) => (
          <span
            key={example}
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 40,
              padding: "0 14px",
              borderRadius: 20,
              border: "1px solid #DCE2EE",
              background: "#FFFFFF",
              color: "#5B6478",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {example}
          </span>
        ))}
      </div>
    </div>
  );
}

function ApproveBody() {
  const grants = [
    { label: "Reminders and timers", effect: "Puts the timers in your calendar" },
    { label: "Weather", effect: "Sends the chosen city\u2019s coordinates to Open-Meteo" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.3px" }}>Before this runs</span>
        <span style={{ fontSize: 14, fontWeight: 500, lineHeight: "20px", color: "#5B6478" }}>
          HarmonyOS apps ask at install; Harmoniser asks per capsule and keeps the answer.
        </span>
      </div>
      {grants.map((grant) => (
        <div
          key={grant.label}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: 14,
            borderRadius: 18,
            background: "#F5F7FB",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{grant.label}</span>
            <span style={{ fontSize: 13, fontWeight: 500, lineHeight: "18px", color: "#5B6478" }}>{grant.effect}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span
              style={{
                height: 40,
                padding: "0 18px",
                borderRadius: 20,
                background: "#2F5BFF",
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Allow
            </span>
            <span
              style={{
                height: 40,
                padding: "0 18px",
                borderRadius: 20,
                border: "1px solid #DCE2EE",
                background: "#FFFFFF",
                color: "#1B2236",
                fontSize: 14,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Not now
            </span>
          </div>
        </div>
      ))}
      <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "#5B6478" }}>
        <InfoIcon size={15} stroke="#5B6478" />
        <span>Deny one and that part is blocked, refused when tapped, and logged.</span>
      </span>
    </div>
  );
}

function UseBody() {
  const rows = [
    { label: "Book a tennis court", done: true, weather: "sun" },
    { label: "Walk up to Wawel Castle", done: false, weather: "rain" },
  ];
  const weatherIcon = (w: string) =>
    w === "sun" ? (
      <SunIcon size={18} stroke="#A8411A" />
    ) : w === "rain" ? (
      <RainIcon size={18} stroke="#5B6478" />
    ) : w === "snow" ? (
      <SnowIcon size={18} stroke="#5B6478" />
    ) : (
      <CloudIcon size={18} stroke="#5B6478" />
    );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <FrameProgress value={50} label="1 of 2 done" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((row) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              borderRadius: 18,
              background: "#F5F7FB",
            }}
          >
            <FrameCheck done={row.done} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 600, color: row.done ? "#5B6478" : "#1B2236" }}>
              {row.label}
            </span>
            {weatherIcon(row.weather)}
          </div>
        ))}
      </div>
      <span
        style={{
          height: 48,
          borderRadius: 16,
          border: "1.5px dashed #B9C4E4",
          color: "#2A47C7",
          fontSize: 15,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <PlusIcon size={18} stroke="#2A47C7" />
        Add task
      </span>
    </div>
  );
}

export function Steps() {
  const [stage, setStage] = useState<Stage>("ask");
  const reduce = useReducedMotion();
  const active = STAGES.find((s) => s.id === stage) ?? STAGES[0];

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:items-center">
      <div className="order-2 flex flex-col gap-2 lg:order-1">
        {STAGES.map((s) => {
          const on = s.id === stage;
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={on}
              onClick={() => setStage(s.id)}
              className={`rounded-tile border p-5 text-left transition-colors ${
                on ? "border-brand/30 bg-surface shadow-frame" : "border-transparent bg-transparent hover:bg-surface-2"
              }`}
            >
              <span className={`text-[17px] font-bold ${on ? "text-brand-ink" : "text-text"}`}>{s.label}</span>
              <span className="mt-1 block max-w-[46ch] text-[14px] leading-6 text-text-2">{s.body}</span>
            </button>
          );
        })}
      </div>

      <div className="order-1 lg:order-2">
        <motion.div
          key={active.id}
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 140, damping: 22 }}
        >
          <CapsuleFrame
            title={active.id === "ask" ? "New capsule" : "Tasks with weather"}
            origin={active.id === "use" ? "marketplace" : "none"}
            icon={<ChecklistIcon size={22} stroke="#2F5BFF" />}
            decorative={false}
          >
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              {active.id === "ask" ? <AskBody /> : active.id === "approve" ? <ApproveBody /> : <UseBody />}
            </div>
          </CapsuleFrame>
        </motion.div>
      </div>
    </div>
  );
}
