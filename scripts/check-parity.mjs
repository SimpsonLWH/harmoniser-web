/**
 * Parity check against the pinned upstream commit.
 *
 *   node scripts/check-parity.mjs            fetch each file from GitHub and compare to PIN.json,
 *                                            then warn when upstream main has moved on.
 *   node scripts/check-parity.mjs --offline  compare the local vendored copies to PIN.json only.
 *
 * Exit code 1 means the port needs review: the validator, expression parser, types or router
 * changed upstream, or the vendored copies were edited by hand.
 */

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const offline = process.argv.includes("--offline");
const vendorRoot = "vendor/upstream";
const pin = JSON.parse(await readFile(join(vendorRoot, "PIN.json"), "utf8"));

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

let failed = false;
for (const [path, expected] of Object.entries(pin.files)) {
  let bytes;
  if (offline) {
    bytes = await readFile(join(vendorRoot, pin.sha, path));
  } else {
    const url = `https://raw.githubusercontent.com/${pin.repo}/${pin.sha}/${path}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`FAIL ${path}: HTTP ${response.status}`);
      failed = true;
      continue;
    }
    bytes = Buffer.from(await response.arrayBuffer());
  }
  const actual = sha256(bytes);
  if (actual !== expected) {
    console.error(`FAIL ${path}: ${offline ? "local copy" : "upstream"} hash ${actual} != pinned ${expected}`);
    failed = true;
  } else {
    console.log(`ok   ${path}`);
  }
}

if (!offline) {
  try {
    const response = await fetch(`https://api.github.com/repos/${pin.repo}/commits/main`, {
      headers: { accept: "application/vnd.github+json" },
    });
    if (response.ok) {
      const latest = (await response.json()).sha;
      if (latest !== pin.sha) {
        console.warn(
          `warn upstream main is now ${latest}; pinned is ${pin.sha}. Re-vendor and re-check the port when convenient.`,
        );
      } else {
        console.log("ok   upstream main still matches the pinned commit");
      }
    }
  } catch {
    console.warn("warn could not check upstream main (network).");
  }
}

if (failed) {
  process.exit(1);
}
console.log(offline ? "Parity lock matches the vendored copies." : "Parity lock matches upstream.");
