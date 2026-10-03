import { createRelay, type RelayOptions } from "@/lib/devices/relay";
import type { JsonObject } from "@/lib/devices/json";
import { createMemoryStore } from "@/lib/devices/memory-store";

export const BASE = "https://relay.test";
export const T0 = 1_700_000_000_000;

export interface Clock {
  now: () => number;
  advance: (ms: number) => void;
}

export function clock(start: number = T0): Clock {
  let time = start;
  return {
    now: () => time,
    advance: (ms) => {
      time += ms;
    },
  };
}

export function setup(options: Omit<RelayOptions, "now"> = {}) {
  const time = clock();
  const store = createMemoryStore();
  const relay = createRelay(store, { ...options, now: time.now });
  const register = (hw = "board-1", ip = "10.0.0.1") => relay.register({ hw, kind: "wrist", fw: "test" }, BASE, ip);
  return { time, store, relay, register };
}

export async function status(promise: Promise<unknown>): Promise<number | string> {
  try {
    await promise;
    return "resolved";
  } catch (error) {
    return (error as { status?: number }).status ?? String(error);
  }
}

export const bytes = (text: string): Uint8Array => new TextEncoder().encode(text);
export const obj = (value: JsonObject): JsonObject => value;
