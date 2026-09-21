import { NextResponse } from "next/server";
import { z } from "zod";
import { db, audit, hashIp } from "@/lib/db";
import { rateLimit, clientKey } from "@/lib/ratelimit";
import { company } from "@/lib/company";
import { notifyOwner, send } from "@/lib/mailer";
import { renderEnquiryReply, referenceFor } from "@/lib/email-templates";
import { auditOffer } from "@/lib/catalogue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lead capture.
 *
 * PIPEDA shapes this endpoint:
 *  • Principle 3 (Consent) — `consentContact` must be explicitly true. The
 *    form ships with the box unticked; pre-ticked consent is not consent.
 *  • Principle 4 (Limiting Collection) — we accept only fields an engagement
 *    actually needs. Anything else is rejected by the schema.
 *  • Principle 5 (Retention) — `purgeAfter` is set at creation.
 *
 * CASL s.13 puts the burden of proving consent on the sender, so we record
 * when consent was given, from which page, and a hashed session identifier.
 */
const Body = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  phone: z.string().max(40).optional().or(z.literal("")),
  company: z.string().max(160).optional().or(z.literal("")),
  jobTitle: z.string().max(120).optional().or(z.literal("")),
  message: z.string().max(4000).optional().or(z.literal("")),
  serviceIds: z.string().max(400).optional().or(z.literal("")),
  budgetBand: z.enum(["under-25k", "25-75k", "75-150k", "150k-plus", "unsure"]).optional(),
  timeline: z.enum(["immediate", "1-3-months", "3-6-months", "exploring"]).optional(),
  consentContact: z.literal(true, {
    errorMap: () => ({ message: "We need your permission to reply to this enquiry." }),
  }),
  consentMarketing: z.boolean().optional().default(false),
  sessionId: z.string().max(64).optional(),
  sourceUrl: z.string().max(500).optional(),
  // Honeypot — real people leave it empty.
  website: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  const limit = rateLimit(`lead:${clientKey(req)}`, 5, 10 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again shortly." },
      { status: 429 },
    );
  }

  let data;
  try {
    data = Body.parse(await req.json());
  } catch (err) {
    const message =
      err instanceof z.ZodError
        ? (err.errors[0]?.message ?? "Please check the form and try again.")
        : "Please check the form and try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Silently accept and discard obvious bots so they do not retry.
  if (data.website && data.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const now = new Date();

  try {
    const lead = await db.lead.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone || null,
        company: data.company || null,
        jobTitle: data.jobTitle || null,
        message: data.message || null,
        serviceIds: data.serviceIds || "",
        budgetBand: data.budgetBand ?? null,
        timeline: data.timeline ?? null,
        source: "website",
        stage: "NEW",

        consentContact: data.consentContact,
        consentMarketing: data.consentMarketing ?? false,
        consentAt: now,
        consentSourceUrl: data.sourceUrl ?? null,
        consentIpHash: await hashIp(clientKey(req)),

        // Retention: two years from last contact, reviewed annually.
        purgeAfter: new Date(now.getTime() + 730 * 24 * 60 * 60 * 1000),
      },
    });

    // Attach any chat conversation from the same browser session.
    if (data.sessionId) {
      await db.conversation
        .update({ where: { sessionId: data.sessionId }, data: { leadId: lead.id } })
        .catch(() => undefined);
    }

    // Internal notification only — this is not a message to the customer.
    await db.approval.create({
      data: {
        kind: "SALES_HANDOFF",
        title: `New enquiry — ${data.company || data.name}`,
        summary: (data.message || "No message provided.").slice(0, 400),
        payloadJson: JSON.stringify({ leadId: lead.id, email: lead.email }),
        riskNote: "Respond within one business day. Consent to contact is on record.",
        leadId: lead.id,
      },
    });

    // Schedule follow-up drafts. These produce drafts for approval, not sends.
    const day = 24 * 60 * 60 * 1000;
    await db.followUpTask.createMany({
      data: [
        { leadId: lead.id, agentKey: "followup", runAfter: new Date(now.getTime() + 3 * day), reason: "No reply after initial enquiry", step: 1 },
        { leadId: lead.id, agentKey: "followup", runAfter: new Date(now.getTime() + 10 * day), reason: "Second touch", step: 2 },
        { leadId: lead.id, agentKey: "followup", runAfter: new Date(now.getTime() + 21 * day), reason: "Final touch, then dormant", step: 3 },
      ],
    });

    // --- Tell the business, and acknowledge to the visitor ---------------
    //
    // Both are fire-and-forget. The lead is already committed; a mail failure
    // must not turn a successful submission into an error for the visitor.
    void (async () => {
      const notified = await notifyOwner({
        leadId: lead.id,
        name: lead.name,
        email: lead.email,
        company: lead.company,
        phone: lead.phone,
        jobTitle: lead.jobTitle,
        message: lead.message,
        budgetBand: lead.budgetBand,
        timeline: lead.timeline,
        serviceIds: lead.serviceIds,
        sourceUrl: lead.consentSourceUrl,
        consentMarketing: lead.consentMarketing,
      }).catch(() => ({ ok: false, reason: "threw" }));

      if (!notified.ok) {
        console.warn(`[leads] owner not notified for ${lead.id}: ${notified.reason}`);
      }

      // Acknowledgement to the visitor. Transactional — it answers an enquiry
      // they initiated — and gated on the contact consent they just gave.
      //
      // The template is chosen from what they actually told us, so someone
      // asking about the audit gets the audit's scope and price rather than
      // "thanks, we'll be in touch". See src/lib/email-templates.ts.
      const reply = renderEnquiryReply({
        name: lead.name,
        company: lead.company,
        message: lead.message,
        serviceIds: lead.serviceIds,
        budgetBand: lead.budgetBand,
        timeline: lead.timeline,
        reference: referenceFor(lead.id),
        source: lead.serviceIds?.includes("nda")
          ? "nda"
          : lead.serviceIds?.includes(auditOffer.id)
            ? "audit"
            : lead.source,
      });

      await send({
        leadId: lead.id,
        toEmail: lead.email,
        subject: reply.subject,
        bodyText: reply.bodyText,
        category: "TRANSACTIONAL",
        sequenceKey: `enquiry-${reply.templateKey}`,
      }).catch(() => undefined);
    })();

    await audit({
      actor: "system",
      action: "lead.created",
      subject: lead.email,
      detail: `consentContact=${lead.consentContact} consentMarketing=${lead.consentMarketing}`,
      leadId: lead.id,
    });

    return NextResponse.json({
      ok: true,
      message: `Thank you. Your enquiry is recorded and a person will reply within one business day. If it is urgent, call ${company.phone}.`,
    });
  } catch (err) {
    console.error("[leads]", err);
    return NextResponse.json(
      { error: `Something went wrong saving that. Please email ${company.email} directly.` },
      { status: 500 },
    );
  }
}
