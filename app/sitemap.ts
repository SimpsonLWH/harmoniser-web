import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl().replace(/\/+$/, "");
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now },
    { url: `${base}/capsules`, lastModified: now },
    { url: `${base}/publish`, lastModified: now },
    { url: `${base}/device`, lastModified: now },
    { url: `${base}/privacy`, lastModified: now },
    { url: `${base}/terms`, lastModified: now },
  ];
}
