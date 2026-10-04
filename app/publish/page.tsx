import type { Metadata } from "next";

import { PublishForm } from "./PublishForm";

export const metadata: Metadata = {
  title: "Publish a capsule",
  description:
    "Publish a small HarmonyOS app as validated JSON. Publishing is anonymous, needs no account, and the app re-checks every capsule against its schema and permission sheet before anything runs.",
  alternates: { canonical: "/publish" },
  openGraph: {
    title: "Publish a capsule · Harmoniser",
    description:
      "Share a capsule with the Harmoniser marketplace: validated JSON, anonymous publishing, and an owner token that is the only delete credential.",
    type: "website",
    url: "/publish",
  },
};

export default function PublishPage() {
  return <PublishForm />;
}
