/**
 * PUBLISHING
 *
 * There is exactly one way to post to a LinkedIn company page without
 * breaching the User Agreement, and it is the Community Management API: a
 * registered developer application, the company page verified as its owner,
 * a three-legged OAuth grant carrying the `w_organization_social` scope, and
 * an access token that has to be refreshed.
 *
 * Everything else marketed as "LinkedIn automation" is browser automation or
 * an unofficial client. Section 8.2 of the User Agreement prohibits both by
 * name. The penalty is restriction or permanent loss of the account — and
 * because a company page is administered through a personal profile, a ban
 * takes the founder's profile with it. The firm's profile is currently linked
 * from every page of its own website. That is not a trade worth making to
 * save the thirty seconds it takes to paste a post.
 *
 * SO WHY IS THIS FILE HERE AT ALL
 * -------------------------------
 * Because the approval is obtainable, and when it arrives the only thing that
 * should need to change is an environment variable. The adapter is written,
 * the shape of the request is right, and the switch is off. It refuses
 * clearly rather than throwing, in the same spirit as the operations agents:
 * a half-configured system should say what it is missing.
 *
 * WHAT IS DELIBERATELY NOT HERE
 * -----------------------------
 * No connection requests, no auto-follow, no auto-comment, no scraping of
 * anyone's feed or engagement. Those are the behaviours LinkedIn detects and
 * acts on most reliably, and the engagement data is personal information
 * about named individuals, which makes collecting it a PIPEDA problem as well
 * as a contractual one.
 */

import type { Finished } from "./pipeline";

/** Credentials the Community Management API route needs. */
const REQUIRED = [
  "LINKEDIN_ACCESS_TOKEN",
  /** urn:li:organization:NNNNN — the page, not the person. */
  "LINKEDIN_ORGANIZATION_URN",
] as const;

export interface PublishOutcome {
  status: "published" | "skipped" | "failed";
  summary: string;
  /** The post URN, when something was actually created. */
  urn?: string;
}

export function credentialsPresent(): { ok: boolean; missing: string[] } {
  const missing = REQUIRED.filter((key) => !process.env[key]?.trim());
  return { ok: missing.length === 0, missing };
}

/**
 * Post to the company page.
 *
 * `confirm` is not a formality. It must be passed explicitly by a caller that
 * a human has just driven — no scheduled job sets it. A cron job holding a
 * valid token is one loop away from posting a backlog of drafts nobody read,
 * and on a company page that is not recoverable by deleting them afterwards.
 */
export async function publish(
  post: Finished,
  opts: { confirm: boolean; dryRun?: boolean },
): Promise<PublishOutcome> {
  const creds = credentialsPresent();
  if (!creds.ok) {
    return {
      status: "skipped",
      summary:
        `not configured - missing ${creds.missing.join(", ")}. ` +
        "Register a LinkedIn developer app, request the Community Management API, " +
        "and grant w_organization_social against the company page.",
    };
  }

  if (!opts.confirm) {
    return {
      status: "skipped",
      summary: "no human confirmation - publishing requires an explicit confirm from a person",
    };
  }

  if (opts.dryRun) {
    return {
      status: "skipped",
      summary: `dry run - would post ${post.text.length} characters for ${post.date}`,
    };
  }

  const body = {
    author: process.env.LINKEDIN_ORGANIZATION_URN,
    commentary: post.text,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };

  const res = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
      "content-type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      // The API is versioned by month and rejects a request without this.
      "LinkedIn-Version": process.env.LINKEDIN_API_VERSION?.trim() || "202501",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // Deliberately not echoing the response body: an auth failure from this
    // endpoint can include the token back in the error.
    return { status: "failed", summary: `LinkedIn refused the post with HTTP ${res.status}` };
  }

  return {
    status: "published",
    summary: `posted for ${post.date}`,
    urn: res.headers.get("x-restli-id") ?? undefined,
  };
}
