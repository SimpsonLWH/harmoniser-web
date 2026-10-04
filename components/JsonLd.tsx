import { serialiseJsonLd } from "@/lib/seo/jsonld";

/*
 * The repo's "never dangerouslySetInnerHTML" rule protects against rendering
 * untrusted capsule content. This is the opposite case: a static, typed payload
 * built from our own strings, serialised with "<" escaped as \u003c the way
 * Next.js's JSON-LD guide prescribes. Nothing user-supplied reaches it.
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serialiseJsonLd(data) }}
    />
  );
}
