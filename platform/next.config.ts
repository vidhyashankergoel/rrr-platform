import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Security headers form part of the Canadian compliance posture: PIPEDA
 * Principle 7 (Safeguards) expects technical measures proportionate to the
 * sensitivity of the personal information the site collects.
 *
 * DEVELOPMENT CAVEAT: Next.js uses `eval` for hot module replacement, which a
 * strict script-src blocks outright — React then never hydrates and every
 * client component is silently inert. So 'unsafe-eval' and the HMR websocket
 * are permitted in development ONLY. Both are keyed off NODE_ENV rather than a
 * variable someone could set by accident, so neither can reach production.
 */
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self' 'unsafe-inline'";

const connectSrc = isDev ? "connect-src 'self' ws: wss:" : "connect-src 'self'";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // HSTS on a plain-HTTP dev server is pointless and can poison localhost.
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]),
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      connectSrc,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  /**
   * Next's development overlay renders a `<nextjs-portal>` fixed above the
   * page. In Next 16 it intercepts pointer events, so an automated browser
   * cannot click anything beneath it — the end-to-end suite fails on controls
   * that work perfectly well for a real person.
   *
   * It is a development-only affordance and is absent from production, so
   * suppressing it for a test run changes nothing a visitor ever sees. Left
   * on for ordinary `npm run dev`, where it is genuinely useful.
   */
  devIndicators: process.env.E2E === "1" ? false : undefined,

  /**
   * Production builds go to their own directory.
   *
   * `next build` and `next dev` both write to `.next` by default. Running a
   * build while the dev server is up replaces the dev chunks with production
   * ones, and the dev server then 404s its own JavaScript: the page still
   * renders server-side, React never hydrates, and every button on the site
   * silently stops working. It looks exactly like a code bug and is not one.
   *
   * Separate directories make that impossible.
   */
  distDir: isDev ? ".next" : ".next-build",

  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
