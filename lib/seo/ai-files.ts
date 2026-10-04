/*
 * Content for /llms.txt and /llms-full.txt, built from the same facts as the
 * site. One module so the two files cannot drift.
 *
 * llms.txt is an emerging convention, not a cross-vendor standard. Both files
 * say so, and neither claims to influence ranking or citation.
 */

import { FAQ_ITEMS } from "./faq";
import { APP_REPO, CAPSULE_SCHEMA_DOC, NATIVE_INTEGRATION_DOC, WEB_REPO } from "./links";

const LIMITS = [
  "This is a HackYeah 2026 research build. It is tested on an API 24 emulator; a phone check is pending for several features.",
  "There is no app store listing. The only published binaries are pre-release test builds on the app repository's releases page, and they can be older than the behaviour described here. Build instructions live in the app repository.",
  "TV and watch capsules, capsule-triggered vibration, background notifications after the app closes, and voice input are not built.",
  "The wrist companion is an ESP32 stand-in. It does not run HarmonyOS.",
  "llms.txt is an emerging convention, not a ranking or citation factor. This file does not guarantee that any AI system will ingest, quote or cite the site.",
] as const;

function root(base: string): string {
  return base.replace(/\/+$/, "");
}

function keyPages(base: string): string[] {
  const url = root(base);
  return [
    `- [Home](${url}/): what Harmoniser is, the interactive capsule preview, and the answers to common questions.`,
    `- [Capsule marketplace](${url}/capsules): published capsules as validated JSON, browsable without an account.`,
    `- [Publish a capsule](${url}/publish): validate and publish a capsule, then keep the owner token that deletes it.`,
    `- [Virtual device](${url}/device): a browser tab that pairs like the wrist companion and shows a sent timer or counter.`,
    `- [Privacy policy](${url}/privacy) and [Terms of service](${url}/terms): what the site and app store, and what they do not.`,
  ];
}

function sourceLines(): string[] {
  return [
    `- App repository (HarmonyOS): ${APP_REPO}`,
    `- Web repository (this marketplace): ${WEB_REPO}`,
    `- Capsule schema documentation: ${CAPSULE_SCHEMA_DOC}`,
    `- Native integration notes for the app: ${NATIVE_INTEGRATION_DOC}`,
  ];
}

export function llmsTxt(base: string): string {
  return `${[
    "# Harmoniser",
    "",
    "> Harmoniser is a HarmonyOS app builder for tiny apps you don't need to download. Describe what you need and it builds a capsule: a small single-purpose app stored as plain, validated JSON.",
    "",
    "Harmoniser is a HackYeah 2026 prototype. This file gives AI systems a short, accurate summary and links to the pages that carry the detail.",
    "",
    "## What a capsule is",
    "",
    "- A capsule is declarations, not arbitrary code: a strict schema validator rejects unknown fields, types and actions before anything runs.",
    "- Capsules cover timers, counters, checklists, inputs, displays and schema v1 scoring and arithmetic, and they can run on a HarmonyOS home screen as a 2x2 or 2x4 widget.",
    "- A capsule declares the permissions it needs. The app asks before granting each one, and a denied feature is drawn as blocked and written to a log.",
    "",
    "## What runs locally and what uses the network",
    "",
    "- Rules and bundled templates run on the device.",
    "- Smart is the default AI mode in the current hackathon build. A request that needs a cloud model goes to Mistral (EU) for logic where Mistral is configured, or to Claude (Anthropic, outside the EU) for live information such as weather-based task lists, news, prices and opening hours. Providers outside the EU are allowed by default. With no provider key on the device, nothing is sent to a model provider.",
    "- The app shows a notice naming the provider before its first use. One switch in Settings keeps the cloud EU-only, and On-device only mode turns cloud generation off.",
    "- The provider receives the request text, plus one forecast line for a weather request that names a bundled city. For other live requests Anthropic may run a web search on its side. A cloud edit also sends the capsule's definition, never its saved values.",
    "- On-device only blocks cloud generation and the marketplace search that runs during creation. In that mode the Marketplace tab lists only the examples shipped with the app and makes no network call.",
    "- Weather sends the chosen bundled city's coordinates to Open-Meteo and shows the attribution on the card.",
    "- Device sharing asks before a capsule's first send and remembers the answer, and the request sheet shows what leaves the phone.",
    "",
    "## Key pages",
    "",
    ...keyPages(base),
    "",
    "## Source and documentation",
    "",
    ...sourceLines(),
    "",
    "## Limits",
    "",
    ...LIMITS.map((line) => `- ${line}`),
    "",
  ].join("\n")}\n`;
}

export function llmsFullTxt(base: string): string {
  const questions = FAQ_ITEMS.map((item) => `### ${item.question}\n\n${item.answer}`).join("\n\n");
  return `${llmsTxt(base)}
## Questions and answers

${questions}
`;
}
