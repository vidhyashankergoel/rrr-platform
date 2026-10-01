"use client";

import { Disclosure } from "./Expand";

/**
 * WHAT YOU GET
 *
 * The deliverables, named. Almost every consulting site describes activity
 * ("we will partner with you to transform...") and almost none list the
 * artefacts that actually land in the client's hands. This is the section a
 * buyer screenshots and sends to their CTO.
 */

const GROUPS = [
  {
    stage: "On day one",
    tone: "accent",
    items: [
      "A named engineer and a named delivery contact, with direct access — not a ticket queue",
      "A shared channel in your Slack or Teams",
      "A written scope with acceptance criteria you signed before anyone started",
      "A signed NDA, and an MSA on your paper or ours",
    ],
  },
  {
    stage: "Every week",
    tone: "amber",
    items: [
      "A demonstration of something working — not a status deck",
      "Pull requests in your repositories, reviewed by your team",
      "A written note of what changed, what is next, and anything that slipped",
      "Any scope change re-quoted in writing before it is done, never absorbed and billed later",
    ],
  },
  {
    stage: "At handover",
    tone: "accent",
    items: [
      "All infrastructure as reviewed code in your repository, in your cloud accounts",
      "Runbooks written for the person paged at 03:00, not for the author",
      "Architecture documentation that matches what was actually built",
      "Recorded walkthrough sessions your team can replay after we are gone",
      "A tested, timed restore — the real RTO, not an aspiration",
      "Your engineers demonstrating they can operate it without us",
      "Our access revoked, and a reminder from us to check that it was",
    ],
  },
];

const NEVER = [
  "A proprietary wrapper only we can maintain",
  "A licensed component that renews through us",
  "A dependency on our continued involvement",
  "An invoice for handover — it is inside the fixed price",
  "A retainer as a condition of the build",
];

export default function WhatYouGet() {
  return (
    <>
      <div className="deliver-stack">
        {GROUPS.map((g) => (
          <Disclosure
            key={g.stage}
            summary={g.stage}
            count={g.items.length}
            tone={g.tone === "amber" ? "amber" : "accent"}
          >
            <ul className="check-list" style={{ marginBottom: 0 }}>
              {g.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </Disclosure>
        ))}

        <Disclosure summary="What you will never get from us" count={NEVER.length}>
          <ul className="cross-list">
            {NEVER.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <p style={{ fontSize: ".88rem", marginBottom: 0, color: "var(--text-2)" }}>
            The test we hold ourselves to:{" "}
            <strong style={{ color: "var(--text)" }}>
              your team should be able to run the platform the day we leave.
            </strong>
          </p>
        </Disclosure>
      </div>

    </>
  );
}
