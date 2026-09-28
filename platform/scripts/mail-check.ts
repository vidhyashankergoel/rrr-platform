/**
 * MAIL CHECK
 *
 * Answers one question: will an enquiry or a booking actually reach the
 * business inbox? Reports what is configured, proves the credentials work,
 * and — with `--send` — puts a real message through the whole path.
 *
 *   npm run mail:check          diagnose only, sends nothing
 *   npm run mail:check -- --send  also send a real test message
 *
 * Never prints a secret. Keys and passwords are shown masked so a screenshot
 * of this output is safe to paste into a chat.
 */

import { loadEnvConfig } from "@next/env";

// Load the local configuration exactly the way `next dev` does, before
// anything reads it. A standalone tsx script does not do this on its own, and
// without it this script would report "not configured" against a setup that
// actually works in the app — the worst possible diagnostic.
loadEnvConfig(process.cwd());

// Imported inside main() rather than at the top: a static import is hoisted
// above loadEnvConfig, and mail-provider reads configuration as its module
// body runs, so it would see an empty environment.
type Provider = typeof import("../src/lib/mail-provider");
type Company = typeof import("../src/lib/company");

const SEND = process.argv.includes("--send");

/** Matches the placeholder `npm run setup` writes, so that case can be named. */
const PLACEHOLDER_HINT = "PASTE_YOUR_16";

/** Show enough to recognise a value, never enough to use it. */
function mask(value: string | undefined): string {
  if (!value) return "(not set)";
  const v = value.trim();
  if (v.length <= 8) return `${v.slice(0, 2)}${"•".repeat(6)}`;
  return `${v.slice(0, 4)}${"•".repeat(Math.min(v.length - 8, 20))}${v.slice(-4)}`;
}

function heading(text: string) {
  console.log(`\n${text}`);
  console.log("─".repeat(text.length));
}

async function main() {
  const { mailConfig, verifyTransport, deliver }: Provider = await import("../src/lib/mail-provider");
  const { company }: Company = await import("../src/lib/company");

  console.log("\n========================================");
  console.log(" MAIL CHECK");
  console.log("========================================");

  const cfg = mailConfig();

  heading("Configuration");
  console.log(`  provider        ${cfg.provider}`);
  console.log(`  from            ${cfg.from || "(not set)"}`);
  console.log(`  owner inbox     ${cfg.ownerInbox}`);
  console.log(`  reply-to        ${cfg.replyTo}`);
  console.log(`  company.email   ${company.email}`);

  if (cfg.provider === "resend") {
    console.log(`  RESEND_API_KEY  ${mask(process.env.RESEND_API_KEY)}`);
  }
  if (cfg.provider === "smtp") {
    console.log(`  SMTP_HOST       ${process.env.SMTP_HOST ?? "(not set)"}`);
    console.log(`  SMTP_PORT       ${process.env.SMTP_PORT ?? "587 (default)"}`);
    console.log(`  SMTP_USER       ${process.env.SMTP_USER ?? "(not set)"}`);
    // The shape of the password is the single most useful diagnostic here.
    // Gmail answers every credential problem with the same opaque
    // "Username and Password not accepted", so checking the value's shape
    // locally is the only way to distinguish "you pasted the spaces" from
    // "this password belongs to a different account".
    const rawPass = process.env.SMTP_PASS ?? "";
    const stripped = rawPass.replace(/\s+/g, "");
    console.log(`  SMTP_PASS       ${mask(stripped)}`);
    console.log(`                  ${stripped.length} characters after removing spaces`);

    if (stripped.includes(PLACEHOLDER_HINT)) {
      console.log("                  ⚠ this is still the placeholder — paste your real App Password");
    } else if (stripped.length !== 16) {
      console.log(
        `                  ⚠ a Google App Password is exactly 16 characters, not ${stripped.length}`,
      );
    } else if (rawPass !== stripped) {
      console.log("                  (spaces removed automatically — that is fine)");
    }
  }

  // ---- Blocking problems -------------------------------------------------
  if (cfg.problems.length) {
    heading("Not ready");
    for (const p of cfg.problems) console.log(`  ✗ ${p}`);
    console.log("\n  Nothing will be delivered until these are fixed.");
    console.log("  Setup instructions: docs/EMAIL-SETUP.md\n");
    process.exit(1);
  }

  // ---- Credentials -------------------------------------------------------
  heading("Credentials");
  const verified = await verifyTransport();
  if (verified.ok) {
    console.log(`  ✓ ${cfg.provider} accepted the credentials${verified.detail ? ` — ${verified.detail}` : ""}`);
  } else {
    console.log(`  ✗ ${verified.reason}${verified.detail ? ` — ${verified.detail}` : ""}`);

    // Gmail answers every credential problem with the same opaque message,
    // so spell out the causes in the order they actually occur. Without this
    // the only guidance is Google's own page, which does not mention the
    // account-mismatch case at all — and that is the most common one.
    if (/BadCredentials|535/.test(verified.detail ?? "")) {
      heading("What this usually means");
      console.log("  Google returns the same error for several different problems.");
      console.log("  In order of how often each is the actual cause:");
      console.log("");
      console.log("  1. The App Password was created on a DIFFERENT Google account.");
      console.log("     It only authenticates the account that created it. Yours must");
      console.log(`     be created while signed in as ${process.env.SMTP_USER?.trim() ?? "(not set)"}.`);
      console.log("     Check the avatar in the top-right of that page before copying.");
      console.log("");
      console.log("  2. 2-Step Verification is off on that account, so what you made");
      console.log("     is not really an App Password.");
      console.log("     https://myaccount.google.com/signinoptions/twosv");
      console.log("");
      console.log("  3. The password was revoked, or an old one is still in the file.");
      console.log("");
      console.log("  4. It is the normal Gmail password rather than an App Password.");
      console.log("");
    }

    console.log("  Setup instructions: docs/EMAIL-SETUP.md\n");
    process.exit(1);
  }

  // ---- What will and will not be delivered -------------------------------
  heading("What this setup can deliver");

  const canReachVisitors = !cfg.ownerOnly;
  console.log(`  ${"✓"} enquiry notifications  -> ${cfg.ownerInbox}`);
  console.log(`  ${"✓"} booking notifications  -> ${cfg.ownerInbox}`);
  console.log(
    `  ${canReachVisitors ? "✓" : "✗"} acknowledgements       -> the visitor${
      canReachVisitors ? "" : "   (BLOCKED — see below)"
    }`,
  );

  if (cfg.warnings.length) {
    heading("Warnings");
    for (const w of cfg.warnings) console.log(`  ! ${w}`);
  }

  // ---- Optional real send ------------------------------------------------
  if (!SEND) {
    console.log("\n  Re-run with --send to put a real message through.\n");
    return;
  }

  heading("Sending a test message");
  console.log(`  to ${cfg.ownerInbox} ...`);

  const result = await deliver({
    to: cfg.ownerInbox,
    subject: `Mail check — ${company.shortName}`,
    text: [
      "This is a test from your own site, not a real enquiry.",
      "",
      "If you are reading it, enquiry and booking notifications will reach you.",
      "",
      `  provider:    ${cfg.provider}`,
      `  from:        ${cfg.from}`,
      `  owner inbox: ${cfg.ownerInbox}`,
      `  visitor acknowledgements: ${canReachVisitors ? "enabled" : "blocked until a domain is verified"}`,
      "",
      "Nothing else was sent and no customer record was touched.",
    ].join("\n"),
  });

  if (result.ok) {
    console.log(`  ✓ accepted by ${cfg.provider}${result.id ? ` (id ${result.id})` : ""}`);
    console.log(`\n  Check ${cfg.ownerInbox} — including the spam folder on the first one.\n`);
  } else {
    console.log(`  ✗ ${result.reason}${result.detail ? ` — ${result.detail}` : ""}`);
    console.log("\n  Setup instructions: docs/EMAIL-SETUP.md\n");
    process.exit(1);
  }

}

void main().catch((err) => {
  console.error("\nmail:check failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
