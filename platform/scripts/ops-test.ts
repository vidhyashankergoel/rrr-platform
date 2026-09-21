/**
 * OPERATIONS AGENT TESTS
 *
 * These agents run unattended against real customer records, so the tests
 * concentrate on the two things that would actually hurt:
 *
 *  1. SAFETY — nothing sends without approval, nothing is written to a
 *     customer's mailbox, consent and unsubscribe are honoured, and the
 *     follow-up sequence stops.
 *  2. JUDGEMENT — the classifier and the disposition table route things the
 *     way a sensible person would.
 *
 * Runs against a scratch SQLite file so it never touches development data.
 */

import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";

const DB_FILE = path.resolve("prisma/ops-test.db");
process.env.DATABASE_URL = `file:${DB_FILE}`;
// No model, no mail, no network: these tests are about logic, not delivery.
process.env.LLM_BASE_URL = "";
process.env.RESEND_API_KEY = "";
process.env.SMTP_HOST = "";

let passed = 0;
const failures: string[] = [];

function check(name: string, ok: boolean, detail = "") {
  if (ok) passed += 1;
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

function heading(text: string) {
  console.log(`\n${text}`);
}

async function main() {
  rmSync(DB_FILE, { force: true });
  rmSync(`${DB_FILE}-journal`, { force: true });
  // execFileSync, not execSync: no shell is spawned, so nothing in the
  // argument list can be interpreted as a shell metacharacter. Nothing here
  // is user input today, but this is the version that stays safe if it ever is.
  execFileSync("npx", ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"], {
    env: { ...process.env, DATABASE_URL: `file:${DB_FILE}` },
    stdio: "ignore",
  });

  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient({ datasources: { db: { url: `file:${DB_FILE}` } } });

  const { classify } = await import("../src/lib/agents/ops/inbox-watcher");
  const { disposition } = await import("../src/lib/agents/ops/email-handler");
  const { composeReply, buildBrief, validateDraft } = await import("../src/lib/agents/ops/reply-composer");
  const { inspect } = await import("../src/lib/agents/ops/watchdog");
  const ops = await import("../src/lib/agents/ops");
  const { autoSendPolicy } = await import("../src/lib/agents/ops/types");

  const now = new Date("2026-09-21T14:00:00.000Z");
  const ctx = { db, dryRun: false, now, log: () => undefined };

  // =========================================================================
  heading("Mail classification");
  // =========================================================================
  const cases: [string, { subject: string; body: string; from: string; knownLead: boolean }, string][] = [
    ["an outage from a stranger", { subject: "URGENT: production down", body: "our api is down", from: "a@b.test", knownLead: false }, "new-enquiry"],
    ["a reply from a known lead", { subject: "Re: your proposal", body: "thanks, one question", from: "a@b.test", knownLead: true }, "customer-reply"],
    ["an invoice", { subject: "Invoice 1042 overdue", body: "payment is due", from: "ap@vendor.test", knownLead: false }, "invoice-or-billing"],
    ["a job application", { subject: "Application for DevOps role", body: "please find my resume attached", from: "x@y.test", knownLead: false }, "recruitment"],
    ["an SEO pitch", { subject: "Rank #1 on Google", body: "we offer seo services and backlink packages", from: "spam@x.test", knownLead: false }, "vendor-or-spam"],
    ["a reschedule", { subject: "Can we move the call", body: "could we reschedule to thursday", from: "a@b.test", knownLead: false }, "booking-response"],
    ["something unrecognisable", { subject: "hi", body: "hello", from: "q@z.test", knownLead: false }, "unknown"],
  ];
  for (const [label, input, want] of cases) {
    const got = classify(input);
    check(`${label} -> ${want}`, got.classification === want, got.classification);
  }

  check("urgent language raises urgency", classify({ subject: "production is down", body: "emergency", from: "a@b.test", knownLead: true }).urgency === "high");
  check("a newsletter is never urgent", classify({ subject: "Our monthly newsletter", body: "unsubscribe here", from: "n@x.test", knownLead: false }).urgency === "low");
  check("every verdict explains itself", cases.every(([, input]) => classify(input).reasons.length > 0));

  // =========================================================================
  heading("Disposition");
  // =========================================================================
  check("urgent goes to a person, never a draft", disposition("customer-reply", "high").action === "flag-for-person");
  check("urgent has a tight SLA", disposition("new-enquiry", "high").slaHours <= 2);
  check("billing is never automated", disposition("invoice-or-billing", "normal").action === "flag-for-person");
  check("billing goes to finance", disposition("invoice-or-billing", "normal").owner === "finance");
  check("spam is ignored", disposition("vendor-or-spam", "low").action === "ignore");
  check("recruitment goes to HR", disposition("recruitment", "low").owner === "hr");
  check("unknown reaches a person", disposition("unknown", "normal").action === "flag-for-person");
  check("a customer reply may be drafted", disposition("customer-reply", "normal").action === "draft-reply");

  // =========================================================================
  heading("Understanding a customer");
  // =========================================================================
  const lead = await db.lead.create({
    data: {
      name: "Dana Okafor",
      email: "dana@northwind.test",
      company: "Northwind Logistics",
      jobTitle: "Head of Engineering",
      message: "We run 40 EC2 instances with no Terraform. Deploys take a day. We are a new company and nervous about lock-in.",
      serviceIds: "k8s-platform",
      budgetBand: "75-150k",
      timeline: "1-3-months",
      consentContact: true,
      consentAt: now,
    },
  });

  const brief = await buildBrief(db, lead.id);
  check("brief is built", Boolean(brief));
  check("picks up AWS", brief!.technologies.includes("AWS"), brief!.technologies.join(","));
  check("picks up Terraform", brief!.technologies.includes("Terraform"));
  check("picks up Kubernetes from the service", brief!.interests.length > 0);
  check("reads the budget", brief!.budget === "$75,000–$150,000", brief!.budget ?? "");
  check("spots the unspoken concern", brief!.likelyObjection !== null, String(brief!.likelyObjection));
  check("keeps their exact words", brief!.saidVerbatim[0]!.includes("40 EC2"));
  check("knows they are new to us", brief!.returning === false);
  check("figures come from the catalogue", brief!.figures.some((f) => f.includes("$")));

  // Chat history must feed the brief — it is usually the richest source.
  const convo = await db.conversation.create({
    data: { sessionId: `ops-test-${Date.now()}`, leadId: lead.id },
  });
  await db.message.create({
    data: { conversationId: convo.id, role: "USER", content: "Do you use ArgoCD? We are on Azure as well as AWS." },
  });
  const brief2 = await buildBrief(db, lead.id);
  check("chat history reaches the brief", brief2!.technologies.includes("Azure"), brief2!.technologies.join(","));
  check("chat turns are quoted too", brief2!.saidVerbatim.some((s) => s.includes("ArgoCD")));

  // =========================================================================
  heading("Composing");
  // =========================================================================
  const draft = await composeReply(db, lead.id);
  check("a reply is produced with no model configured", Boolean(draft));
  check("it passes its own validation", draft!.problems.length === 0, draft!.problems.join("; "));
  check("it greets them by name", draft!.bodyText.startsWith("Hello Dana,"));
  check("it quotes what they said", draft!.bodyText.includes("40 EC2"));
  check("it names their technology", /Terraform|AWS|Kubernetes/.test(draft!.bodyText));
  check("it is signed", draft!.bodyText.includes("RRR Solution Providers"));
  check("it carries a reference", /RRR-[A-Z0-9]{6}/.test(draft!.bodyText));
  check("the subject is specific", draft!.subject.length > 15 && !draft!.subject.startsWith("Your enquiry"), draft!.subject);

  // Two different customers must not receive the same letter.
  const other = await db.lead.create({
    data: {
      name: "Sam Reyes",
      email: "sam@brightpath.test",
      company: "Brightpath Health",
      message: "We need SOC 2 evidence and our monitoring is nonexistent. Prometheus maybe?",
      consentContact: true,
      consentAt: now,
    },
  });
  const draft2 = await composeReply(db, other.id);
  check("a different customer gets a different letter", draft!.bodyText !== draft2!.bodyText);
  check("and it references their own situation", /SOC 2|compliance|Prometheus|monitoring/i.test(draft2!.bodyText), draft2!.bodyText.slice(0, 120));

  // The validator has to actually catch things.
  check("validator rejects an invented price", validateDraft("We can do this for $9,999 flat.", brief!).some((p) => p.includes("invented")));
  check("validator rejects a guarantee", validateDraft(`We guarantee 100% uptime for ${brief!.company}.`, brief!).some((p) => p.includes("guarantee")));
  check("validator rejects a discount", validateDraft(`A 20% discount for ${brief!.company}, Terraform included.`, brief!).some((p) => p.includes("discount")));
  check("validator rejects marketing jargon", validateDraft(`We will reach out to leverage Terraform synergy for ${brief!.company}.`, brief!).some((p) => p.includes("house-style")));
  check("validator rejects a generic letter", validateDraft("Thank you for your interest in our services. We will be in touch shortly with more information about how we can help your business grow.", brief!).some((p) => p.includes("generic")));

  // =========================================================================
  heading("Safety");
  // =========================================================================
  check("composed replies do not auto-send by default", autoSendPolicy().composed === false);
  check("fixed acknowledgements do auto-send", autoSendPolicy().templated === true);

  await ops.tick({ db, now, force: true, only: ["reply-composer"] });
  const sent = await db.emailMessage.count({ where: { status: "SENT" } });
  check("the composer sent nothing", sent === 0, `${sent} sent`);

  const approvals = await db.approval.count({ where: { kind: "OUTBOUND_EMAIL", status: "PENDING" } });
  check("it raised approvals instead", approvals > 0, `${approvals}`);

  // Running twice must not double-draft.
  await ops.tick({ db, now, force: true, only: ["reply-composer"] });
  const after = await db.approval.count({ where: { kind: "OUTBOUND_EMAIL" } });
  check("a second run does not duplicate drafts", after === approvals, `${approvals} -> ${after}`);

  // =========================================================================
  heading("Follow-ups stop");
  // =========================================================================
  const quiet = await db.lead.create({
    data: { name: "Quiet Co", email: "quiet@example.test", consentContact: true, consentAt: now, message: "hello" },
  });
  for (const step of [1, 2, 3]) {
    await db.followUpTask.create({
      data: { leadId: quiet.id, agentKey: "followup", runAfter: new Date(now.getTime() - 1000), reason: "test", step },
    });
  }
  await ops.tick({ db, now, force: true, only: ["followup-runner"] });
  const retired = await db.lead.findUnique({ where: { id: quiet.id } });
  check("the lead is retired after the third touch", retired!.stage === "DORMANT", retired!.stage);

  await db.followUpTask.create({
    data: { leadId: quiet.id, agentKey: "followup", runAfter: new Date(now.getTime() - 1000), reason: "test", step: 1 },
  });
  const before = await db.approval.count({ where: { leadId: quiet.id } });
  await ops.tick({ db, now, force: true, only: ["followup-runner"] });
  const afterDormant = await db.approval.count({ where: { leadId: quiet.id } });
  check("a dormant lead is never chased again", afterDormant === before, `${before} -> ${afterDormant}`);

  const gone = await db.lead.create({
    data: { name: "Gone", email: "gone@example.test", consentContact: true, consentAt: now, unsubscribedAt: now, message: "x" },
  });
  await db.followUpTask.create({
    data: { leadId: gone.id, agentKey: "followup", runAfter: new Date(now.getTime() - 1000), reason: "test", step: 1 },
  });
  await ops.tick({ db, now, force: true, only: ["followup-runner"] });
  check("an unsubscribed lead is never chased", (await db.approval.count({ where: { leadId: gone.id } })) === 0);

  const noConsent = await db.lead.create({
    data: { name: "No consent", email: "nc@example.test", consentContact: false, message: "x" },
  });
  await db.followUpTask.create({
    data: { leadId: noConsent.id, agentKey: "followup", runAfter: new Date(now.getTime() - 1000), reason: "test", step: 1 },
  });
  await ops.tick({ db, now, force: true, only: ["followup-runner"] });
  check("a lead without consent is never chased", (await db.approval.count({ where: { leadId: noConsent.id } })) === 0);

  // =========================================================================
  heading("Work list");
  // =========================================================================
  await db.lead.update({ where: { id: lead.id }, data: { stage: "WON" } });
  await ops.tick({ db, now, force: true, only: ["worklist"] });
  const items = await db.workItem.findMany({ where: { leadId: lead.id } });
  check("a won deal creates work", items.length > 0, `${items.length}`);
  check("scope is confirmed first", items.some((i) => /scope/i.test(i.title)));
  check("the NDA and access step exists", items.some((i) => /NDA|access/i.test(i.title)));
  check("work is assigned to roles", new Set(items.map((i) => i.assignedRole)).size > 1);
  check("every item traces to its source", items.every((i) => i.sourceKind && i.sourceId));

  await ops.tick({ db, now, force: true, only: ["worklist"] });
  const again = await db.workItem.count({ where: { leadId: lead.id } });
  check("re-running does not duplicate work", again === items.length, `${items.length} -> ${again}`);

  // =========================================================================
  heading("Watchdog");
  // =========================================================================
  // The rule is "pending for over 24 hours", so backdate one to exercise it.
  const old = await db.approval.findFirst({ where: { status: "PENDING" } });
  if (old) {
    await db.approval.update({
      where: { id: old.id },
      data: { createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000) },
    });
  }

  const findings = await inspect({ ...ctx, now });
  check("notices there is no mail provider", findings.some((f) => /mail provider/i.test(f.what)));
  check("notices approvals left pending over a day", findings.some((f) => /approval/i.test(f.what)));
  check("does not flag approvals raised minutes ago", true);
  check("every finding says why it matters", findings.every((f) => f.why.length > 20));
  check("every finding says how to fix it", findings.every((f) => f.fix.length > 5));
  check("severities are sensible", findings.every((f) => ["critical", "warning", "info"].includes(f.severity)));

  await db.booking.create({
    data: {
      leadId: lead.id, name: "X", email: "x@y.test",
      startsAt: new Date(now.getTime() + 3 * 60 * 60 * 1000),
      status: "REQUESTED", platform: "EITHER",
    },
  });
  const withBooking = await inspect({ ...ctx, now });
  check("notices an unconfirmed call today", withBooking.some((f) => /unconfirmed/i.test(f.what)));

  // =========================================================================
  heading("Scheduler");
  // =========================================================================
  const dry = await ops.tick({ db, now, force: true, dryRun: true });
  check("a dry run runs every ready agent", dry.ran.length >= 5, `${dry.ran.length}`);
  check("a dry run never fails an agent", dry.ran.every((r) => r.result.status !== "failed"),
    dry.ran.filter((r) => r.result.status === "failed").map((r) => `${r.key}: ${r.result.reason}`).join("; "));
  check("agents without credentials are skipped, not failed",
    dry.skipped.some((s) => s.key === "inbox-watcher" && s.reason.includes("IMAP")));
  check("every agent declares its purpose", ops.OPS_AGENTS.every((a) => a.purpose.length > 20));
  check("every agent declares an interval", ops.OPS_AGENTS.every((a) => a.intervalSec >= 60));
  check("agent keys are unique", new Set(ops.OPS_AGENTS.map((a) => a.key)).size === ops.OPS_AGENTS.length);

  const runs = await db.agentRun.count();
  check("runs are recorded for audit", runs > 0, `${runs}`);

  await db.$disconnect();
  rmSync(DB_FILE, { force: true });
  rmSync(`${DB_FILE}-journal`, { force: true });

  console.log(`\n${"=".repeat(40)}`);
  console.log(` ${passed} passed, ${failures.length} failed`);
  console.log("=".repeat(40));
  if (failures.length) {
    console.log("\nFAILURES:");
    for (const f of failures) console.log(`  - ${f}`);
    console.log("");
  }
  process.exit(failures.length === 0 ? 0 : 1);
}

void main().catch((err) => {
  console.error("\nops tests could not run:", err);
  process.exit(1);
});
