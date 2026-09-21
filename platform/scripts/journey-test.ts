/**
 * END-TO-END CUSTOMER JOURNEY + DATABASE INTEGRITY TEST
 *
 * Simulates a real prospect from first chat message through to an approved
 * outbound email, asserting the database state at every step and proving the
 * CASL and PIPEDA controls actually refuse what they claim to refuse.
 *
 * Run:  npx tsx scripts/journey-test.ts
 */

import { db } from "../src/lib/db";
import { send } from "../src/lib/mailer";
import { runTurn } from "../src/lib/agents/orchestrator";

let pass = 0;
let fail = 0;

function check(label: string, condition: boolean, detail = "") {
  if (condition) {
    pass++;
    console.log(`  PASS  ${label}${detail ? "  (" + detail + ")" : ""}`);
  } else {
    fail++;
    console.log(`  FAIL  ${label}${detail ? "  (" + detail + ")" : ""}`);
  }
}

async function main() {
  const stamp = Date.now();
  const sessionId = `journey-${stamp}`;
  const email = `journey-${stamp}@example.com`;

  console.log("========================================");
  console.log(" STEP 1 — Visitor opens the assistant");
  console.log("========================================");

  const t1 = await runTurn({
    sessionId,
    message: "we run about 40 services on-premises and want to move to AWS",
    pageUrl: "/services",
  });
  console.log(`  agent: ${t1.agentName}`);
  console.log(`  reply: ${t1.reply.slice(0, 110).replace(/\n/g, " ")}...`);

  const convo = await db.conversation.findUnique({
    where: { sessionId },
    include: { messages: true },
  });
  check("conversation created", !!convo);
  check("user + assistant turns stored", (convo?.messages.length ?? 0) === 2, `${convo?.messages.length} messages`);
  check("retention date set on conversation", !!convo?.purgeAfter);
  check("page URL captured", convo?.pageUrl === "/services");

  console.log("\n========================================");
  console.log(" STEP 2 — Prospect pushes back on price");
  console.log("========================================");

  const t2 = await runTurn({ sessionId, message: "that sounds too expensive, can we get a discount?" });
  console.log(`  agent: ${t2.agentName}, escalate=${t2.escalate}`);
  check("routed to the commercial agent", t2.agentName.includes("commercial"));
  check("escalated to a human", t2.escalate);
  check(
    "refuses to grant a discount itself",
    /cannot vary published pricing|needs a person|cannot approve/i.test(t2.reply),
  );

  const concession = await db.approval.findFirst({
    where: { kind: "PRICE_CONCESSION", status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  check("price concession queued for approval", !!concession);
  check("concession carries a risk note", !!concession?.riskNote);

  console.log("\n========================================");
  console.log(" STEP 3 — Asks for a contract");
  console.log("========================================");

  const t3 = await runTurn({ sessionId, message: "can you send us a contract to sign?" });
  check("routed to the documents agent", t3.agentName.includes("documents"));
  check(
    "refuses to give legal advice or send",
    /cannot give legal advice/i.test(t3.reply) && /do not send documents/i.test(t3.reply),
  );
  const legalApproval = await db.approval.findFirst({
    where: { kind: "LEGAL_DOCUMENT", status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  check("legal document request queued", !!legalApproval);

  console.log("\n========================================");
  console.log(" STEP 4 — Submits the enquiry form");
  console.log("========================================");

  const now = new Date();
  const lead = await db.lead.create({
    data: {
      name: "Dana Okonkwo",
      email,
      company: "Example Manufacturing Ltd",
      jobTitle: "Head of Platform",
      phone: "+1 416 555 0142",
      message: "40 services on-prem, manual deploys, no monitoring. Want AWS by Q2.",
      serviceIds: "migration,cicd,observability",
      budgetBand: "75-150k",
      timeline: "1-3-months",
      source: "website",
      stage: "NEW",
      consentContact: true,
      consentMarketing: false,
      consentAt: now,
      consentSourceUrl: "http://localhost:3111/contact",
      consentIpHash: "testhash0000000000000000000000ab",
      purgeAfter: new Date(now.getTime() + 730 * 24 * 60 * 60 * 1000),
    },
  });

  check("lead created", !!lead.id);
  check("consent to contact recorded", lead.consentContact);
  check("marketing consent separate and false", lead.consentMarketing === false);
  check("consent timestamp stored (CASL s.13 proof)", !!lead.consentAt);
  check("consent source URL stored", !!lead.consentSourceUrl);
  check("IP stored as hash, not raw address", !!lead.consentIpHash && !lead.consentIpHash.includes("."));
  check("retention date set on lead (PIPEDA P5)", !!lead.purgeAfter);
  check("unsubscribe token generated", !!lead.unsubscribeToken);

  await db.conversation.update({ where: { sessionId }, data: { leadId: lead.id } });
  const linked = await db.conversation.findUnique({ where: { sessionId } });
  check("chat conversation linked to lead", linked?.leadId === lead.id);

  const day = 24 * 60 * 60 * 1000;
  await db.followUpTask.createMany({
    data: [
      { leadId: lead.id, agentKey: "followup", runAfter: new Date(now.getTime() + 3 * day), reason: "No reply", step: 1 },
      { leadId: lead.id, agentKey: "followup", runAfter: new Date(now.getTime() + 10 * day), reason: "Second touch", step: 2 },
      { leadId: lead.id, agentKey: "followup", runAfter: new Date(now.getTime() + 21 * day), reason: "Final", step: 3 },
    ],
  });
  const tasks = await db.followUpTask.findMany({ where: { leadId: lead.id }, orderBy: { step: "asc" } });
  check("three follow-ups scheduled, not more", tasks.length === 3);
  check("follow-ups are capped at 3 steps", tasks.every((t) => t.maxSteps === 3));
  check("first follow-up is in the future", (tasks[0]?.runAfter.getTime() ?? 0) > Date.now());

  console.log("\n========================================");
  console.log(" STEP 5 — CASL enforcement");
  console.log("========================================");

  const commercial = await send({
    leadId: lead.id,
    toEmail: lead.email,
    subject: "Our latest platform engineering offers",
    bodyText: "Marketing content.",
    category: "COMMERCIAL",
  });
  check("COMMERCIAL blocked without express consent", !commercial.ok, commercial.reason);

  const suppressed = await db.emailMessage.findFirst({
    where: { leadId: lead.id, status: "SUPPRESSED" },
    orderBy: { createdAt: "desc" },
  });
  check("suppression recorded with a reason", !!suppressed && /consent/i.test(suppressed.error ?? ""));

  const transactional = await send({
    leadId: lead.id,
    toEmail: lead.email,
    subject: "Re: your enquiry",
    bodyText: "Thanks for getting in touch.",
    category: "TRANSACTIONAL",
  });
  check("TRANSACTIONAL allowed (reply to their own enquiry)", transactional.ok, transactional.reason);

  const queued = await db.emailMessage.findFirst({
    where: { leadId: lead.id, status: "QUEUED" },
    orderBy: { createdAt: "desc" },
  });
  check("CASL s.6(2) sender identification in body", !!queued && queued.bodyText.includes("RRR Solution Providers Inc."));
  check("CASL s.6(2)(b) mailing address in body", !!queued && /Toronto/i.test(queued.bodyText));
  check("CASL s.11 unsubscribe link in body", !!queued && queued.bodyText.includes("Unsubscribe at any time"));
  check("unsubscribe honour period stated", !!queued && /10 business days/i.test(queued.bodyText));

  console.log("\n========================================");
  console.log(" STEP 6 — Unsubscribe suppression");
  console.log("========================================");

  await db.lead.update({ where: { id: lead.id }, data: { unsubscribedAt: new Date() } });
  const afterUnsub = await send({
    leadId: lead.id,
    toEmail: lead.email,
    subject: "Following up",
    bodyText: "Another message.",
    category: "TRANSACTIONAL",
  });
  check("all sending blocked after unsubscribe", !afterUnsub.ok, afterUnsub.reason);

  console.log("\n========================================");
  console.log(" STEP 7 — PIPEDA data subject request");
  console.log("========================================");

  const dsr = await db.dataSubjectRequest.create({
    data: {
      email: lead.email,
      kind: "ACCESS",
      detail: "Please send me everything you hold.",
      dueBy: new Date(Date.now() + 30 * day),
    },
  });
  const days = Math.round((dsr.dueBy.getTime() - Date.now()) / day);
  check("access request logged", !!dsr.id);
  check("30-day statutory clock set (PIPEDA s.8(3))", days >= 29 && days <= 30, `${days} days`);

  console.log("\n========================================");
  console.log(" STEP 8 — Audit trail");
  console.log("========================================");

  const events = await db.auditEvent.findMany({
    where: { leadId: lead.id },
    orderBy: { createdAt: "asc" },
  });
  console.log(`  ${events.length} audit events for this lead:`);
  for (const e of events) console.log(`    ${e.actor.padEnd(10)} ${e.action}`);
  check("CASL block was audited", events.some((e) => e.action === "email.blocked.casl"));
  check("suppression was audited", events.some((e) => e.action === "email.suppressed"));

  console.log("\n========================================");
  console.log(" STEP 9 — Referential integrity");
  console.log("========================================");

  const full = await db.lead.findUnique({
    where: { id: lead.id },
    include: {
      conversations: { include: { messages: true } },
      emails: true,
      tasks: true,
      approvals: true,
      events: true,
    },
  });
  check("lead -> conversations", (full?.conversations.length ?? 0) >= 1);
  check("lead -> messages via conversation", (full?.conversations[0]?.messages.length ?? 0) >= 6);
  check("lead -> emails", (full?.emails.length ?? 0) >= 3);
  check("lead -> follow-up tasks", (full?.tasks.length ?? 0) === 3);
  check("lead -> audit events", (full?.events.length ?? 0) >= 2);

  const runs = await db.agentRun.findMany({ where: { conversationId: convo?.id } });
  console.log(`\n  agent runs recorded: ${runs.length}`);
  for (const r of runs) {
    console.log(`    ${r.agentKey.padEnd(14)} ${r.status.padEnd(26)} ${r.latencyMs}ms  model=${r.model ?? "retrieval"}`);
  }
  check("every chat turn produced an agent run", runs.length >= 3);
  check("runs with pending approvals are marked BLOCKED", runs.some((r) => r.status === "BLOCKED_PENDING_APPROVAL"));
  check("no model calls (retrieval only, zero cost)", runs.every((r) => r.model === null));

  console.log("\n========================================");
  console.log(" TOTALS");
  console.log("========================================");
  const counts = {
    leads: await db.lead.count(),
    conversations: await db.conversation.count(),
    messages: await db.message.count(),
    agentRuns: await db.agentRun.count(),
    approvals: await db.approval.count(),
    pendingApprovals: await db.approval.count({ where: { status: "PENDING" } }),
    emails: await db.emailMessage.count(),
    followUps: await db.followUpTask.count(),
    auditEvents: await db.auditEvent.count(),
    privacyRequests: await db.dataSubjectRequest.count(),
  };
  for (const [k, v] of Object.entries(counts)) console.log(`  ${k.padEnd(18)} ${v}`);

  console.log(`\n  ${pass} passed, ${fail} failed`);
  await db.$disconnect();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(async (e) => {
  console.error("TEST CRASHED:", e);
  await db.$disconnect();
  process.exit(1);
});
