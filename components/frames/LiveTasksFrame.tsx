"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import {
  addTask,
  completeTask,
  doneCount,
  pickWeather,
  progress,
  toggleTask,
  WEATHER_ORDER,
  weatherLabel,
  type Task,
  type Weather,
} from "@/lib/frames/tasks";

import { CapsuleFrame } from "./CapsuleFrame";
import { ChecklistIcon, CloudIcon, InfoIcon, PlusIcon, RainIcon, SnowIcon, SunIcon } from "./icons";

/*
 * The one live capsule on the site: the "Tasks with weather" frame responds to
 * real taps and keys. It also settles one task by itself on first view, which
 * shows the progress bar filling without a video.
 */

const INITIAL: Task[] = [
  { id: "tennis", name: "Book a tennis court", weather: "sun", done: true },
  { id: "wawel", name: "Walk up to Wawel Castle", weather: "rain", done: false },
  { id: "blank", name: "", weather: "", done: false },
];

const WEATHER_ICONS: Record<Exclude<Weather, "">, (props: { size: number; stroke: string }) => React.ReactNode> = {
  sun: ({ size, stroke }) => <SunIcon size={size} stroke={stroke} />,
  cloud: ({ size, stroke }) => <CloudIcon size={size} stroke={stroke} />,
  rain: ({ size, stroke }) => <RainIcon size={size} stroke={stroke} />,
  snow: ({ size, stroke }) => <SnowIcon size={size} stroke={stroke} />,
};

export function LiveTasksFrame() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL);
  const touched = useRef(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) {
      return;
    }
    const timer = window.setTimeout(() => {
      if (!touched.current) {
        setTasks((current) => completeTask(current, "wawel"));
      }
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [reduce]);

  const done = doneCount(tasks);
  const pct = progress(tasks);

  function act(update: (current: Task[]) => Task[]) {
    touched.current = true;
    setTasks(update);
  }

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.15 }}
    >
      <CapsuleFrame
        title="Tasks with weather"
        origin="marketplace"
        icon={<ChecklistIcon size={22} stroke="#2F5BFF" />}
        decorative={false}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <span aria-live="polite" style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.3px" }}>
              {done} of {tasks.length} done
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#5B6478" }}>{pct}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "#E4E9F3", overflow: "hidden" }}>
            <motion.div
              animate={{ width: `${pct}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 22 }}
              style={{ height: 8, borderRadius: 4, background: "#2F5BFF" }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, lineHeight: "18px", color: "#5B6478" }}>
            <InfoIcon size={15} stroke="#5B6478" />
            <span>You set the weather. It is not looked up online.</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tasks.map((task, index) => (
            <div
              key={task.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "10px 12px 12px 6px",
                borderRadius: 18,
                background: "#F5F7FB",
              }}
            >
              <button
                type="button"
                aria-pressed={task.done}
                aria-label={`${task.done ? "Mark not done" : "Mark done"}: ${task.name || `Task ${index + 1}`}`}
                onClick={() => act((current) => toggleTask(current, task.id))}
                style={{
                  width: 48,
                  height: 48,
                  flexShrink: 0,
                  border: 0,
                  background: "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                {task.done ? (
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 8,
                      background: "#2F5BFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M5 12.5l4.2 4.2L19 7" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                ) : (
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      boxSizing: "border-box",
                      borderRadius: 8,
                      border: "2px solid #8E99B2",
                      background: "#FFFFFF",
                    }}
                  />
                )}
              </button>

              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6, paddingTop: 2 }}>
                <span
                  style={{
                    minHeight: 32,
                    display: "flex",
                    alignItems: "center",
                    fontSize: 16,
                    fontWeight: 600,
                    color: task.done ? "#5B6478" : "#1B2236",
                    textDecorationLine: task.done ? "line-through" : undefined,
                    textDecorationColor: "rgba(91,100,120,0.5)",
                  }}
                >
                  {task.name || `Task ${index + 1}`}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    role="group"
                    aria-label={`Weather for ${task.name || `Task ${index + 1}`}`}
                    style={{
                      display: "flex",
                      padding: 2,
                      borderRadius: 12,
                      background: "#FFFFFF",
                      border: "1px solid #E3E7F0",
                    }}
                  >
                    {WEATHER_ORDER.map((weather) => {
                      const active = task.weather === weather;
                      const ink = active ? "#FFFFFF" : "#5B6478";
                      const Icon = WEATHER_ICONS[weather as Exclude<Weather, "">];
                      const label = weatherLabel(weather);
                      return (
                        <button
                          key={weather}
                          type="button"
                          aria-pressed={active}
                          aria-label={label}
                          title={label}
                          onClick={() => act((current) => pickWeather(current, task.id, weather))}
                          style={{
                            width: 48,
                            height: 44,
                            border: 0,
                            background: "transparent",
                            borderRadius: 10,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                            cursor: "pointer",
                          }}
                        >
                          <span
                            style={{
                              width: 44,
                              height: 36,
                              borderRadius: 10,
                              background: active ? "#2F5BFF" : "transparent",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Icon size={20} stroke={ink} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      color: task.weather ? "#1B2236" : "#5B6478",
                    }}
                  >
                    {weatherLabel(task.weather)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {tasks.length < 5 ? (
          <button
            type="button"
            onClick={() => act((current) => addTask(current, `task-${current.length + 1}-${Date.now()}`))}
            style={{
              height: 48,
              borderRadius: 16,
              border: "1.5px dashed #B9C4E4",
              background: "transparent",
              color: "#2A47C7",
              fontSize: 15,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <PlusIcon size={18} stroke="#2A47C7" />
            Add task
          </button>
        ) : null}
      </CapsuleFrame>
    </motion.div>
  );
}
