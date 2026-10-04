import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/*
 * The house rule for this site: no em dashes or en dashes anywhere, and none of
 * the phrases that make copy read as machine-written. The test scans the repo so
 * the rule cannot quietly rot.
 */

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SKIP_DIRS = new Set(["node_modules", ".next", ".vercel", ".git", "coverage", "public"]);
const SCAN_EXTENSIONS = [".ts", ".tsx", ".md", ".css", ".mjs", ".json"];
const SKIP_FILES = new Set(["package-lock.json", "tsconfig.tsbuildinfo"]);
/* This file lists the banned phrases and dash escapes, so it is not scanned. */
const SELF = "no-ai-tells.test.ts";

const DASHES = ["\u2014", "\u2013"];
const DASH_ESCAPES = ["\\u2014", "\\u2013"];
const BANNED_PHRASES = [
  "seamless",
  "effortless",
  "unleash",
  "game-chang",
  "cutting-edge",
  "revolutioniz",
  "in today's fast",
  "supercharge",
  "elevate your",
  "best-in-class",
  "world-class",
  "state-of-the-art",
  "next-gen",
];

function sourceFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) {
      continue;
    }
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      sourceFiles(full, found);
      continue;
    }
    if (SKIP_FILES.has(entry) || entry === SELF || !SCAN_EXTENSIONS.some((ext) => entry.endsWith(ext))) {
      continue;
    }
    found.push(full);
  }
  return found;
}

/** `next dev` rewrites this block on every run, so it is not ours to police. */
function stripGeneratedAgentRules(text: string): string {
  return text.replace(/<!-- BEGIN:nextjs-agent-rules -->[\s\S]*?<!-- END:nextjs-agent-rules -->/g, "");
}

describe("copy rules", () => {
  const files = sourceFiles(ROOT);

  it("finds the sources it is meant to check", () => {
    expect(files.length).toBeGreaterThan(30);
  });

  it("has no em dashes or en dashes", () => {
    const offenders = files.filter((file) => {
      const text = stripGeneratedAgentRules(readFileSync(file, "utf8"));
      return DASHES.some((dash) => text.includes(dash)) || DASH_ESCAPES.some((esc) => text.includes(esc));
    });
    expect(offenders.map((file) => relative(ROOT, file))).toEqual([]);
  });

  it("has none of the banned phrases", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8").toLowerCase();
      for (const phrase of BANNED_PHRASES) {
        if (text.includes(phrase)) {
          offenders.push(`${relative(ROOT, file)}: ${phrase}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
