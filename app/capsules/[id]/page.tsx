import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import { siteUrl } from "@/lib/env";
import { buildCapsuleMetadata } from "@/lib/seo/build";
import { getCapsuleForMetadata } from "@/lib/seo/data";
import { breadcrumbGraph } from "@/lib/seo/jsonld";

import { CapsuleDetail } from "./CapsuleDetail";

interface Ctx {
  params: Promise<{ id: string }>;
}

/*
 * Title and description come from the stored metadata. Pages the publisher left
 * without a description stay crawlable but out of the index, because there is
 * nothing on them to rank. A database failure returns the safe noindex default
 * rather than throwing during metadata resolution.
 */
export async function generateMetadata({ params }: Ctx): Promise<Metadata> {
  const { id } = await params;
  const capsule = await getCapsuleForMetadata(id);
  if (capsule === null) {
    return {
      title: "Capsule",
      description: "A capsule published on the Harmoniser marketplace.",
      robots: { index: false, follow: true },
    };
  }
  return buildCapsuleMetadata(siteUrl(), capsule);
}

export default async function CapsuleDetailPage({ params }: Ctx) {
  const { id } = await params;
  const capsule = await getCapsuleForMetadata(id);
  return (
    <>
      {capsule !== null ? (
        <JsonLd
          data={breadcrumbGraph(siteUrl(), [
            { name: "Home", path: "/" },
            { name: "Marketplace", path: "/capsules" },
            { name: capsule.name, path: `/capsules/${capsule.id}` },
          ])}
        />
      ) : null}
      <CapsuleDetail />
    </>
  );
}
