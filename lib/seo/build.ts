/*
 * Pure builders for the sitemap and for capsule page metadata. They take plain
 * fixtures so they can be tested without a database; the database reads live in
 * lib/seo/data.ts.
 */

import type { Metadata, MetadataRoute } from "next";

export interface CapsuleSitemapRow {
  id: string;
  updatedAt?: Date;
}

const STATIC_ROUTES: readonly {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/capsules", changeFrequency: "daily", priority: 0.9 },
  { path: "/device", changeFrequency: "monthly", priority: 0.6 },
  { path: "/publish", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
];

export function buildSitemap(base: string, capsules: readonly CapsuleSitemapRow[]): MetadataRoute.Sitemap {
  const root = base.replace(/\/+$/, "");
  const staticEntries = STATIC_ROUTES.map((route) => ({
    url: `${root}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
  const capsuleEntries = capsules.map((capsule) => ({
    url: `${root}/capsules/${capsule.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
    ...(capsule.updatedAt !== undefined ? { lastModified: capsule.updatedAt } : {}),
  }));
  return [...staticEntries, ...capsuleEntries];
}

export interface CapsuleMetadataInput {
  id: string;
  name: string;
  description: string;
}

/**
 * A capsule page is indexable only when the publisher wrote a description.
 * Without one the page is thin, so it stays crawlable but out of the index.
 */
export function buildCapsuleMetadata(base: string, capsule: CapsuleMetadataInput): Metadata {
  const root = base.replace(/\/+$/, "");
  const described = capsule.description.trim().length > 0;
  const description = described
    ? capsule.description
    : `A ${capsule.name} capsule published on the Harmoniser marketplace. The publisher did not add a description.`;
  return {
    title: capsule.name,
    description,
    alternates: { canonical: `${root}/capsules/${capsule.id}` },
    robots: described ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title: `${capsule.name} · Harmoniser`,
      description,
      type: "website",
      url: `${root}/capsules/${capsule.id}`,
    },
  };
}
