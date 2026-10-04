/*
 * JSON-LD builders. Every payload here is static site copy or stored capsule
 * metadata, never capsule HTML, and it is serialised with "<" escaped as
 * \u003c following Next.js's JSON-LD guide, so the payload cannot open a tag.
 *
 * Note for a future nonce-based CSP: an inline application/ld+json script needs
 * the request nonce once 'unsafe-inline' is removed.
 */

import { FAQ_ITEMS, type FaqItem } from "./faq";
import { APP_REPO, WEB_REPO } from "./links";

export const APP_DESCRIPTION =
  "Harmoniser builds small single-purpose apps for HarmonyOS from a sentence. Each capsule is validated JSON, and it only uses the permissions you allow.";

export function serialiseJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function websiteGraph(base: string, description: string = APP_DESCRIPTION) {
  const root = base.replace(/\/+$/, "");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${root}/#website`,
        url: `${root}/`,
        name: "Harmoniser",
        description,
        inLanguage: "en",
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${root}/#app`,
        name: "Harmoniser",
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "HarmonyOS",
        url: `${root}/`,
        description,
        isAccessibleForFree: true,
        sameAs: [APP_REPO, WEB_REPO],
      },
    ],
  };
}

export function faqPageGraph(items: readonly FaqItem[] = FAQ_ITEMS) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function breadcrumbGraph(base: string, trail: readonly { name: string; path: string }[]) {
  const root = base.replace(/\/+$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: step.name,
      item: `${root}${step.path}`,
    })),
  };
}
