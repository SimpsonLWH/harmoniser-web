import { describe, expect, it } from "vitest";

import {
  addTask,
  completeTask,
  doneCount,
  MAX_TASKS,
  pickWeather,
  progress,
  toggleTask,
  weatherLabel,
  type Task,
} from "@/lib/frames/tasks";

const tasks: Task[] = [
  { id: "a", name: "Book a tennis court", weather: "sun", done: true },
  { id: "b", name: "Walk up to Wawel Castle", weather: "rain", done: false },
  { id: "c", name: "", weather: "", done: false },
];

describe("live tasks frame", () => {
  it("counts and percentages follow the ticks", () => {
    expect(doneCount(tasks)).toBe(1);
    expect(progress(tasks)).toBe(33);
    expect(doneCount(toggleTask(tasks, "b"))).toBe(2);
    expect(progress(toggleTask(tasks, "b"))).toBe(67);
  });

  it("never divides by zero on an empty list", () => {
    expect(progress([])).toBe(0);
  });

  it("picking the same weather twice clears it, like the app's chips", () => {
    const cleared = pickWeather(tasks, "a", "sun");
    expect(cleared[0].weather).toBe("");
    expect(pickWeather(tasks, "a", "snow")[0].weather).toBe("snow");
  });

  it("ignores a pick for a task that is gone", () => {
    expect(pickWeather(tasks, "missing", "sun")).toEqual(tasks);
  });

  it("stops adding tasks at the frame's limit", () => {
    const full = [0, 1, 2, 3, 4].reduce((list, i) => addTask(list, `t${i}`), [] as Task[]);
    expect(full).toHaveLength(MAX_TASKS);
    expect(addTask(full, "extra")).toHaveLength(MAX_TASKS);
  });

  it("labels an empty weather slot", () => {
    expect(weatherLabel("")).toBe("Weather?");
    expect(weatherLabel("rain")).toBe("Rainy");
  });

  it("completes a task once, for the entrance animation", () => {
    expect(completeTask(tasks, "b")[1].done).toBe(true);
    expect(completeTask(tasks, "b")[0].done).toBe(true);
  });
});
