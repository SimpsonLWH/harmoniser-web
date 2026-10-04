import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/env";
import { buildSitemap } from "@/lib/seo/build";
import { getDescribedCapsules } from "@/lib/seo/data";

export const runtime = "nodejs";
export const revalidate = 3600;

/*
 * Static routes plus visible capsules that carry a publisher description. A
 * database failure drops the capsule rows and still serves the static list;
 * no request-time timestamps are emitted, so lastmod only moves when a row does.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const capsules = await getDescribedCapsules();
  return buildSitemap(siteUrl(), capsules ?? []);
}
