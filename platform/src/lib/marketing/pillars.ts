/**
 * CONTENT PILLARS
 *
 * Three posts a week is 156 posts a year. Nobody improvises that without
 * either repeating themselves or drifting into the kind of post that gets
 * scrolled past — so the subjects are decided here, once, and the rotation is
 * mechanical.
 *
 * Every pillar answers a question a buyer actually has. "Thought leadership"
 * is not a pillar, because it is not a question.
 *
 * THE GROUNDING RULE
 * ------------------
 * Each angle names a `source` — the thing on the site or in a public
 * repository that backs it. An angle with no source is an opinion, and an
 * opinion from a firm nobody has heard of is worth nothing. If a claim cannot
 * be traced to something a reader can go and check, it does not get written.
 *
 * This is also what keeps the posts legal. The Competition Act prohibits
 * materially false or misleading representations to promote a business, and
 * "we reduced deploy times by 80%" with no engagement behind it is exactly
 * that. Sourcing every angle makes the fabrication hard to do by accident.
 */

export type PillarKey =
  | "how-we-work"
  | "different"
  | "governance"
  | "delivery"
  | "security"
  | "scale"
  | "ai"
  | "proof";

export interface Angle {
  /** Stable id — the rotation remembers what it has used by this. */
  id: string;
  /** The question a reader has. The post is the answer. */
  question: string;
  /** The one thing the post should leave behind. */
  takeaway: string;
  /**
   * The specific middle of the post — the part that could only be written
   * about this angle. Without it every post shares a generic paragraph, which
   * is obvious by the third one and fatal by the tenth.
   */
  evidence: string;
  /**
   * What backs it. A path on the site, or a public repository. Checked by
   * marketing-test against the real catalogue, so a renamed page breaks the
   * test rather than quietly publishing a dead link.
   */
  source: string;
  /** Does this angle want a diagram, or is it carried by text alone? */
  visual: "diagram" | "card" | "none";
}

export interface Pillar {
  key: PillarKey;
  name: string;
  /** Why this subject earns a slot in the rotation. */
  rationale: string;
  angles: Angle[];
}

export const PILLARS: Pillar[] = [
  {
    key: "how-we-work",
    name: "How we work",
    rationale:
      "The most common reason a buyer does not call is that they cannot picture what working together is like. This pillar removes that.",
    angles: [
      {
        id: "work-first-two-weeks",
        question: "What actually happens in the first two weeks?",
        takeaway: "An engagement opens with an assessment that produces a written plan, not a kickoff deck.",
        source: "/audit",
        evidence:
          "Week one is reading: the repositories, the pipelines, the last three incidents. Week two is writing it down. What you get at the end is a document with options and prices in it, which you are free to take to someone else.",
        visual: "diagram",
      },
      {
        id: "work-fixed-price",
        question: "Why is the price on the website?",
        takeaway:
          "Published pricing is a constraint on us, not a convenience for you — it means the scope has to be defined before anyone signs.",
        source: "/pricing",
        evidence:
          "Publishing a price means the scope has to be pinned down before anyone signs, because we carry the overrun rather than you. It is a harder way to sell and a much easier way to be trusted.",
        visual: "card",
      },
      {
        id: "work-audit-deliverables",
        question: "What do you actually get for a fixed-price audit?",
        takeaway:
          "Three documents you keep: the findings, a prioritized remediation plan, and a costed proposal you are free to ignore.",
        source: "/audit",
        evidence:
          "The plan is written so your own team or another firm can execute it without us, which is the test of whether it was worth paying for. Read-only access throughout, nothing installed, and about three hours of your team's time across the week.",
        visual: "card",
      },
      {
        id: "work-handover",
        question: "What do you leave behind when the engagement ends?",
        takeaway:
          "Runbooks, dashboards and the Terraform — handover is a deliverable with a date, not a goodbye email.",
        source: "/services",
        evidence:
          "Handover is scheduled from the start, not negotiated at the end. Runbooks your on-call can follow at 3am, dashboards that answer the question being asked, and the infrastructure as code with its state where you can reach it.",
        visual: "none",
      },
    ],
  },
  {
    key: "different",
    name: "Why we are different",
    rationale:
      "Every consultancy claims to be different. The only persuasive version names something a competitor would find uncomfortable to copy.",
    angles: [
      {
        id: "diff-published-work",
        question: "Can you see our work before you hire us?",
        takeaway:
          "The reference architectures and dashboards we would build for you are published in public repositories, in full, before you engage us.",
        source: "/work",
        evidence:
          "The reference pipelines, the dashboard toolkit, the architecture patterns. All public, all readable before you spend anything, all judged on their own terms rather than on a slide about them.",
        visual: "card",
      },
      {
        id: "diff-no-contact-for-pricing",
        question: "Why will we not say 'contact us for pricing'?",
        takeaway:
          "A price you have to ask for is a price that depends on what you look like you can pay.",
        source: "/pricing",
        evidence:
          "Hiding the price lets a seller read the room and charge what the room looks like it can pay. Publishing it removes that option from us, which is the point.",
        visual: "none",
      },
      {
        id: "diff-named-engineer",
        question: "Who actually does the work?",
        takeaway:
          "The person you meet is the person who builds it. There is no bench and no handoff to someone you have not met.",
        source: "/about",
        evidence:
          "No bench, no account manager, no handover to someone you have not met. The person in the first call is the person writing the Terraform, and that is a constraint on how much work we take.",
        visual: "none",
      },
    ],
  },
  {
    key: "governance",
    name: "Governance",
    rationale:
      "Canadian buyers in regulated sectors are asked to justify their vendors. This pillar gives them the material to do it.",
    angles: [
      {
        id: "gov-pipeda",
        question: "What does PIPEDA actually require of a platform?",
        takeaway:
          "Principle 5 is a retention obligation, which means a deletion job — not a paragraph in a policy.",
        source: "/legal/privacy",
        evidence:
          "Principle 5 says you keep personal information only as long as it serves the purpose you collected it for. In practice that is a retention date written at the moment of collection, and a job that deletes on it.",
        visual: "diagram",
      },
      {
        id: "gov-access",
        question: "Who can reach production, and how do you prove it?",
        takeaway:
          "Least privilege is an access review with a date on it, not an IAM policy nobody has read since it was written.",
        source: "/security",
        evidence:
          "The question is never whether a policy exists. It is who can reach production this morning, who approved that, and when it was last looked at by somebody who would notice a name that should not be there.",
        visual: "diagram",
      },
      {
        id: "gov-aoda",
        question: "Is your product accessible enough to sell to an Ontario public body?",
        takeaway:
          "AODA applies to the software, and WCAG 2.1 AA is testable in CI rather than audited once a year.",
        source: "/legal/accessibility",
        evidence:
          "An Ontario public body has to be able to answer for the accessibility of what it buys. WCAG 2.1 AA is testable, which means it belongs in the pipeline rather than in an annual audit that finds the same things every year.",
        visual: "card",
      },
    ],
  },
  {
    key: "delivery",
    name: "How we deliver",
    rationale:
      "Delivery mechanics are the part engineers evaluate and the part executives are reassured by. It is the rare subject that lands with both.",
    angles: [
      {
        id: "del-progressive",
        question: "How does a change reach production without a maintenance window?",
        takeaway:
          "Canary and blue-green are not exotic — they are the default once the rollback path is automated.",
        source: "/services",
        evidence:
          "A canary is only as good as the thing watching it. Pick the signal before the deploy, give it a threshold, and let the rollback fire without waiting for somebody to be awake and agree.",
        visual: "diagram",
      },
      {
        id: "del-ephemeral",
        question: "Why does every pull request get its own environment?",
        takeaway:
          "Reviewing a diff tells you what changed. An ephemeral environment tells you what it does.",
        source: "/services",
        evidence:
          "A diff tells you what changed. An environment tells you what it does. The cost of standing one up per pull request is almost entirely a question of whether the infrastructure is already code.",
        visual: "diagram",
      },
      {
        id: "del-rollback",
        question: "What happens when a deploy goes wrong at 2am?",
        takeaway:
          "The rollback is the feature. If it needs a human to remember a command, it does not exist.",
        source: "/services",
        evidence:
          "The rollback has to be the boring path, not the heroic one. If it depends on remembering a command, finding a runbook, or having the right access at 3am, then what you have is a plan rather than a rollback.",
        visual: "none",
      },
    ],
  },
  {
    key: "security",
    name: "Secure by default",
    rationale:
      "Security is the subject most often posted about badly — vague, fear-driven and unactionable. Specific and calm stands out.",
    angles: [
      {
        id: "sec-no-long-lived-creds",
        question: "Why are there no long-lived cloud credentials in our pipelines?",
        takeaway:
          "OIDC federation removes the secret entirely. There is nothing to rotate and nothing to leak.",
        source: "/security",
        evidence:
          "The pipeline asks its identity provider for a token that lasts minutes and is scoped to one job. There is no stored secret, so there is nothing to rotate on a schedule and nothing to find in a log.",
        visual: "diagram",
      },
      {
        id: "sec-supply-chain",
        question: "What is actually in the container you just shipped?",
        takeaway:
          "An image scan that does not block the pipeline is a report, and reports do not stop anything.",
        source: "/security",
        evidence:
          "Knowing what is in the image is the easy half. The half that changes outcomes is whether a critical finding stops the build or writes a line in a report nobody is assigned to read.",
        visual: "none",
      },
      {
        id: "sec-headers",
        question: "What does a hardened web response look like?",
        takeaway:
          "CSP, HSTS and frame-ancestors are a half-hour of work that a scanner will otherwise hold against you for years.",
        source: "/security",
        evidence:
          "A content security policy, strict transport security, and frame-ancestors set to none. Half an hour of work, done once, that a procurement questionnaire will otherwise ask you about for years.",
        visual: "card",
      },
    ],
  },
  {
    key: "scale",
    name: "Scalable and robust",
    rationale:
      "Buyers worry their platform will not survive growth. This pillar answers with mechanics rather than reassurance.",
    angles: [
      {
        id: "scale-autoscaling",
        question: "Why does autoscaling so often fail to help?",
        takeaway:
          "Scaling on CPU when the bottleneck is a connection pool adds instances and keeps the queue.",
        source: "/services",
        evidence:
          "Adding instances when the constraint is a connection pool, a lock, or a single-threaded consumer gives you more things waiting on the same queue. Find what is actually saturated first, then scale on that.",
        visual: "diagram",
      },
      {
        id: "scale-slo",
        question: "What should you alert on?",
        takeaway:
          "Alert on the symptom a user would notice. Alerting on resources is how an on-call rota burns out.",
        source: "/services",
        evidence:
          "Page on what a user would notice: errors, latency, work not getting done. Resource alerts fire constantly, correlate with nothing, and teach an on-call rota to ignore the pager.",
        visual: "card",
      },
      {
        id: "scale-dr",
        question: "When did you last restore from a backup?",
        takeaway:
          "An untested backup is a hypothesis. The restore time is the number that matters, and most teams have never measured it.",
        source: "/services",
        evidence:
          "Everyone has backups. Far fewer have a number for how long a restore takes, and fewer still have one measured this year rather than estimated when the system was smaller.",
        visual: "none",
      },
    ],
  },
  {
    key: "ai",
    name: "AI in the pipeline",
    rationale:
      "The subject everyone is posting about, which means the bar for saying something non-obvious is high. We only post the operational reality.",
    angles: [
      {
        id: "ai-agentic-containers",
        question: "Where does an agent genuinely belong in a delivery pipeline?",
        takeaway:
          "Agents propose, humans dispose. The useful place for one is drafting the change, not approving it.",
        source: "/services",
        evidence:
          "The useful place for an agent is drafting the change, opening the pull request, and attaching the evidence. The approval stays with a person, because an agent that can both propose and approve is just a deploy with extra steps.",
        visual: "diagram",
      },
      {
        id: "ai-rag-grounding",
        question: "Why do internal AI assistants confidently invent answers?",
        takeaway:
          "Retrieval without grounding checks is a summariser with no idea when it is wrong.",
        source: "/services",
        evidence:
          "Retrieval gets the right documents in front of the model. What stops the confident invention is checking the answer against them and refusing when the support is not there.",
        visual: "diagram",
      },
      {
        id: "ai-cost",
        question: "What does an in-cluster model actually cost to run?",
        takeaway:
          "GPU scheduling is a capacity problem that looks like a cost problem until somebody profiles it.",
        source: "/services",
        evidence:
          "The bill usually turns out to be a scheduling problem wearing a pricing costume: GPUs held by idle pods, batch sizes chosen once and never revisited, and no limit on who can start a run.",
        visual: "card",
      },
    ],
  },
  {
    key: "proof",
    name: "Proof and milestones",
    rationale:
      "Milestones are the only form of self-promotion that does not require a claim about ourselves. They are facts with a date.",
    angles: [
      {
        id: "proof-incorporated",
        question: "What changed when the firm incorporated?",
        takeaway:
          "Incorporation in Ontario is the point at which the liability, the contracts and the accountability become real.",
        source: "/about",
        evidence:
          "Incorporating in Ontario changes who is liable, who signs, and who is accountable when something goes wrong. It is paperwork, and it is also the difference between a side project and a firm.",
        visual: "card",
      },
      {
        id: "proof-open-repos",
        question: "What have we published that you can read today?",
        takeaway:
          "Reference architectures and a dashboard toolkit, open and complete, judged on their own terms.",
        source: "/work",
        evidence:
          "Reference architectures and a dashboard toolkit, published in full. Not case studies about work you cannot see, and not screenshots with the interesting parts cropped out.",
        visual: "card",
      },
      {
        id: "proof-site-standards",
        question: "Does our own site meet the standards we sell?",
        takeaway:
          "WCAG 2.1 AA, a hardened CSP and a tested restore path — verified in CI on our own site, because the alternative is embarrassing.",
        source: "/trust",
        evidence:
          "Colour contrast measured across every page in both themes, a hardened policy on every response, and a restore that has actually been run. Verified on our own site in CI, because selling this and not doing it would be noticed.",
        visual: "card",
      },
    ],
  },
];

export const ALL_ANGLES: Angle[] = PILLARS.flatMap((p) => p.angles);

export function pillarOf(angleId: string): Pillar | undefined {
  return PILLARS.find((p) => p.angles.some((a) => a.id === angleId));
}
