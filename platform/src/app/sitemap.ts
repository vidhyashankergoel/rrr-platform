import type { MetadataRoute } from "next";
import { company } from "@/lib/company";

/**
 * SITEMAP
 *
 * The site had none, and neither did it have a robots.txt — so a crawler had
 * to find every page by following links, and had nothing telling it which
 * pages matter or when they last changed. For a firm whose entire route to
 * market is a Canadian buyer searching for cloud consultancies, that is a gap
 * worth closing even though nothing was technically broken.
 *
 * The list is written out rather than discovered from the filesystem. A glob
 * over `src/app` would pick up /admin, the API routes and the legal pages
 * with equal confidence, and the one page that must never appear here is the
 * one a glob is most likely to add back silently.
 *
 * `priority` is a hint and search engines mostly ignore it; `changeFrequency`
 * likewise. They are set honestly anyway — the pricing page genuinely changes
 * more often than the accessibility statement — because a sitemap that lies
 * about its own freshness is worse than one that says nothing.
 */

type Entry = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

const PAGES: Entry[] = [
  { path: "", changeFrequency: "weekly", priority: 1.0 },
  { path: "/services", changeFrequency: "monthly", priority: 0.9 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.9 },
  { path: "/work", changeFrequency: "monthly", priority: 0.8 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/security", changeFrequency: "monthly", priority: 0.7 },
  { path: "/trust", changeFrequency: "monthly", priority: 0.7 },
  { path: "/story", changeFrequency: "yearly", priority: 0.5 },
  { path: "/brand", changeFrequency: "yearly", priority: 0.3 },
  { path: "/legal/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/legal/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/legal/accessibility", changeFrequency: "yearly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = company.siteUrl.replace(/\/$/, "");
  const now = new Date();

  return PAGES.map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
