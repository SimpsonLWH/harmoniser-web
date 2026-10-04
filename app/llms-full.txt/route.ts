import { siteUrl } from "@/lib/env";
import { llmsFullTxt } from "@/lib/seo/ai-files";

export const dynamic = "force-static";

export function GET(): Response {
  return new Response(llmsFullTxt(siteUrl()), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
