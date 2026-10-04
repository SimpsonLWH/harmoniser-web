import type { CSSProperties, ReactNode } from "react";

import { CapsuleFrame, FrameCheck, FramePrimaryButton, FrameProgress } from "./CapsuleFrame";
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CloudIcon,
  CoffeeIcon,
  DropIcon,
  HabitIcon,
  MinusIcon,
  PartlyIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  QuestionIcon,
  RainIcon,
  ReceiptIcon,
  SuitcaseIcon,
  SunIcon,
  SwapIcon,
  TennisBallIcon,
  TennisIcon,
  TimerIcon,
} from "./icons";

/*
 * The ten static capsule frames, drawn from the canvas files. They are
 * presentation only: rail frames are exposed as one labelled image, so nothing
 * inside is focusable.
 */

type ScreenProps = { decorative?: boolean };

function Btn({ style, children }: { style?: CSSProperties; children: ReactNode }) {
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", ...style }}>{children}</div>;
}

/* Pomodoro 50/10 */
export function PomodoroScreen({ decorative = true }: ScreenProps) {
  return (
    <CapsuleFrame
      title="Pomodoro 50/10"
      origin="phone"
      icon={<TimerIcon size={22} stroke="#2F5BFF" />}
      decorative={decorative}
      ariaLabel="Pomodoro capsule with a 50 minute focus timer"
    >
      <div style={{ display: "flex", padding: 3, borderRadius: 14, background: "#F1F3F8" }}>
        <div
          style={{
            flex: 1,
            height: 44,
            borderRadius: 11,
            background: "#FFFFFF",
            boxShadow: "0 1px 3px rgba(27,34,54,0.12)",
            color: "#1B2236",
            fontSize: 15,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Focus 50 min
        </div>
        <div
          style={{
            flex: 1,
            height: 44,
            borderRadius: 11,
            color: "#5B6478",
            fontSize: 15,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Break 10 min
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", width: 252, height: 252 }}>
          <svg width="252" height="252" viewBox="0 0 252 252" aria-hidden="true">
            <circle cx="126" cy="126" r="110" fill="none" stroke="#E4E9F3" strokeWidth="14" />
            <circle
              cx="126"
              cy="126"
              r="110"
              fill="none"
              stroke="#2F5BFF"
              strokeWidth="14"
              strokeDasharray="691.15 1000"
              transform="rotate(-90 126 126)"
            />
            <circle cx="126" cy="16" r="4" fill="#FFFFFF" />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <span
              style={{
                fontSize: 58,
                fontWeight: 800,
                lineHeight: "64px",
                letterSpacing: "-1.5px",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              50:00
            </span>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#5B6478" }}>Ready to focus</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <FramePrimaryButton label="Start focus" icon={<PlayIcon size={18} />} />
        <FramePrimaryButton label="Start break" tone="accent" icon={<CoffeeIcon size={18} stroke="#A8411A" />} />
      </div>
      <span style={{ textAlign: "center", fontSize: 13, fontWeight: 500, color: "#5B6478" }}>
        2 focus sessions done today
      </span>
    </CapsuleFrame>
  );
}

/* Water, 8 glasses */
export function WaterScreen({ decorative = true }: ScreenProps) {
  return (
    <CapsuleFrame
      title="Water"
      origin="phone"
      icon={<DropIcon size={22} stroke="#2F5BFF" />}
      decorative={decorative}
      ariaLabel="Water capsule showing 5 of 8 glasses"
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <div style={{ position: "relative", width: 240, height: 240 }}>
          <svg width="240" height="240" viewBox="0 0 240 240" aria-hidden="true">
            <circle
              cx="120"
              cy="120"
              r="100"
              fill="none"
              stroke="#E4E9F3"
              strokeWidth="20"
              strokeDasharray="68.54 10"
              strokeDashoffset="-5"
              transform="rotate(-90 120 120)"
            />
            <circle
              cx="120"
              cy="120"
              r="100"
              fill="none"
              stroke="#2F5BFF"
              strokeWidth="20"
              strokeDasharray="68.54 10 68.54 10 68.54 10 68.54 10 68.54 400"
              strokeDashoffset="-5"
              transform="rotate(-90 120 120)"
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: 72,
                fontWeight: 800,
                lineHeight: "76px",
                letterSpacing: "-2px",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              5
            </span>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#5B6478" }}>of 8 glasses</span>
          </div>
        </div>
        <span style={{ fontSize: 17, fontWeight: 700 }}>3 more to reach today&apos;s goal</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <FramePrimaryButton label="Add a glass" icon={<PlusIcon size={18} />} />
        <FramePrimaryButton label="Undo last glass" tone="plain" height={48} radius={16} />
      </div>
      <span style={{ textAlign: "center", fontSize: 13, fontWeight: 500, color: "#5B6478" }}>Resets at midnight</span>
    </CapsuleFrame>
  );
}

/* Capitals quiz */
export function QuizScreen({ decorative = true }: ScreenProps) {
  const answers = [
    { label: "Sydney", tag: "Your answer", state: "wrong" as const },
    { label: "Canberra", tag: "Correct", state: "right" as const },
    { label: "Melbourne", tag: "", state: "plain" as const },
    { label: "Perth", tag: "", state: "plain" as const },
  ];
  return (
    <CapsuleFrame
      title="Capitals quiz"
      origin="cloud"
      icon={<QuestionIcon size={22} stroke="#2F5BFF" />}
      decorative={decorative}
      ariaLabel="Quiz capsule on question two, Canberra answered correctly"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#5B6478" }}>Question 2 of 3</span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 28,
              padding: "0 12px",
              borderRadius: 14,
              background: "#EAF0FF",
              color: "#2A47C7",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Score 1
          </span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <span style={{ flex: 1, height: 6, borderRadius: 3, background: "#2F5BFF" }} />
          <span style={{ flex: 1, height: 6, borderRadius: 3, background: "#2F5BFF" }} />
          <span style={{ flex: 1, height: 6, borderRadius: 3, background: "#E4E9F3" }} />
        </div>
      </div>

      <div style={{ borderRadius: 22, background: "#F5F7FB", padding: "22px 20px" }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, lineHeight: "30px", letterSpacing: "-0.3px" }}>
          What is the capital of Australia?
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {answers.map((a) => {
          const style: CSSProperties =
            a.state === "wrong"
              ? { border: "1.5px solid #FF7A45", background: "#FFF3EC" }
              : a.state === "right"
                ? { border: "1.5px solid #2F5BFF", background: "#EAF0FF" }
                : { border: "1px solid #E3E7F0", background: "#FFFFFF" };
          return (
            <div
              key={a.label}
              style={{
                height: 56,
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 14px 0 16px",
                fontSize: 17,
                fontWeight: a.state === "right" ? 700 : 600,
                color: a.state === "plain" ? "#5B6478" : "#1B2236",
                ...style,
              }}
            >
              <span>{a.label}</span>
              {a.tag ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 700,
                    color: a.state === "right" ? "#2A47C7" : "#A8411A",
                  }}
                >
                  {a.tag}
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      background: a.state === "right" ? "#2F5BFF" : "#E8692E",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {a.state === "right" ? (
                      <CheckIcon size={11} stroke="#FFFFFF" />
                    ) : (
                      <svg width="11" height="11" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M9 9l6 6M15 9l-6 6" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                    )}
                  </span>
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      <p style={{ margin: 0, fontSize: 14, fontWeight: 500, lineHeight: "20px", color: "#3D4A66" }}>
        Canberra is the capital. Sydney is the biggest city, which is why it catches people out.
      </p>
      <FramePrimaryButton label="Next question" />
    </CapsuleFrame>
  );
}

/* Packing list for Krakow */
export function PackingScreen({ decorative = true }: ScreenProps) {
  const clothes = [
    { label: "Light jacket for the salt mine", done: true },
    { label: "Walking shoes for the cobbles", done: true },
    { label: "Two T-shirts", done: true },
    { label: "Jeans", done: false },
    { label: "Something to sleep in", done: false },
  ];
  const groups = [
    { label: "Documents and money", done: 1, total: 3 },
    { label: "Tech", done: 1, total: 2 },
    { label: "Toiletries", done: 0, total: 2 },
  ];
  return (
    <CapsuleFrame
      title={"Packing list for Krak\u00f3w"}
      origin="cloud"
      icon={<SuitcaseIcon size={22} stroke="#2F5BFF" />}
      decorative={decorative}
      ariaLabel="Packing list capsule, 5 of 12 items packed"
    >
      <FrameProgress value={42} label="5 of 12 packed" />

      <div style={{ borderRadius: 20, background: "#F5F7FB", padding: "2px 0 8px", display: "flex", flexDirection: "column" }}>
        <div style={{ width: "100%", height: 48, display: "flex", alignItems: "center", gap: 10, padding: "0 14px 0 16px" }}>
          <span style={{ flex: 1, fontSize: 16, fontWeight: 700 }}>Clothes</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#5B6478" }}>3 of 5</span>
          <ChevronDownIcon size={16} stroke="#5B6478" />
        </div>
        {clothes.map((item) => (
          <div
            key={item.label}
            style={{
              width: "100%",
              minHeight: 44,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "0 16px",
              color: item.done ? "#5B6478" : "#1B2236",
              fontSize: 15,
              fontWeight: 500,
            }}
          >
            <FrameCheck done={item.done} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div style={{ borderRadius: 20, background: "#F5F7FB", display: "flex", flexDirection: "column" }}>
        {groups.map((g) => (
          <div
            key={g.label}
            style={{ width: "100%", height: 58, display: "flex", alignItems: "center", gap: 10, padding: "0 14px 0 16px" }}
          >
            <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{g.label}</span>
              <span style={{ display: "block", width: 120, height: 4, borderRadius: 2, background: "#E4E9F3" }}>
                <span
                  style={{
                    display: "block",
                    width: `${Math.round((g.done / g.total) * 100)}%`,
                    height: 4,
                    borderRadius: 2,
                    background: "#2F5BFF",
                  }}
                />
              </span>
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#5B6478" }}>
              {g.done} of {g.total}
            </span>
            <ChevronRightIcon size={16} stroke="#5B6478" />
          </div>
        ))}
      </div>
    </CapsuleFrame>
  );
}

/* Habit forecast */
export function HabitsScreen({ decorative = true }: ScreenProps) {
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const habits = [
    { name: "Read 20 pages", v: [1, 1, 0, 1, 1, 0, 1] },
    { name: "Walk 8,000 steps", v: [1, 1, 0, 0, 1, 1, 1] },
    { name: "No phone after 22:00", v: [1, 0, 0, 0, 1, 0, 0] },
    { name: "8 glasses of water", v: [1, 1, 1, 1, 1, 1, 1] },
  ];
  const today = 6;
  const counts = dayNames.map((_, i) => habits.reduce((n, h) => n + h.v[i], 0));
  const weatherFor = (n: number) => (n === 4 ? "sun" : n === 3 ? "partly" : n === 2 ? "cloud" : "rain");

  return (
    <CapsuleFrame
      title="Habit forecast"
      origin="marketplace"
      icon={<HabitIcon size={22} stroke="#2F5BFF" />}
      decorative={decorative}
      ariaLabel="Habit capsule that shows the week as a weather forecast"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, borderRadius: 22, background: "#F5F7FB" }}>
        <PartlyIcon size={40} stroke="#E8692E" />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#5B6478" }}>Today, Sunday</span>
          <span style={{ fontSize: 24, fontWeight: 800, lineHeight: "30px", letterSpacing: "-0.3px" }}>Partly sunny</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: "#3D4A66" }}>3 of 4 habits done</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 2, padding: "8px 6px", borderRadius: 20, background: "#F5F7FB" }}>
        {dayNames.map((d, i) => {
          const kind = weatherFor(counts[i]);
          const isToday = i === today;
          const ink = isToday ? "#2A47C7" : "#5B6478";
          return (
            <div
              key={d}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: "8px 0",
                borderRadius: 14,
                background: isToday ? "#EAF0FF" : "transparent",
              }}
            >
              <span style={{ fontSize: 12, fontWeight: isToday ? 800 : 700, color: ink }}>{d.slice(0, 1)}</span>
              {kind === "sun" ? (
                <SunIcon size={18} stroke="#E8692E" />
              ) : kind === "partly" ? (
                <PartlyIcon size={18} stroke="#E8692E" />
              ) : kind === "cloud" ? (
                <CloudIcon size={18} stroke="#5B6478" />
              ) : (
                <RainIcon size={18} stroke="#5B6478" />
              )}
              <span style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: ink }}>
                {counts[i]}/4
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ borderRadius: 20, background: "#F5F7FB", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ width: 100, flexShrink: 0, fontSize: 12, fontWeight: 600, color: "#5B6478" }}>Habit</span>
          <div style={{ flex: 1, display: "flex", justifyContent: "space-between" }}>
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <span
                key={`${d}-${i}`}
                style={{
                  width: 26,
                  textAlign: "center",
                  fontSize: 12,
                  fontWeight: i === today ? 800 : 700,
                  color: i === today ? "#2A47C7" : "#5B6478",
                }}
              >
                {d}
              </span>
            ))}
          </div>
        </div>
        {habits.map((h) => (
          <div key={h.name} style={{ display: "flex", alignItems: "center", minHeight: 36 }}>
            <span style={{ width: 100, flexShrink: 0, fontSize: 13, fontWeight: 600, lineHeight: "16px" }}>{h.name}</span>
            <div style={{ flex: 1, display: "flex", justifyContent: "space-between" }}>
              {h.v.map((done, i) => (
                <span
                  key={`${h.name}-${i}`}
                  style={{
                    display: "inline-flex",
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    alignItems: "center",
                    justifyContent: "center",
                    background: done ? "#2F5BFF" : "#FFFFFF",
                    border: `2px solid ${done ? "#2F5BFF" : i === today ? "#8EA5FF" : "#D3DAE8"}`,
                  }}
                >
                  {done ? <CheckIcon size={13} stroke="#FFFFFF" /> : null}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <span style={{ fontSize: 13, fontWeight: 500, lineHeight: "18px", color: "#5B6478" }}>
        Sun means every habit done. Rain means one or none.
      </span>
    </CapsuleFrame>
  );
}

/* Split dinner */
export function SplitScreen({ decorative = true }: ScreenProps) {
  const tips = [
    { label: "0%", on: false },
    { label: "10%", on: true },
    { label: "15%", on: false },
    { label: "20%", on: false },
  ];
  return (
    <CapsuleFrame
      title="Split dinner"
      origin="phone"
      icon={<ReceiptIcon size={22} stroke="#2F5BFF" />}
      decorative={decorative}
      ariaLabel="Bill split capsule, 4 people at 33.00 each"
    >
      <div
        style={{
          borderRadius: 22,
          background: "#2F5BFF",
          color: "#FFFFFF",
          padding: "18px 20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600 }}>Each person pays</span>
        <span
          style={{
            fontSize: 56,
            fontWeight: 800,
            lineHeight: "64px",
            letterSpacing: "-1.5px",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          33.00
        </span>
        <div style={{ display: "flex", gap: 18, fontSize: 14, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
          <span>Total 132.00</span>
          <span>Tip 12.00</span>
        </div>
      </div>

      <div style={{ borderRadius: 20, background: "#F5F7FB", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 12px 10px 16px" }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Bill</span>
          <span
            style={{
              width: 132,
              height: 44,
              borderRadius: 12,
              border: "1px solid #DCE2EE",
              background: "#FFFFFF",
              padding: "0 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              fontSize: 18,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            120.00
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 12px 10px 16px" }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>People</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Btn style={{ width: 44, height: 44, borderRadius: 22, border: "1px solid #DCE2EE", background: "#FFFFFF" }}>
              <MinusIcon size={18} stroke="#1B2236" />
            </Btn>
            <span style={{ minWidth: 36, textAlign: "center", fontSize: 20, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>4</span>
            <Btn style={{ width: 44, height: 44, borderRadius: 22, border: "1px solid #DCE2EE", background: "#FFFFFF" }}>
              <PlusIcon size={18} stroke="#1B2236" />
            </Btn>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "14px 12px 14px 16px" }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Tip</span>
          <div style={{ display: "flex", gap: 8 }}>
            {tips.map((t) => (
              <div
                key={t.label}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 12,
                  border: `1px solid ${t.on ? "#2F5BFF" : "#DCE2EE"}`,
                  background: t.on ? "#2F5BFF" : "#FFFFFF",
                  color: t.on ? "#FFFFFF" : "#1B2236",
                  fontSize: 15,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {t.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <span style={{ fontSize: 13, fontWeight: 500, color: "#5B6478" }}>
        Updates as you type. Each share is rounded to the cent.
      </span>
    </CapsuleFrame>
  );
}

/* Km to miles */
export function ConverterScreen({ decorative = true }: ScreenProps) {
  const picks = ["5 km", "10 km", "21.1 km", "42.2 km"];
  return (
    <CapsuleFrame
      title="Km to miles"
      origin="phone"
      icon={<SwapIcon size={22} stroke="#2F5BFF" />}
      decorative={decorative}
      ariaLabel="Converter capsule showing 10 kilometres as 6.21 miles"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "16px 18px", borderRadius: 22, background: "#F5F7FB" }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#5B6478" }}>Kilometres</span>
        <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span
            style={{
              flex: 1,
              minWidth: 0,
              height: 60,
              fontSize: 48,
              lineHeight: "60px",
              fontWeight: 800,
              letterSpacing: "-1px",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            10
          </span>
          <span style={{ fontSize: 20, fontWeight: 700, color: "#5B6478" }}>km</span>
        </span>
      </div>

      <div style={{ position: "relative", height: 8 }}>
        <span
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 52,
            height: 52,
            borderRadius: 26,
            border: "4px solid #FFFFFF",
            background: "#2F5BFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SwapIcon size={24} stroke="#FFFFFF" />
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "16px 18px", borderRadius: 22, background: "#EAF0FF" }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#2A47C7" }}>Miles</span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span
            style={{
              flex: 1,
              fontSize: 56,
              fontWeight: 800,
              lineHeight: "64px",
              letterSpacing: "-1.5px",
              color: "#2F5BFF",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            6.21
          </span>
          <span style={{ fontSize: 20, fontWeight: 700, color: "#2A47C7" }}>mi</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#3D4A66" }}>Common distances</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {picks.map((pick) => (
            <span
              key={pick}
              style={{
                height: 44,
                padding: "0 16px",
                borderRadius: 22,
                border: "1px solid #DCE2EE",
                background: "#FFFFFF",
                color: "#1B2236",
                fontSize: 15,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              {pick}
            </span>
          ))}
        </div>
      </div>

      <span style={{ fontSize: 13, fontWeight: 500, color: "#5B6478" }}>1 km is 0.621 mi</span>
    </CapsuleFrame>
  );
}

/* Tennis scoreboard */
export function TennisScreen({ decorative = true }: ScreenProps) {
  const players = [
    { name: "Me", points: "40", games: "Games 3", serving: false },
    { name: "Sam", points: "40", games: "Games 2", serving: true },
  ];
  const sets = [
    { label: "Set 1", a: "6", b: "4", ink: "#1B2236" },
    { label: "Set 2", a: "3", b: "2", ink: "#2F5BFF" },
    { label: "Set 3", a: "", b: "", ink: "#9AA4BA" },
  ];
  return (
    <CapsuleFrame
      title="Me vs Sam"
      origin="phone"
      icon={<TennisIcon size={22} stroke="#2F5BFF" />}
      decorative={decorative}
      ariaLabel="Tennis scoreboard capsule, deuce in the second set"
    >
      <div style={{ background: "#F5F7FB", borderRadius: 18, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", height: 18 }}>
          <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#5B6478" }}>Sets</span>
          {sets.map((s) => (
            <span key={s.label} style={{ display: "inline-block", width: 56, textAlign: "center", fontSize: 12, fontWeight: 600, color: "#5B6478" }}>
              {s.label}
            </span>
          ))}
        </div>
        {(["a", "b"] as const).map((side, idx) => (
          <div key={side} style={{ display: "flex", alignItems: "center", height: 26 }}>
            <span style={{ flex: 1, fontSize: 15, fontWeight: 700 }}>{idx === 0 ? "Me" : "Sam"}</span>
            {sets.map((s) => (
              <span
                key={s.label}
                style={{
                  display: "inline-block",
                  width: 56,
                  textAlign: "center",
                  fontSize: 18,
                  fontWeight: 800,
                  fontVariantNumeric: "tabular-nums",
                  color: s.ink,
                }}
              >
                {s[side]}
              </span>
            ))}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: 32,
            padding: "0 14px",
            borderRadius: 16,
            fontSize: 14,
            fontWeight: 700,
            background: "#FFEFE6",
            color: "#A8411A",
          }}
        >
          Deuce
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
        {players.map((pl) => (
          <div
            key={pl.name}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              padding: 14,
              borderRadius: 22,
              background: "#F5F7FB",
              border: "1.5px solid #F5F7FB",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 22 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{pl.name}</span>
              {pl.serving ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#A8411A" }}>
                  <TennisBallIcon size={14} />
                  Serve
                </span>
              ) : null}
            </div>
            <div style={{ fontSize: 76, fontWeight: 800, lineHeight: "84px", letterSpacing: "-2px", fontVariantNumeric: "tabular-nums" }}>
              {pl.points}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#5B6478" }}>{pl.games}</div>
            <Btn style={{ height: 52, borderRadius: 16, background: "#2F5BFF", color: "#FFFFFF", fontSize: 17, fontWeight: 700, gap: 6 }}>
              <PlusIcon size={18} stroke="#FFFFFF" />
              Point
            </Btn>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <Btn
          style={{
            flex: 1,
            height: 46,
            borderRadius: 15,
            border: "1px solid #DCE2EE",
            background: "#FFFFFF",
            color: "#1B2236",
            fontSize: 15,
            fontWeight: 600,
            gap: 6,
          }}
        >
          <ArrowLeftIcon size={18} stroke="#1B2236" />
          Undo
        </Btn>
        <Btn
          style={{
            flex: 1,
            height: 46,
            borderRadius: 15,
            border: "1px solid #DCE2EE",
            background: "#FFFFFF",
            color: "#1B2236",
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          New match
        </Btn>
      </div>
    </CapsuleFrame>
  );
}

/* Tennis on a foldable, two panes */
export function TennisFoldScreen({ decorative = true }: ScreenProps) {
  const history = [
    { label: "Point to Sam", score: "0-15", hot: false },
    { label: "Point to me", score: "15-15", hot: false },
    { label: "Point to me", score: "30-15", hot: false },
    { label: "Point to Sam", score: "30-30", hot: false },
    { label: "Point to Sam", score: "30-40", hot: false },
    { label: "Point to me, deuce", score: "40-40", hot: true },
  ];
  return (
    <CapsuleFrame
      size="fold"
      title="Me vs Sam"
      origin="phone"
      icon={<TennisIcon size={22} stroke="#2F5BFF" />}
      decorative={decorative}
      ariaLabel="Tennis capsule on a foldable, scoreboard on the left and point history on the right"
    >
      <div style={{ flex: 1, minHeight: 0, display: "flex", gap: 20, padding: 20 }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 34,
                padding: "0 16px",
                borderRadius: 17,
                background: "#FFEFE6",
                color: "#A8411A",
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              Deuce
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
            {[
              { name: "Me", games: "Games 3", serving: false },
              { name: "Sam", games: "Games 2", serving: true },
            ].map((pl) => (
              <div
                key={pl.name}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  padding: 20,
                  borderRadius: 24,
                  background: "#F5F7FB",
                  border: "1.5px solid #F5F7FB",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 26 }}>
                  <span style={{ fontSize: 20, fontWeight: 700 }}>{pl.name}</span>
                  {pl.serving ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 700, color: "#A8411A" }}>
                      <TennisBallIcon size={15} />
                      Serve
                    </span>
                  ) : null}
                </div>
                <div style={{ fontSize: 120, fontWeight: 800, lineHeight: "128px", letterSpacing: "-4px", fontVariantNumeric: "tabular-nums" }}>
                  40
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#5B6478" }}>{pl.games}</div>
                <Btn style={{ height: 56, borderRadius: 18, background: "#2F5BFF", color: "#FFFFFF", fontSize: 18, fontWeight: 700, gap: 6 }}>
                  <PlusIcon size={18} stroke="#FFFFFF" />
                  Point
                </Btn>
              </div>
            ))}
          </div>
        </div>

        <div style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#F5F7FB", borderRadius: 18, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", height: 18 }}>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#5B6478" }}>Sets</span>
              {["Set 1", "Set 2", "Set 3"].map((s) => (
                <span key={s} style={{ width: 56, textAlign: "center", fontSize: 12, fontWeight: 600, color: "#5B6478" }}>
                  {s}
                </span>
              ))}
            </div>
            {[
              { name: "Me", a: "6", b: "3" },
              { name: "Sam", a: "4", b: "2" },
            ].map((row) => (
              <div key={row.name} style={{ display: "flex", alignItems: "center", height: 28 }}>
                <span style={{ flex: 1, fontSize: 15, fontWeight: 700 }}>{row.name}</span>
                <span style={{ width: 56, textAlign: "center", fontSize: 18, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{row.a}</span>
                <span style={{ width: 56, textAlign: "center", fontSize: 18, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: "#2F5BFF" }}>
                  {row.b}
                </span>
                <span style={{ width: 56 }} />
              </div>
            ))}
          </div>

          <div
            style={{
              flex: 1,
              minHeight: 0,
              background: "#F5F7FB",
              borderRadius: 18,
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", height: 22, fontSize: 13, fontWeight: 700 }}>
              <span>This game</span>
              <span style={{ fontWeight: 600, color: "#5B6478" }}>Me-Sam</span>
            </div>
            {history.map((h, i) => (
              <div
                key={h.score}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  height: 30,
                  fontSize: 14,
                  borderTop: i === 0 ? undefined : "1px solid #E3E7F0",
                }}
              >
                <span style={{ fontWeight: h.hot ? 700 : 600, color: h.hot ? "#A8411A" : undefined }}>{h.label}</span>
                <span style={{ fontWeight: h.hot ? 800 : 700, fontVariantNumeric: "tabular-nums", color: h.hot ? "#A8411A" : "#3D4A66" }}>
                  {h.score}
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Btn
              style={{
                flex: 1,
                height: 46,
                borderRadius: 15,
                border: "1px solid #DCE2EE",
                background: "#FFFFFF",
                color: "#1B2236",
                fontSize: 15,
                fontWeight: 600,
                gap: 6,
              }}
            >
              <ArrowLeftIcon size={18} stroke="#1B2236" />
              Undo
            </Btn>
            <Btn
              style={{
                flex: 1,
                height: 46,
                borderRadius: 15,
                border: "1px solid #DCE2EE",
                background: "#FFFFFF",
                color: "#1B2236",
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              New match
            </Btn>
          </div>
        </div>
      </div>
    </CapsuleFrame>
  );
}

/* Pomodoro in dark mode, on a break */
export function PomodoroDarkScreen({ decorative = true }: ScreenProps) {
  return (
    <CapsuleFrame
      dark
      title="Pomodoro 50/10"
      origin="phone"
      icon={<TimerIcon size={22} stroke="#8FA6FF" />}
      decorative={decorative}
      ariaLabel="The same Pomodoro capsule in dark mode, six minutes forty left on a break"
    >
      <div style={{ display: "flex", padding: 3, borderRadius: 14, background: "rgba(255,255,255,0.06)" }}>
        <div
          style={{
            flex: 1,
            height: 44,
            borderRadius: 11,
            color: "#A3ACC0",
            fontSize: 15,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Focus 50 min
        </div>
        <div
          style={{
            flex: 1,
            height: 44,
            borderRadius: 11,
            background: "#3A2418",
            color: "#FFB08C",
            fontSize: 15,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Break 10 min
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", width: 252, height: 252 }}>
          <svg width="252" height="252" viewBox="0 0 252 252" aria-hidden="true">
            <circle cx="126" cy="126" r="110" fill="none" stroke="#263049" strokeWidth="14" />
            <circle
              cx="126"
              cy="126"
              r="110"
              fill="none"
              stroke="#FF7A45"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray="461 1000"
              transform="rotate(-90 126 126)"
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <span style={{ fontSize: 58, fontWeight: 800, lineHeight: "64px", letterSpacing: "-1.5px", fontVariantNumeric: "tabular-nums" }}>
              06:40
            </span>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#FFB08C" }}>Break</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <FramePrimaryButton label="Pause" icon={<PauseIcon size={18} />} />
        <div
          style={{
            height: 54,
            borderRadius: 18,
            background: "rgba(255,255,255,0.08)",
            color: "#EEF1F8",
            fontSize: 17,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Skip break
        </div>
      </div>
      <span style={{ textAlign: "center", fontSize: 13, fontWeight: 500, color: "#A3ACC0" }}>Next up: 50 min focus</span>
    </CapsuleFrame>
  );
}
