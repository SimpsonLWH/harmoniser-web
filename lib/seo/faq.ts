/*
 * One source for the landing FAQ and its FAQPage structured data, so the page
 * and the schema cannot drift.
 *
 * Wording rules: no em dashes, no banned marketing phrases, no claims the app
 * source does not support. Smart is the default AI mode. With provider keys on
 * the device it can use Mistral (EU) and Claude (outside the EU, allowed by
 * default), each after a notice naming the provider; one switch makes the cloud
 * EU-only. On-device only blocks cloud generation and the marketplace search
 * that runs during creation, and in that mode the Marketplace tab lists only the
 * shipped examples without a network call. Do not describe the cloud as off by
 * default or as EU-only by default.
 */

export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: "What is a capsule?",
    answer:
      "A capsule is a small single-purpose app described in a sentence and stored as plain JSON. Harmoniser checks it against a strict schema and draws it natively, so a timer, a checklist or a scoreboard is one capsule rather than a separate program.",
  },
  {
    question: "Do I need to download anything?",
    answer:
      "You install Harmoniser once on a HarmonyOS phone. Every capsule runs inside it, so the individual tiny apps do not need their own download or store listing.",
  },
  {
    question: "Which phones does it run on?",
    answer:
      "HarmonyOS. The team tests on an API 24 emulator, and the app needs API 20 or newer. There is no Android, iOS or web runtime for capsules; this website is where capsules are browsed, published and downloaded as JSON.",
  },
  {
    question: "What leaves my phone?",
    answer:
      "In the current hackathon build, rules and bundled templates run on the device and build most requests. Smart is the default AI mode. When a request needs a cloud model and a provider key is on the device, it goes to Mistral (EU) for logic when that key is configured, or to Claude (Anthropic, outside the EU) for live information such as a weather-based task list. If only one provider key is configured, the request uses it. Providers outside the EU are allowed by default. The app shows a notice naming the provider before it is used, unless that acceptance is already remembered, and one switch in Settings keeps the cloud EU-only. The provider receives the request text, plus one forecast line for a weather request that names a bundled city; a cloud edit also sends the capsule's definition, never its saved values. Snap reads a photo on the phone first and sends it to the configured provider only if that read fails and you let the cloud try. On-device only blocks cloud generation and the marketplace search that runs during creation. Marketplace browsing, installs, publishing, weather and device sharing are separate network features: weather sends only the chosen bundled city's coordinates to Open-Meteo, and device sharing asks before a capsule's first send and remembers the answer.",
  },
  {
    question: "What does it cost, and what is not built yet?",
    answer:
      "Nothing: it is a hackathon prototype with no accounts, payments, ads or app store listing. TV and watch capsules, capsule-triggered vibration, background notifications after the app closes, and voice input are not built yet.",
  },
  {
    question: "Is the source available?",
    answer:
      "Yes. The HarmonyOS app and this marketplace are separate public repositories, and the capsule schema is documented next to the app source. The marketplace never runs a capsule; it validates and stores the JSON.",
  },
];
