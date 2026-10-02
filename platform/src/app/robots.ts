import type { MetadataRoute } from "next";
import { company } from "@/lib/company";

/**
 * ROBOTS
 *
 * Two jobs: point crawlers at the sitemap, and keep them out of the places
 * that are not public pages.
 *
 * The disallow list is defence in depth, not the control. /admin already
 * sends `noindex, nofollow, nocache` in its metadata and every admin API
 * answers 401 without a token — robots.txt is a request, not a boundary, and
 * treating it as one is how people end up with an unauthenticated admin page
 * they believe is hidden. It is here so a well-behaved crawler does not waste
 * its budget, and so nothing shows up in a search result that would confuse
 * somebody into thinking there is a console worth attacking.
 *
 * Deliberately NOT disallowing anything else. A consultancy wants every real
 * page indexed; the usual instinct to hide /legal or /brand costs reach and
 * buys nothing.
 */
export default function robots(): MetadataRoute.Robots {
  const base = company.siteUrl.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",      // token-gated console; also noindex in its metadata
          "/api/",       // endpoints, not pages — nothing here renders
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
