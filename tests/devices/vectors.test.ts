// The firmware's own vectors (tests/vectors/, copied from esp32-companion) against the ports.
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { cutLabelBytes, utf8Valid } from "@/lib/devices/capsule";
import { jsonScan } from "@/lib/devices/json";

const here = (name: string) => fileURLToPath(new URL(`./vectors/${name}`, import.meta.url));
const firmware = (name: string) =>
  fileURLToPath(new URL(`../../../esp32-companion/tests/vectors/${name}`, import.meta.url));

function lines(name: string): string[] {
  return readFileSync(here(name), "utf8")
    .split("\n")
    .filter((line) => line !== "" && !line.startsWith("#"));
}

function hex(text: string): Uint8Array {
  return Uint8Array.from(Buffer.from(text, "hex"));
}

// "61*47 c3a9" -> bytes; "-" -> nothing.
function labelBytes(spec: string): Uint8Array {
  const parts = spec.trim() === "-" ? [] : spec.trim().split(/\s+/);
  return Uint8Array.from(
    parts.flatMap((part) => {
      const [digits, times] = part.split("*");
      const unit = [...hex(digits ?? "")];
      return Array.from({ length: Number(times ?? "1") }, () => unit).flat();
    }),
  );
}

describe("firmware vectors", () => {
  for (const name of ["json_scan.txt", "labels.txt"]) {
    it.skipIf(!existsSync(firmware(name)))(`${name} is the firmware's current copy`, () => {
      expect(readFileSync(here(name), "utf8")).toBe(readFileSync(firmware(name), "utf8"));
    });
  }

  const scanCases = lines("json_scan.txt").map((line) => {
    const tab = line.indexOf("\t");
    return { want: line.slice(0, tab), body: line.slice(tab + 1) };
  });

  it("has the json_scan vectors", () => {
    expect(scanCases.length).toBeGreaterThanOrEqual(40);
  });

  it.each(scanCases)("json_scan $want: $body", ({ want, body }) => {
    const raw = body.startsWith("hex:") ? hex(body.slice(4)) : new TextEncoder().encode(body);
    expect(jsonScan(raw, 8)).toBe(want);
  });

  const labelCases = lines("labels.txt").map((line) => {
    const [valid, label, stored] = line.split("|");
    return { valid: valid?.trim() === "1", label: label ?? "", stored: stored ?? "" };
  });

  it("has the label vectors", () => {
    expect(labelCases.length).toBeGreaterThan(45);
  });

  it.each(labelCases)("label $label -> $stored (valid: $valid)", ({ valid, label, stored }) => {
    const raw = labelBytes(label);
    expect(utf8Valid(raw)).toBe(valid);
    expect([...cutLabelBytes(raw)]).toEqual([...labelBytes(stored)]);
  });
});
