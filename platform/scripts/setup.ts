/**
 * GUIDED SETUP
 *
 *   npm run setup
 *
 * Writes platform/.env.local for you. You supply one value — the Google App
 * Password — and this generates everything else, writes the file in the right
 * shape, and then proves mail actually works.
 *
 * Why this exists: hand-editing a configuration file is where most first-time
 * setups fail, and the failure is silent. A missing quote or a stray space
 * produces a site that looks fine and never sends you an enquiry.
 *
 * It never prints a secret back to the screen, and never overwrites an
 * existing file without asking.
 */

import { createInterface } from "node:readline/promises";
import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync, readFileSync, chmodSync } from "node:fs";
import { stdin, stdout } from "node:process";

const FILE = ".env.local";

const rl = createInterface({ input: stdin, output: stdout });

function line(text = "") {
  console.log(text);
}

/** Ask without echoing — an App Password should not end up in scrollback. */
async function askSecret(prompt: string): Promise<string> {
  stdout.write(prompt);

  // Raw mode lets us swallow the keystrokes. Where it is unavailable (a piped
  // or non-interactive shell) fall back to a normal prompt and say so, rather
  // than silently echoing something the user expected to be hidden.
  if (!stdin.isTTY) {
    stdout.write("\n  (this terminal cannot hide input — the value will be visible)\n> ");
    const visible = await rl.question("");
    return visible.trim();
  }

  return new Promise((resolve) => {
    let value = "";
    stdin.setRawMode(true);
    stdin.resume();
    const onData = (chunk: Buffer) => {
      const char = chunk.toString("utf8");
      if (char === "\n" || char === "\r" || char === "") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        stdout.write("\n");
        resolve(value.trim());
        return;
      }
      if (char === "") {
        stdout.write("\n");
        process.exit(130);
      }
      if (char === "") {
        value = value.slice(0, -1);
        return;
      }
      value += char;
    };
    stdin.on("data", onData);
  });
}

async function main() {
  line("\n========================================");
  line(" SETUP");
  line("========================================");

  if (existsSync(FILE)) {
    line(`\n${FILE} already exists.`);
    const existing = readFileSync(FILE, "utf8");
    const has = (key: string) => new RegExp(`^${key}=.+`, "m").test(existing);
    line("  It currently sets: " +
      ["SMTP_PASS", "RESEND_API_KEY", "ADMIN_TOKEN", "CONSENT_SALT", "DATABASE_URL"]
        .filter(has)
        .join(", ") || "  (nothing recognisable)");
    const overwrite = await rl.question("\nReplace it? Your current one is backed up first. (y/N) ");
    if (overwrite.trim().toLowerCase() !== "y") {
      line("\nLeft alone. Nothing changed.\n");
      rl.close();
      return;
    }
    writeFileSync(`${FILE}.backup-${Date.now()}`, existing, { mode: 0o600 });
    line("  Backed up.");
  }

  // ---- The one thing only you can provide -------------------------------
  line("\n----------------------------------------");
  line(" Your Google App Password");
  line("----------------------------------------");
  line("");
  line("  This is a 16-character password for this app alone. It is NOT your");
  line("  Gmail password, and you can revoke it without affecting anything else.");
  line("");
  line("  1. Turn on 2-Step Verification (required, App Passwords need it):");
  line("     https://myaccount.google.com/signinoptions/twosv");
  line("  2. Create one named 'RRR site':");
  line("     https://myaccount.google.com/apppasswords");
  line("  3. Paste it below. Spaces are fine — they are stripped.");
  line("");

  const raw = await askSecret("  App Password: ");
  const appPassword = raw.replace(/\s+/g, "");

  if (!appPassword) {
    line("\nNothing entered. Run `npm run setup` again when you have it.\n");
    rl.close();
    return;
  }
  if (appPassword.length !== 16) {
    line(`\n  ⚠ That is ${appPassword.length} characters; a Google App Password is 16.`);
    const carryOn = await rl.question("  Continue anyway? (y/N) ");
    if (carryOn.trim().toLowerCase() !== "y") {
      line("\nStopped. Nothing written.\n");
      rl.close();
      return;
    }
  }

  // ---- Addresses ---------------------------------------------------------
  const defaultFrom = "rrrsolutionprovider@gmail.com";
  const from = (await rl.question(`\n  Gmail address to send from [${defaultFrom}]: `)).trim() || defaultFrom;
  const to = (await rl.question(`  Inbox where enquiry alerts land [${from}]: `)).trim() || from;

  // ---- Generated for you -------------------------------------------------
  // 32 random bytes each. These never need to be memorable, so there is no
  // reason for them to be anything a person chose.
  const adminToken = randomBytes(32).toString("hex");
  const consentSalt = randomBytes(32).toString("hex");

  const contents = `# Written by \`npm run setup\`. Never commit this file.
# It is excluded by .gitignore, and CI fails the build if a secret is committed.

# ---- Email -----------------------------------------------------------------
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=${from}
SMTP_PASS=${appPassword}
MAIL_FROM=RRR Solution Providers <${from}>

# Where enquiry and booking alerts are delivered. Change this freely.
MAIL_TO=${to}

# ---- Secrets ---------------------------------------------------------------
# ADMIN_TOKEN is the password for the admin console at /admin.
ADMIN_TOKEN=${adminToken}

# CONSENT_SALT protects proof that customers consented. Without it the app
# deliberately stores nothing rather than store something reversible.
CONSENT_SALT=${consentSalt}

# ---- Database --------------------------------------------------------------
DATABASE_URL=file:./dev.db

# ---- Site ------------------------------------------------------------------
NEXT_PUBLIC_SITE_URL=https://www.rrrsolutionproviders.ca
CASL_UNSUBSCRIBE_BASE=https://www.rrrsolutionproviders.ca/unsubscribe

# CASL s.6(2)(b) requires a physical mailing address in commercial messages.
# Replies to an enquiry are exempt; newsletters and outbound pitches are not.
# CASL_MAILING_ADDRESS=RRR Solution Providers Inc., <street>, Toronto, ON <postal>, Canada
`;

  // 0600: readable only by you. A configuration file holding a live password
  // should not be world-readable on a shared machine.
  writeFileSync(FILE, contents, { mode: 0o600 });
  chmodSync(FILE, 0o600);

  line("\n----------------------------------------");
  line(` Written ${FILE}`);
  line("----------------------------------------");
  line("  ✓ Email configured");
  line("  ✓ Admin console password generated");
  line("  ✓ Consent salt generated");
  line("  ✓ File permissions set so only you can read it");
  line("");
  line("  Your admin console password is in the file as ADMIN_TOKEN.");
  line("  You will need it to sign in at /admin.");
  line("");
  line("Now run this to prove mail works:");
  line("");
  line("    npm run mail:check -- --send");
  line("");
  line("An email should arrive within a minute. Check spam on the first one.\n");

  rl.close();
}

void main().catch((err) => {
  console.error("\nSetup failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
