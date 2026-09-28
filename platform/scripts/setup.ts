/**
 * GUIDED SETUP
 *
 *   npm run setup
 *
 * Writes platform/.env.local with everything filled in except the one value
 * only you have — the Google App Password — then opens the file so you can
 * paste it in.
 *
 * WHY IT DOES NOT PROMPT FOR THE PASSWORD
 * ---------------------------------------
 * Earlier versions asked at a terminal prompt and tried to hide the
 * keystrokes. That is genuinely hard to get right — readline redraws the
 * whole line on every keypress, terminals differ — and when the hiding fails
 * it fails *silently*: the secret is already on screen and in scrollback
 * before anyone notices. That happened here, and a live App Password had to
 * be revoked as a result.
 *
 * Pasting into an editor has none of those failure modes. The value never
 * touches the terminal, never enters scrollback, and the file is created
 * 0600 before anything is written into it. Less clever, and correct.
 */

import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync, readFileSync, chmodSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const FILE = ".env.local";
const PLACEHOLDER = "PASTE_YOUR_16_CHARACTER_APP_PASSWORD_HERE";

function line(text = "") {
  console.log(text);
}

function main() {
  line("\n========================================");
  line(" SETUP");
  line("========================================");

  if (existsSync(FILE)) {
    const existing = readFileSync(FILE, "utf8");
    const stillPlaceholder = existing.includes(PLACEHOLDER);

    line(`\n${FILE} already exists.`);
    line(
      stillPlaceholder
        ? "  The password placeholder has not been replaced yet."
        : "  It looks configured.",
    );
    line("");
    line("  Nothing has been changed. To start fresh, delete it first:");
    line("");
    line(`      rm ${FILE} && npm run setup`);
    line("");
    return;
  }

  // 32 random bytes each. These never need to be memorable, so there is no
  // reason for a person to choose them.
  const adminToken = randomBytes(32).toString("hex");
  const consentSalt = randomBytes(32).toString("hex");

  const contents = `# Local configuration. NEVER commit this file.
# It is git-ignored, and CI fails the build if a secret is ever committed.
#
# ONE THING TO DO: replace the placeholder on the SMTP_PASS line below with
# your Google App Password, then save and close this file.
#
#   Get one here (2-Step Verification must be on first):
#   https://myaccount.google.com/apppasswords
#
# Then run:  npm run mail:check -- --send

# ---- Email ------------------------------------------------------------------
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=rrrsolutionprovider@gmail.com

# <<< REPLACE THE VALUE ON THIS LINE >>>
SMTP_PASS=${PLACEHOLDER}

MAIL_FROM=RRR Solution Providers <rrrsolutionprovider@gmail.com>

# Where enquiry and booking alerts are delivered. Change freely.
MAIL_TO=rrrsolutionprovider@gmail.com

# ---- Secrets (generated for you — no action needed) --------------------------
# ADMIN_TOKEN is the password for the admin console at /admin.
ADMIN_TOKEN=${adminToken}

# CONSENT_SALT protects proof that customers consented. Without it the app
# deliberately stores nothing rather than store something reversible.
CONSENT_SALT=${consentSalt}

# ---- Database ----------------------------------------------------------------
DATABASE_URL=file:./dev.db

# ---- Site --------------------------------------------------------------------
NEXT_PUBLIC_SITE_URL=https://www.rrrsolutionproviders.ca
CASL_UNSUBSCRIBE_BASE=https://www.rrrsolutionproviders.ca/unsubscribe

# CASL s.6(2)(b) requires a physical mailing address in commercial messages.
# Replies to an enquiry are exempt; newsletters and outbound pitches are not.
# CASL_MAILING_ADDRESS=RRR Solution Providers Inc., <street>, Toronto, ON <postal>, Canada
`;

  // Created restricted BEFORE anything is written, so there is never a window
  // in which a world-readable file holds a credential.
  writeFileSync(FILE, contents, { mode: 0o600 });
  chmodSync(FILE, 0o600);

  line(`\n  ✓ Created ${FILE}`);
  line("  ✓ Admin console password generated");
  line("  ✓ Consent salt generated");
  line("  ✓ Readable only by you (0600)");
  line("");
  line("----------------------------------------");
  line(" ONE thing left for you");
  line("----------------------------------------");
  line("");
  line("  The file is opening now. Find this line:");
  line("");
  line(`      SMTP_PASS=${PLACEHOLDER}`);
  line("");
  line("  Replace the placeholder with your 16-character Google App Password.");
  line("  Spaces are fine. Save and close.");
  line("");
  line("  No App Password yet? 2-Step Verification must be on first:");
  line("      https://myaccount.google.com/signinoptions/twosv");
  line("  Then create one named 'RRR site':");
  line("      https://myaccount.google.com/apppasswords");
  line("");
  line("  Then run:");
  line("");
  line("      npm run mail:check -- --send");
  line("");

  // Open it in whatever the platform uses. If that fails — a headless shell,
  // no configured editor — say so and print the path, rather than appearing
  // to have done something that did not happen.
  const path = resolve(FILE);
  const opener =
    process.platform === "darwin"
      ? { cmd: "open", args: ["-e", path] }
      : process.platform === "win32"
        ? { cmd: "notepad", args: [path] }
        : { cmd: "xdg-open", args: [path] };

  const opened = spawnSync(opener.cmd, opener.args, { stdio: "ignore" });
  if (opened.error || opened.status !== 0) {
    line("  (Could not open an editor automatically. Open it yourself:)");
    line("");
    line(`      ${path}`);
    line("");
  }
}

try {
  main();
} catch (err) {
  console.error("\nSetup failed:", err instanceof Error ? err.message : err);
  process.exit(1);
}
