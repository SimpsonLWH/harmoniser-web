import type { NextConfig } from "next";

/*
 * CSP note: Next's own bootstrap needs inline scripts, so `script-src` still allows
 * 'unsafe-inline' in this v0. Tightening it to per-request nonces (with middleware) is a
 * documented follow-up; everything else is closed down here.
 *
 * React's development build uses eval() to rebuild callstacks, so `next dev` needs
 * 'unsafe-eval'. Production code never calls eval, and the production policy below does not
 * allow it, so the shipped headers stay strict.
 */
const isDev = process.env.NODE_ENV !== "production";
const scriptSrc = `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`;

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value:
      `default-src 'self'; ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; frame-ancestors 'none'`,
  },
];

const nextConfig: NextConfig = {
  async rewrites() {
    /*
     * The pitch deck is a self-contained static document under public/pitch;
     * /pitch/ is the real path and /pitch is the clean URL we link to.
     */
    return [
      { source: "/pitch", destination: "/pitch/index.html" },
      { source: "/pitch/", destination: "/pitch/index.html" },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/pitch/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      },
      {
        source: "/pitch/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
      },
    ];
  },
};

export default nextConfig;
