import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/env";

/*
 * AI crawlers are listed explicitly so a future edit cannot silently drop them,
 * and each group repeats the /api and /pair rules: a crawler that matches its
 * own user-agent group ignores the "*" group, so inheriting the disallows is
 * not automatic.
 *
 * Policy: allow AI search, answer and training crawlers. To keep citations but
 * opt out of training, move CCBot (and the other training-only agents) into a
 * group with "disallow: /".
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Amazonbot",
  "Bytespider",
  "DuckAssistBot",
  "meta-externalagent",
];

const DISALLOW = ["/api/", "/pair"];

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl().replace(/\/+$/, "");
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: DISALLOW },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
