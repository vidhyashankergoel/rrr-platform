/**
 * GROWTH WORKLIST
 *
 * Everything that can be done to grow the page without spending money, in the
 * order that returns the most for the least, with the words already written.
 *
 * WHY THIS IS A WORKLIST AND NOT AN AGENT
 * ---------------------------------------
 * There is no compliant way to automate LinkedIn connections. The official
 * API has no endpoint for it — the Community Management API covers posting
 * and page analytics and nothing else — so every tool that claims to do it is
 * browser automation or an unofficial client, both prohibited by name in
 * section 8.2 of the User Agreement.
 *
 * The penalty is not a warning. It is restriction or permanent loss of the
 * account, and because a company page is administered through a personal
 * profile, losing the profile loses the page. This firm's profile is linked
 * from every page of its own website.
 *
 * So the automation here is of the writing, not the sending. The slow part of
 * outreach was never the clicking; it was composing something worth reading
 * twenty times. That part is done ahead of time, and a person sends.
 *
 * CASL
 * ----
 * A connection note that promotes the business is a Commercial Electronic
 * Message. CASL requires the sender to be identified with a mailing address
 * and to provide an unsubscribe path, and section 13 puts the burden of
 * proving compliance on the sender. The check below refuses to print
 * promotional notes until an address exists, because "we did not know" is not
 * a defence and the ceiling is $10,000,000.
 */

import { company } from "../src/lib/company";
import { auditOffer } from "../src/lib/catalogue";
import { currencyFromDollars as money } from "../src/lib/company";
import { readTargets, draftFor, NOTE_LIMIT } from "../src/lib/agents/ops/outreach";

const line = (c = "-") => console.log(c.repeat(72));

function caslReady(): { ok: boolean; note: string } {
  const address = process.env.CASL_MAILING_ADDRESS?.trim() || company.addressLine?.trim();
  return address
    ? { ok: true, note: `CASL identification: ${address}` }
    : {
        ok: false,
        note:
          "No mailing address configured. A connection note promoting the firm is a " +
          "Commercial Electronic Message under CASL and must carry one.\n" +
          "  Set CASL_MAILING_ADDRESS, or company.addressLine — a registered office or " +
          "a mailbox, not a home address you do not want published.",
      };
}

/**
 * The free levers, ordered by what they return at this stage. Nothing here
 * costs anything and nothing here is automated — these are things LinkedIn
 * built for exactly this purpose, which is why using them carries no risk.
 */
const LEVERS = [
  {
    name: "Invite your connections to follow the page",
    where: "Page admin view -> right rail -> Invite connections",
    why:
      "LinkedIn gives the page a pool of invitation credits and refunds the credit " +
      "when somebody accepts, so inviting people who actually know you costs " +
      "nothing in the long run. Your dashboard shows the balance — read it there " +
      "rather than trusting a number from a blog post, it varies by page. This is " +
      "the single largest free lever at a low follower count, it is a native " +
      "feature rather than automation, and it is one click per person. Do it " +
      "before anything else on this list.",
  },
  {
    name: "Reshare each page post to your own profile",
    where: "The post -> Repost -> Repost with your thoughts",
    why:
      "A new page has almost no organic distribution. Your personal profile has " +
      "an actual network. One line of your own on top of the share consistently " +
      "outperforms a bare repost.",
  },
  {
    name: "Add the page to your profile's Experience",
    where: "Profile -> Experience -> the Founder entry -> pick the company from the dropdown",
    why:
      "Picking it from the dropdown rather than typing it links the two, puts the " +
      "logo on your profile, and makes every profile visitor a potential follower.",
  },
  {
    name: "Answer in the comments where your buyers already are",
    where: "Posts by Canadian CTOs, platform leads and the Kubernetes and FinOps communities",
    why:
      "A specific, useful reply on somebody else's post reaches their whole " +
      "audience and costs nothing. It is slower than a connection blast and it is " +
      "the only version of this that compounds rather than getting you restricted.",
  },
  {
    name: "Put the page link where people already find you",
    where: "Email signature, GitHub profile README, the site footer",
    why: "Free, permanent, and it works while you are asleep.",
  },
];

function main() {
  const casl = caslReady();

  line("=");
  console.log(" GROWTH WORKLIST");
  line("=");
  console.log(` ${company.legalName}`);
  console.log(` ${company.siteUrl}`);
  console.log("");

  // --- The levers ----------------------------------------------------------
  console.log(" FREE LEVERS, BEST FIRST");
  line();
  LEVERS.forEach((l, i) => {
    console.log(`\n ${i + 1}. ${l.name}`);
    console.log(`    where: ${l.where}`);
    console.log(`    why:   ${l.why.replace(/\s+/g, " ")}`);
  });

  // --- Outreach ------------------------------------------------------------
  console.log("");
  line("=");
  console.log(" CONNECTION NOTES");
  line("=");

  if (!casl.ok) {
    console.log("\n BLOCKED\n");
    console.log(` ${casl.note}`);
    console.log("");
    console.log(" Notes that are purely personal — no offer, no price, no link to the");
    console.log(" site — are not commercial messages and are unaffected. It is the");
    console.log(" promotional ones this holds back.");
    console.log("");
  } else {
    console.log(`\n ${casl.note}\n`);
  }

  const { targets, error } = readTargets();

  if (error) {
    console.log(` Could not read the target list: ${error}`);
    return;
  }

  if (targets.length === 0) {
    console.log(" No targets listed yet.\n");
    console.log(" Add people to platform/data/outreach-targets.json. The file is");
    console.log(" git-ignored because it holds other people's personal information and");
    console.log(" this repository is public.\n");
    console.log(" Each entry needs a `why` — the specific public reason you are");
    console.log(" contacting THAT person. It is required on purpose: a note without one");
    console.log(" is a template, the recipient can tell, and templates sent at volume are");
    console.log(" the behaviour that gets accounts restricted.\n");
    console.log(" Shape:");
    console.log(JSON.stringify(
      [{
        name: "Jordan Lee",
        role: "VP Engineering",
        organization: "A Canadian insurer",
        why: "I read your write-up on moving off the mainframe in stages.",
        profileUrl: "https://www.linkedin.com/in/example/",
      }],
      null, 2,
    ).split("\n").map((l) => "   " + l).join("\n"));
    return;
  }

  console.log(` ${targets.length} target(s). Open the profile, paste, send. Nothing sends itself.\n`);

  for (const [i, target] of targets.entries()) {
    const d = draftFor(target);
    line();
    console.log(` ${i + 1}. ${target.name}${target.role ? ` — ${target.role}` : ""}`);
    if (target.organization) console.log(`    ${target.organization}`);
    if (target.profileUrl) console.log(`    ${target.profileUrl}`);
    console.log("");
    console.log(`    NOTE (${d.note.length}/${NOTE_LIMIT})${d.tooLongBy ? `  OVER BY ${d.tooLongBy}` : ""}`);
    console.log(d.note.split("\n").map((l) => "      " + l).join("\n"));
    console.log("");
    console.log("    AFTER THEY ACCEPT — a separate decision, send it later or not at all");
    console.log(d.followUp.split("\n").map((l) => "      " + l).join("\n"));
    console.log("");
  }

  line("=");
  console.log(" A note on pacing");
  line("=");
  console.log("");
  console.log(" LinkedIn's published weekly invitation limit is about 100, and accounts");
  console.log(" well under it still get restricted when the acceptance rate is poor —");
  console.log(" the signal is strangers ignoring you, not the raw count. Twenty a week");
  console.log(" to people who have a reason to recognise you beats two hundred to a");
  console.log(" scraped list, and it is the difference between a network and a warning.");
  console.log("");
  console.log(` Entry offer, if you need it in the follow-up: the ${auditOffer.name}`);
  console.log(` at ${money(auditOffer.price)} over ${auditOffer.durationLabel}.`);
  console.log("");
}

main();
