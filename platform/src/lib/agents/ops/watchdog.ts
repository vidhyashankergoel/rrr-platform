/**
 * WATCHDOG
 *
 * The agent that notices. Everything else here does a job; this one checks
 * whether the jobs are actually working, and says so loudly when they are not.
 *
 * WHY THIS EXISTS
 * ---------------
 * The expensive failures in a system like this are silent ones. Mail stops
 * being delivered and enquiries keep arriving into a database nobody opens.
 * An approval sits unread for a week and a customer concludes we are not
 * interested. A booking passes without anyone confirming it and somebody sits
 * on a call that never starts.
 *
 * None of those throw an exception. All of them cost work. So this runs
 * frequently, checks the things that go quietly wrong, and escalates.
 *
 * It is the one agent that is allowed to be annoying.
 */

import { mailConfig } from "../../mail-provider";
import { activeProvider } from "../../llm";
import { company } from "../../company";
import { notifyInternal } from "../../mailer";
import type { OpsAgent, OpsContext, OpsResult } from "./types";

export interface Finding {
  severity: "critical" | "warning" | "info";
  what: string;
  why: string;
  fix: string;
  count?: number;
}

/** Everything that can quietly go wrong, and how to tell. */
export async function inspect(ctx: OpsContext): Promise<Finding[]> {
  const findings: Finding[] = [];
  const hoursAgo = (h: number) => new Date(ctx.now.getTime() - h * 60 * 60 * 1000);

  // --- Can we actually reach anybody? ------------------------------------
  const mail = mailConfig();
  if (mail.provider === "none") {
    findings.push({
      severity: "critical",
      what: "No mail provider is configured.",
      why: "Enquiries and bookings are being saved but nobody is being told about them. This is the failure that looks like 'the website is broken' to a customer and like silence to you.",
      fix: "Set RESEND_API_KEY or the SMTP_* variables. See docs/EMAIL-SETUP.md, then run: npm run mail:check -- --send",
    });
  } else if (mail.problems.length) {
    findings.push({
      severity: "critical",
      what: `Mail is misconfigured: ${mail.problems[0]}`,
      why: "Notifications will not be delivered.",
      fix: "npm run mail:check",
    });
  }

  const failedMail = await ctx.db.emailMessage.count({
    where: { status: "FAILED", createdAt: { gte: hoursAgo(24) } },
  });
  if (failedMail > 0) {
    findings.push({
      severity: "critical",
      what: `${failedMail} email(s) failed to send in the last 24 hours.`,
      why: "Each one is a customer who did not hear back.",
      fix: "Check /admin for the error on each, then npm run mail:check",
      count: failedMail,
    });
  }

  const stuckQueued = await ctx.db.emailMessage.count({
    where: { status: "QUEUED", createdAt: { lt: hoursAgo(2) } },
  });
  if (stuckQueued > 0 && mail.provider !== "none") {
    findings.push({
      severity: "warning",
      what: `${stuckQueued} email(s) queued for more than two hours.`,
      why: "A provider is configured, so these should have gone. Often the resend.dev sender refusing a non-owner recipient.",
      fix: "npm run mail:check — if it reports owner-only, verify a domain.",
      count: stuckQueued,
    });
  }

  // --- Is anybody answering? ---------------------------------------------
  const staleApprovals = await ctx.db.approval.count({
    where: { status: "PENDING", createdAt: { lt: hoursAgo(24) } },
  });
  if (staleApprovals > 0) {
    findings.push({
      severity: staleApprovals > 5 ? "critical" : "warning",
      what: `${staleApprovals} approval(s) pending for over 24 hours.`,
      why: "The site promises a reply within one business day. Every one of these is that promise being broken.",
      fix: `Open ${company.siteUrl}/admin and clear the queue.`,
      count: staleApprovals,
    });
  }

  const unansweredLeads = await ctx.db.lead.count({
    where: {
      stage: "NEW",
      createdAt: { lt: hoursAgo(24) },
      emails: { none: { status: "SENT" } },
    },
  });
  if (unansweredLeads > 0) {
    findings.push({
      severity: "critical",
      what: `${unansweredLeads} enquiry(ies) over a day old with nothing sent back.`,
      why: "Not a single message has reached these people. They are assuming we do not want the work.",
      fix: "Check mail delivery first, then reply by hand.",
      count: unansweredLeads,
    });
  }

  // --- Bookings ----------------------------------------------------------
  const soon = new Date(ctx.now.getTime() + 24 * 60 * 60 * 1000);
  const unconfirmed = await ctx.db.booking.count({
    where: { status: "REQUESTED", startsAt: { gte: ctx.now, lte: soon } },
  });
  if (unconfirmed > 0) {
    findings.push({
      severity: "critical",
      what: `${unconfirmed} call(s) in the next 24 hours are still unconfirmed.`,
      why: "The visitor was told a person would confirm and send a joining link. If nobody does, they turn up to nothing — or worse, we do.",
      fix: "Confirm each one and send the Meet or Teams link.",
      count: unconfirmed,
    });
  }

  const missed = await ctx.db.booking.count({
    where: { status: { in: ["REQUESTED", "CONFIRMED"] }, startsAt: { lt: hoursAgo(2) } },
  });
  if (missed > 0) {
    findings.push({
      severity: "warning",
      what: `${missed} past call(s) never closed out.`,
      why: "Cannot tell whether they happened. The work list and the follow-up sequence both depend on knowing.",
      fix: "Mark each COMPLETED or NO_SHOW in /admin.",
      count: missed,
    });
  }

  // --- Inbound mail sitting untriaged ------------------------------------
  const untriaged = await ctx.db.inboundMail.count({
    where: { handled: false, urgency: "high", receivedAt: { lt: hoursAgo(4) } },
  });
  if (untriaged > 0) {
    findings.push({
      severity: "critical",
      what: `${untriaged} urgent message(s) unhandled for over four hours.`,
      why: "Flagged urgent by the watcher and still nothing has happened.",
      fix: "Read them in /admin now.",
      count: untriaged,
    });
  }

  // --- Work list ---------------------------------------------------------
  const overdue = await ctx.db.workItem.count({
    where: { status: { in: ["READY", "IN_PROGRESS"] }, dueAt: { lt: ctx.now } },
  });
  if (overdue > 0) {
    findings.push({
      severity: "warning",
      what: `${overdue} work item(s) past their due date.`,
      why: "A plan nobody is tracking is not a plan.",
      fix: "Re-date or close them.",
      count: overdue,
    });
  }

  const blocked = await ctx.db.workItem.count({
    where: { status: "BLOCKED", updatedAt: { lt: hoursAgo(72) } },
  });
  if (blocked > 0) {
    findings.push({
      severity: "warning",
      what: `${blocked} work item(s) blocked for over three days.`,
      why: "Blocked work that nobody has escalated tends to stay blocked.",
      fix: "Escalate or cancel.",
      count: blocked,
    });
  }

  // --- Agents themselves --------------------------------------------------
  const failedRuns = await ctx.db.agentRun.count({
    where: { status: "FAILED", createdAt: { gte: hoursAgo(24) } },
  });
  if (failedRuns > 2) {
    findings.push({
      severity: "warning",
      what: `${failedRuns} agent run(s) failed in the last 24 hours.`,
      why: "Something the automation depends on is broken — usually a credential.",
      fix: "npm run agents:status",
      count: failedRuns,
    });
  }

  // --- Retention (PIPEDA Principle 5) ------------------------------------
  const duePurge = await ctx.db.lead.count({ where: { purgeAfter: { lt: ctx.now } } });
  if (duePurge > 0) {
    findings.push({
      severity: "warning",
      what: `${duePurge} record(s) are past their retention date.`,
      why: "PIPEDA Principle 5 requires personal information to be destroyed once the purpose is fulfilled. A retention date nobody acts on is worse than none — it documents that you knew.",
      fix: "npm run agents:purge",
      count: duePurge,
    });
  }

  // --- Informational ------------------------------------------------------
  const llm = activeProvider();
  if (llm.mode === "retrieval") {
    findings.push({
      severity: "info",
      what: "No language model is connected.",
      why: "The assistant answers from the retrieval index, which is free and works. Replies are drafted by the deterministic composer rather than written.",
      fix: "Optional: set LLM_BASE_URL to an OpenAI-compatible endpoint (Ollama, OmniRoute, LiteLLM).",
    });
  }

  return findings;
}

export const watchdog: OpsAgent = {
  key: "watchdog",
  name: "Watchdog",
  purpose: "Checks the things that fail silently — undelivered mail, unanswered enquiries, unconfirmed calls — and escalates.",
  intervalSec: 1800,
  requires: [],

  async run(ctx: OpsContext): Promise<OpsResult> {
    const findings = await inspect(ctx);
    const critical = findings.filter((f) => f.severity === "critical");
    const warnings = findings.filter((f) => f.severity === "warning");

    for (const f of findings) {
      if (f.severity !== "info") ctx.log(`[${f.severity}] ${f.what}`);
    }

    // Escalate only on critical, and only once a day, so the watchdog does not
    // become the thing that gets filtered.
    if (critical.length > 0 && !ctx.dryRun) {
      const alreadyToday = await ctx.db.emailMessage.count({
        where: {
          sequenceKey: "watchdog-alert",
          createdAt: { gte: new Date(ctx.now.getTime() - 24 * 60 * 60 * 1000) },
        },
      });

      if (alreadyToday === 0) {
        const rule = "─".repeat(50);
        await notifyInternal({
          subject: `${critical.length} thing(s) need attention — ${company.shortName}`,
          body: [
            "The watchdog found problems that will cost you work if they stay unfixed.",
            "",
            ...critical.flatMap((f) => [rule, `CRITICAL: ${f.what}`, "", `  Why it matters: ${f.why}`, `  Fix: ${f.fix}`, ""]),
            ...(warnings.length
              ? [rule, "Also worth knowing:", "", ...warnings.map((f) => `  • ${f.what}`), ""]
              : []),
            rule,
            `Console: ${company.siteUrl}/admin`,
            "",
            "This alert is sent at most once a day.",
          ].join("\n"),
          sequenceKey: "watchdog-alert",
          banner: "WATCHDOG ALERT — could not be delivered",
        }).catch(() => undefined);
      }
    }

    return {
      status: critical.length ? "ok" : "ok",
      summary: findings.length
        ? `${critical.length} critical, ${warnings.length} warning(s), ${findings.length - critical.length - warnings.length} note(s)`
        : "everything looks healthy",
      detail: {
        critical: critical.map((f) => f.what),
        warnings: warnings.map((f) => f.what),
        info: findings.filter((f) => f.severity === "info").map((f) => f.what),
      },
    };
  },
};
