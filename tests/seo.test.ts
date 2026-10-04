import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import robots from "@/app/robots";
import { llmsFullTxt, llmsTxt } from "@/lib/seo/ai-files";
import { buildCapsuleMetadata, buildSitemap } from "@/lib/seo/build";
import { FAQ_ITEMS } from "@/lib/seo/faq";
import { breadcrumbGraph, faqPageGraph, serialiseJsonLd, websiteGraph } from "@/lib/seo/jsonld";

const BASE = "https://harmoniser.example";

describe("sitemap", () => {
  const entries = buildSitemap(BASE, [
    { id: "6ac16a596ec2f7e4695b5920", updatedAt: new Date("2026-10-04T01:00:00Z") },
    { id: "6ac166c06ec2f7e4695b591e" },
  ]);

  it("lists the static routes with real change frequencies", () => {
    const urls = entries.map((entry) => entry.url);
    expect(urls.slice(0, 6)).toEqual([
      `${BASE}/`,
      `${BASE}/capsules`,
      `${BASE}/device`,
      `${BASE}/publish`,
      `${BASE}/privacy`,
      `${BASE}/terms`,
    ]);
    expect(entries[0].changeFrequency).toBe("weekly");
    expect(entries[1].changeFrequency).toBe("daily");
    expect(entries[0].priority).toBeGreaterThan(entries[5].priority ?? 0);
  });

  it("appends described capsules and carries their updatedAt", () => {
    const extra = entries.slice(6);
    expect(extra.map((entry) => entry.url)).toEqual([
      `${BASE}/capsules/6ac16a596ec2f7e4695b5920`,
      `${BASE}/capsules/6ac166c06ec2f7e4695b591e`,
    ]);
    expect(extra[0].lastModified).toEqual(new Date("2026-10-04T01:00:00Z"));
    expect(extra[1].lastModified).toBeUndefined();
  });

  it("never advertises api or pairing routes, and degrades to the static list", () => {
    expect(entries.some((entry) => entry.url.includes("/api"))).toBe(false);
    expect(entries.some((entry) => entry.url.endsWith("/pair"))).toBe(false);
    expect(buildSitemap(BASE, [])).toHaveLength(6);
  });

  it("emits no request-time timestamp on the static routes", () => {
    expect(entries.slice(0, 6).some((entry) => entry.lastModified !== undefined)).toBe(false);
  });
});

describe("capsule metadata", () => {
  it("indexes a capsule only when the publisher wrote a description", () => {
    const described = buildCapsuleMetadata(BASE, {
      id: "abc",
      name: "Tasks with weather",
      description: "A task list with a weather marker you set yourself.",
    });
    expect(described.robots).toEqual({ index: true, follow: true });
    expect(described.alternates?.canonical).toBe(`${BASE}/capsules/abc`);
    expect(described.description).toBe("A task list with a weather marker you set yourself.");

    const bare = buildCapsuleMetadata(BASE, { id: "abc", name: "Daily motivation", description: "" });
    expect(bare.robots).toEqual({ index: false, follow: true });
    expect(String(bare.description)).toContain("did not add a description");
  });
});

describe("robots", () => {
  const output = robots();
  const groups = Array.isArray(output.rules) ? output.rules : [output.rules];

  it("covers the documented AI crawlers", () => {
    const agents = groups.flatMap((group) =>
      Array.isArray(group.userAgent) ? group.userAgent : [group.userAgent],
    );
    for (const agent of ["GPTBot", "OAI-SearchBot", "PerplexityBot", "ClaudeBot", "Google-Extended", "CCBot"]) {
      expect(agents).toContain(agent);
    }
  });

  it("keeps api and pairing routes out of every group", () => {
    for (const group of groups) {
      expect(group.disallow).toEqual(["/api/", "/pair"]);
    }
  });

  it("points at the sitemap", () => {
    expect(String(output.sitemap)).toMatch(/\/sitemap\.xml$/);
  });
});

describe("structured data", () => {
  it("escapes angle brackets so a payload cannot open a tag", () => {
    expect(serialiseJsonLd({ name: "<script>alert(1)</script>" })).not.toContain("<");
    expect(serialiseJsonLd({ name: "<script>" })).toContain("\\u003c");
  });

  it("describes the site and the app without invented ratings or offers", () => {
    const graph = websiteGraph(BASE) as { "@graph": Record<string, unknown>[] };
    const types = graph["@graph"].map((node) => node["@type"]);
    expect(types).toEqual(["WebSite", "SoftwareApplication"]);
    const app = graph["@graph"][1];
    expect(app.operatingSystem).toBe("HarmonyOS");
    expect(app.isAccessibleForFree).toBe(true);
    const flat = JSON.stringify(graph).toLowerCase();
    for (const forbidden of ["aggregaterating", "ratingvalue", "reviewcount", "\"offers\"", "price"]) {
      expect(flat).not.toContain(forbidden);
    }
  });

  it("builds one question per FAQ entry from the same array the page renders", () => {
    const schema = faqPageGraph(FAQ_ITEMS) as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
    expect(schema.mainEntity).toHaveLength(FAQ_ITEMS.length);
    expect(schema.mainEntity.map((entry) => entry.name)).toEqual(FAQ_ITEMS.map((item) => item.question));
    expect(schema.mainEntity.every((entry) => entry.acceptedAnswer.text.length > 40)).toBe(true);
  });

  it("positions breadcrumb entries in order", () => {
    const crumbs = breadcrumbGraph(BASE, [
      { name: "Home", path: "/" },
      { name: "Marketplace", path: "/capsules" },
      { name: "Water", path: "/capsules/abc" },
    ]) as { itemListElement: { position: number; item: string }[] };
    expect(crumbs.itemListElement.map((entry) => entry.position)).toEqual([1, 2, 3]);
    expect(crumbs.itemListElement[2].item).toBe(`${BASE}/capsules/abc`);
  });
});

describe("AI readable files", () => {
  const short = llmsTxt(BASE);
  const full = llmsFullTxt(BASE);

  it("opens with the project summary and links the key pages", () => {
    expect(short.startsWith("# Harmoniser\n")).toBe(true);
    expect(short).toContain("> Harmoniser is a HarmonyOS app builder");
    for (const path of ["/", "/capsules", "/publish", "/device", "/privacy", "/terms"]) {
      expect(short).toContain(`(${BASE}${path})`);
    }
  });

  it("states the network behaviour and the limits without overclaiming", () => {
    expect(short).toMatch(/Smart is the default AI mode/);
    expect(short).toMatch(/Claude by Anthropic, which is outside the EU/);
    expect(short).toMatch(/notice naming Claude and saying it is outside the EU before the first use/);
    expect(short).toMatch(/Dismissing that notice sends nothing/);
    expect(short).toMatch(/With no provider key on the device, nothing is sent to a model provider/);
    expect(short).toMatch(/On-device only mode turns cloud generation off/);
    expect(short).toMatch(/On-device only blocks cloud generation/);
    expect(short).toMatch(/Open-Meteo/);
    expect(short).toMatch(/Snap button reads a photo on the phone first/);
    expect(short).toMatch(/ESP32 stand-in/);
    expect(short).toMatch(/not a ranking or citation factor/);
    expect(short).not.toMatch(/never leaves the phone|nothing leaves the phone/i);
    /*
     * Claude is the only cloud provider in the shipped app and it is outside the EU. There is no EU
     * provider and no EU-only default, and the cloud receives more than the request text.
     */
    const leaves = FAQ_ITEMS.find((item) => item.question === "What leaves my phone?")?.answer ?? "";
    for (const text of [full, leaves]) {
      expect(text).toMatch(/Claude by Anthropic, which is outside the EU/);
      expect(text).toMatch(/Dismissing that notice sends nothing/);
    }
    for (const text of [full, ...FAQ_ITEMS.map((item) => item.answer)]) {
      expect(text).not.toMatch(/cloud ai is off by default|the cloud model is a switch|need a separate setting|only the request text/i);
      expect(text).not.toMatch(/Mistral|off by default|EU cloud provider|EU-only|non-EU providers/i);
    }
  });

  it("includes every FAQ answer in the full file", () => {
    for (const item of FAQ_ITEMS) {
      expect(full).toContain(`### ${item.question}`);
      expect(full).toContain(item.answer);
    }
    expect(full.startsWith(short)).toBe(true);
  });
});

describe("page metadata coverage", () => {
  const root = new URL("..", import.meta.url).pathname;
  const routes = [
    "app/page.tsx",
    "app/capsules/page.tsx",
    "app/publish/page.tsx",
    "app/device/page.tsx",
    "app/privacy/page.tsx",
    "app/terms/page.tsx",
  ];

  it("gives every indexable route a canonical URL", () => {
    for (const route of routes) {
      const source = readFileSync(join(decodeURIComponent(root), route), "utf8");
      expect(source, route).toContain("canonical");
    }
  });

  it("keeps the pairing page out of the index", () => {
    const source = readFileSync(join(decodeURIComponent(root), "app/pair/page.tsx"), "utf8");
    expect(source).toContain("index: false");
  });

  it("renders the FAQ from the shared array rather than copying it", () => {
    const source = readFileSync(join(decodeURIComponent(root), "components/landing/Faq.tsx"), "utf8");
    expect(source).toContain("FAQ_ITEMS.map");
    expect(source).toContain("faqPageGraph(FAQ_ITEMS)");
  });
});
