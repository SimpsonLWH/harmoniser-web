/*
 * Pure state for the live "Tasks with weather" frame. Kept out of the component
 * so the behaviour is unit-tested and the frame stays presentational.
 */

export type Weather = "sun" | "cloud" | "rain" | "snow" | "";

export type Task = {
  id: string;
  name: string;
  weather: Weather;
  done: boolean;
};

export const WEATHER_ORDER: Weather[] = ["sun", "cloud", "rain", "snow"];

export const WEATHER_LABELS: Record<Exclude<Weather, "">, string> = {
  sun: "Sunny",
  cloud: "Cloudy",
  rain: "Rainy",
  snow: "Snowy",
};

export const MAX_TASKS = 5;

export function weatherLabel(weather: Weather): string {
  return weather === "" ? "Weather?" : WEATHER_LABELS[weather];
}

export function toggleTask(tasks: Task[], id: string): Task[] {
  return tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task));
}

export function setWeather(tasks: Task[], id: string, weather: Weather): Task[] {
  return tasks.map((task) => (task.id === id ? { ...task, weather } : task));
}

/** Picking the weather that is already set clears it, like the app's own chips. */
export function pickWeather(tasks: Task[], id: string, weather: Weather): Task[] {
  const task = tasks.find((t) => t.id === id);
  if (task === undefined) {
    return tasks;
  }
  return setWeather(tasks, id, task.weather === weather ? "" : weather);
}

export function renameTask(tasks: Task[], id: string, name: string): Task[] {
  return tasks.map((task) => (task.id === id ? { ...task, name } : task));
}

export function addTask(tasks: Task[], id: string): Task[] {
  if (tasks.length >= MAX_TASKS) {
    return tasks;
  }
  return tasks.concat([{ id, name: "", weather: "", done: false }]);
}

export function doneCount(tasks: Task[]): number {
  return tasks.filter((task) => task.done).length;
}

export function progress(tasks: Task[]): number {
  if (tasks.length === 0) {
    return 0;
  }
  return Math.round((doneCount(tasks) / tasks.length) * 100);
}

export function completeTask(tasks: Task[], id: string): Task[] {
  return tasks.map((task) => (task.id === id ? { ...task, done: true } : task));
}
