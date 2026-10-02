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
   *
   * That reasoning is entirely about a developer's laptop, where a dev server
   * and a build can run at the same time. On Vercel nothing else is running,
   * and the platform looks for `.next` by name — a custom directory there just
   * fails the deploy with "output directory not found". So the split applies
   * locally only.
   */
  distDir: isDev || process.env.VERCEL ? ".next" : ".next-build",

  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },

  /**
   * APEX TO WWW
   *
   * Both hostnames served the whole site with a 200, so Google saw two
   * complete copies competing with each other and splitting whatever ranking
   * signals the site earns. The sitemap only ever described the www copy.
   *
   * A redirect is the fix rather than a canonical tag. A canonical is a hint
   * a search engine may disregard; a 308 is not optional, and it also means
   * anyone who types the bare domain, and every link already pointing at it,
   * lands on the hostname the sitemap, the structured data and every absolute
   * URL on the site already agree on.
   *
   * 308 rather than 301 so the method and body survive the redirect — a 301
   * lets a client turn a POST into a GET, which would quietly break a form
   * submitted against the apex.
   *
   * The host condition matches the apex exactly, so www never matches its own
   * rule and there is no loop.
   */
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "rrrsolutionproviders.ca" }],
        destination: "https://www.rrrsolutionproviders.ca/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
