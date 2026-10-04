/*
 * One source for the landing FAQ and its FAQPage structured data, so the page
 * and the schema cannot drift.
 *
 * Wording rules: no em dashes, no banned marketing phrases, no claims the app
 * source does not support. Smart is the default AI mode. The only cloud
 * provider is Claude by Anthropic, which is outside the EU, and it needs an
 * Anthropic key on the device. It is used after a notice naming it; dismissing
 * that notice sends nothing. On-device only blocks cloud generation and the
 * marketplace search that runs during creation, and in that mode the Marketplace
 * tab lists only the shipped examples without a network call. Do not describe an
 * EU provider or an EU-only setting: the shipped build has neither.
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
      "In the current hackathon build, rules and bundled templates run on the device and build most requests. Smart is the default AI mode. When a request needs a cloud model, such as scoring logic or a weather-based task list, the app uses Claude by Anthropic, which is outside the EU, and shows a notice naming it before the first use. Dismissing that notice sends nothing. With no provider key on the device, nothing is sent to a model provider. Claude receives the request text, plus one forecast line for a weather request that names a bundled city; a cloud edit also sends the capsule's definition, never its saved values. Snap reads a photo on the phone first and sends it to Claude only if that read fails and you let the cloud try. On-device only blocks cloud generation and the marketplace search that runs during creation. Marketplace browsing, installs, publishing, weather and device sharing are separate network features: weather sends only the chosen bundled city's coordinates to Open-Meteo, and device sharing asks before a capsule's first send and remembers the answer.",
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
