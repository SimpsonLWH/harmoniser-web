import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/*
 * A narrow guard for the claims that must match the current light-only build.
 * These read the source on purpose: the frame components are heavy to render,
 * and the risk is copy drifting back to a shipped feature the app does not have.
 */

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const read = (path: string) => readFileSync(`${ROOT}${path}`, "utf8");

describe("landing page claims match the current build", () => {
  it("does not promise a dark mode or a system theme", () => {
    const page = read("app/page.tsx");
    expect(page).not.toMatch(/goes dark|follows the system theme/i);
    expect(page).toMatch(/light mode/);
  });

  it("shows a light frame in the fold section", () => {
    const fold = read("components/landing/FoldDark.tsx");
    expect(fold).not.toMatch(/PomodoroDarkScreen/);
    expect(fold).toMatch(/PomodoroScreen/);
  });

  it("does not put a count on the enforced permissions", () => {
    const bento = read("components/landing/Bento.tsx");
    expect(bento).not.toMatch(/Four capsule permissions/);
    expect(bento).toMatch(/Capsule permissions are checked/);
  });
});
