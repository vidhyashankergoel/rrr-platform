/**
 * End-to-end test of the delivery plane: org structure, pipeline, work-package
 * construction, dispatch to the agent inbox, and the knowledge-vault note.
 *
 * Run:  npx tsx scripts/bridge-test.ts
 */

import { buildWorkPackage, PIPELINE, teamFor, nextStage } from "../src/lib/agents/pipeline";
import { dispatch, renderWorkPackage } from "../src/lib/bridge/claude-code";
import { DELIVERY_ORG, chainOfReview, directReports } from "../src/lib/agents/delivery-org";

async function main() {
  console.log("=== DELIVERY ORG ===");
  const levels = ["principal", "architect", "manager", "lead", "engineer", "assurance"];
  console.log(`${DELIVERY_ORG.length} agents across ${levels.length} levels`);
  for (const lvl of levels) {
    const members = DELIVERY_ORG.filter((a) => a.level === lvl);
    console.log(`  ${lvl.padEnd(10)} ${String(members.length).padStart(2)}  ${members.map((a) => a.key).join(", ")}`);
  }

  console.log("\n=== REVIEW CHAIN (eng-terraform) ===");
  console.log("  " + chainOfReview("eng-terraform").map((a) => a.key).join(" -> ") + " -> named human");

  console.log("\n=== DIRECT REPORTS (delivery-manager) ===");
  console.log("  " + directReports("delivery-manager").map((a) => a.key).join(", "));

  console.log("\n=== PIPELINE ===");
  for (const st of PIPELINE) {
    const gate = st.humanGate ? "HUMAN GATE" : "auto";
    console.log(`  ${st.stage.padEnd(14)} owner=${st.ownerAgent.padEnd(18)} ${gate}`);
  }
  console.log("  flow: " + PIPELINE.map((p) => p.stage).join(" -> "));
  console.log("  nextStage(ARCHITECTURE) = " + nextStage("ARCHITECTURE"));
  console.log("  human gates: " + PIPELINE.filter((p) => p.humanGate).length + " of " + PIPELINE.length);

  console.log("\n=== TEAM FOR [infrastructure, platform, security] ===");
  const team = teamFor(["infrastructure", "platform", "security"]);
  console.log(`  ${team.length} roles mobilised:`);
  console.log("  " + team.map((t) => t.key).join(", "));

  console.log("\n=== BUILD WORK PACKAGES ===");
  const engagementId = "ENG-TEST-001";
  const pkgs = [
    buildWorkPackage({
      engagementId,
      stage: "REQUIREMENT",
      assignedTo: "principal",
      title: "Define requirement - Example Corp AWS migration",
      brief: "Client runs 40 services on-premises. Wants AWS. Deployments are manual.",
      requirements: [
        "Numbered requirement list agreed with the client",
        "Constraints register",
        "Open questions with named owners",
      ],
    }),
    buildWorkPackage({
      engagementId,
      stage: "ARCHITECTURE",
      assignedTo: "architect",
      title: "Target architecture - 40-service AWS migration",
      brief: "Produce target state, decision records and migration sequence.",
      requirements: [
        "Current-state assessment from the real estate",
        "Target architecture diagram",
        "One ADR per material decision",
      ],
    }),
    buildWorkPackage({
      engagementId,
      stage: "PLANNING",
      assignedTo: "delivery-manager",
      title: "Staffing, effort, duration and cost",
      brief: "Convert the architecture into team shape, effort model, elapsed duration and margin.",
      requirements: ["Effort per role in hours", "Elapsed duration", "Margin check", "Milestone plan"],
    }),
  ];

  console.log(`  built ${pkgs.length} packages`);
  for (const p of pkgs) {
    console.log(
      `    ${p.stage.padEnd(13)} -> ${p.assignedTo.padEnd(17)} autonomous=${p.autonomous}  review=[${p.reviewChain.join(" -> ") || "human"}]  skills=${p.skills.length}  dod=${p.definitionOfDone.length}`,
    );
  }

  // Assert the safety invariant.
  const unsafe = pkgs.filter((p) => p.autonomous !== false);
  console.log(`\n  SAFETY: packages marked autonomous = ${unsafe.length} (must be 0)`);
  const missingGuard = pkgs.filter(
    (p) => !p.guardrails.some((g) => g.toLowerCase().includes("do not apply")),
  );
  console.log(`  SAFETY: packages missing the no-apply guardrail = ${missingGuard.length} (must be 0)`);

  console.log("\n=== DISPATCH ===");
  const res = await dispatch(engagementId, "Example Corp", pkgs);
  console.log(`  ok = ${res.ok}`);
  console.log(`  files written: ${res.written.length}`);
  for (const f of res.written) console.log(`    ${f}`);
  console.log(`  knowledge note: ${res.vaultNote ?? "(vault path not configured)"}`);
  if (res.error) console.log(`  ERROR: ${res.error}`);

  console.log("\n=== SAMPLE PACKAGE (architect) ===");
  console.log(
    renderWorkPackage(pkgs[1]!)
      .split("\n")
      .slice(0, 34)
      .map((l) => "  " + l)
      .join("\n"),
  );
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
