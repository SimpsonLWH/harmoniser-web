/** The pair_url base rule: NEXT_PUBLIC_SITE_URL when it is a public https site, else the request. */

import { afterEach, describe, expect, it, vi } from "vitest";

import { pairBaseUrl } from "@/lib/devices/http";

function request(url = "https://harmoniser-web.vercel.app/api/devices/register"): Request {
  return new Request(url, { headers: { host: new URL(url).host } });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("pairBaseUrl", () => {
  it("uses the public site URL when it is set to the custom domain", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://harmoniser.keanuc.net");
    expect(pairBaseUrl(request())).toBe("https://harmoniser.keanuc.net");
  });

  it("ignores localhost, plain http and junk, falling back to the request origin", () => {
    for (const value of ["", "http://localhost:3000", "https://localhost:3000", "not a url"]) {
      vi.stubEnv("NEXT_PUBLIC_SITE_URL", value);
      expect(pairBaseUrl(request()), value).toBe("https://harmoniser-web.vercel.app");
    }
  });
});
