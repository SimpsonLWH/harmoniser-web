/**
 * Regenerates vendor/upstream/PIN.json: the upstream repo, the pinned commit and the SHA-256 of
 * every vendored file. Run this only after deliberately re-vendoring at a new commit:
 *   node scripts/update-parity-lock.mjs
 */

import { createHash } from "node:crypto";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const repo = "Akshaz7/capsules-harmonyos";
const vendorRoot = "vendor/upstream";

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir)) {
    const full = join(dir, entry);
    const info = await stat(full);
    if (info.isDirectory()) {
      out.push(...(await walk(full)));
    } else {
      out.push(full);
    }
  }
  return out;
}

const shas = (await readdir(vendorRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && entry.name !== "node_modules")
  .map((entry) => entry.name);

if (shas.length !== 1) {
  throw new Error(`Expected exactly one pinned upstream SHA in ${vendorRoot}, found ${shas.length}`);
}
const sha = shas[0];
const base = join(vendorRoot, sha);
const files = {};
for (const file of (await walk(base)).sort()) {
  const bytes = await readFile(file);
  files[relative(base, file)] = createHash("sha256").update(bytes).digest("hex");
}
const pin = {
  repo,
  sha,
  files,
  note: "Vendored read-only copies of the marketplace-relevant ArkTS sources at this commit.",
};
await writeFile(join(vendorRoot, "PIN.json"), `${JSON.stringify(pin, null, 2)}\n`, "utf8");
console.log(`Wrote ${Object.keys(files).length} file hashes for ${repo}@${sha}.`);
