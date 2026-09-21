/**
 * THE ENGAGEMENT PIPELINE
 *
 * The bridge between selling work and doing it. A client request only enters
 * the delivery plane when a human has:
 *   1. marked the engagement WON, and
 *   2. explicitly released it.
 *
 * No agent can perform either step. That is the entire point of the gate.
 *
 * Once released, the pipeline walks the delivery hierarchy in order, and each
 * stage must be reviewed before the next begins. Stages emit work packages
 * into the firm's existing Claude Code agent setup and write a note into the
 * Obsidian vault, so the organisational memory is one place rather than two.
 */

import { DELIVERY_ORG, agentByKey, chainOfReview } from "./delivery-org";

export type Stage =
  | "INTAKE"
  | "REQUIREMENT"
  | "ARCHITECTURE"
  | "PLANNING"
  | "MOBILISATION"
  | "EXECUTION"
  | "VERIFICATION"
  | "HANDOVER"
  | "CLOSED";

export interface StageDefinition {
  stage: Stage;
  ownerAgent: string;
  title: string;
  description: string;
  /** Artefacts that must exist before the stage can be marked complete. */
  exitCriteria: string[];
  /** Whether a named human must sign off before the next stage begins. */
  humanGate: boolean;
  gateReason?: string;
}

export const PIPELINE: StageDefinition[] = [
  {
    stage: "INTAKE",
    ownerAgent: "principal",
    title: "Intake",
    description:
      "A won engagement is received from the front-of-house plane with its signed scope, agreed price and acceptance criteria.",
    exitCriteria: [
      "Signed statement of work attached",
      "Acceptance criteria written and agreed",
      "Named client-side decision maker identified",
    ],
    humanGate: true,
    gateReason:
      "Release into delivery is a commercial commitment. A human confirms the scope actually matches what was signed.",
  },
  {
    stage: "REQUIREMENT",
    ownerAgent: "principal",
    title: "Requirement definition",
    description:
      "The principal turns the signed scope into a precise requirement brief, and records every open question rather than assuming an answer.",
    exitCriteria: [
      "Requirement brief with numbered requirements",
      "Constraints register: regulatory, budget, technical, organisational",
      "Open-questions log, each with an owner",
      "Client confirmation that the brief matches their understanding",
    ],
    humanGate: true,
    gateReason: "A misread requirement compounds through every later stage. Cheapest place to catch it.",
  },
  {
    stage: "ARCHITECTURE",
    ownerAgent: "architect",
    title: "Architecture",
    description:
      "The architect reads the actual estate, assesses current state, and produces a target architecture with decision records.",
    exitCriteria: [
      "Current-state assessment from the real repository and accounts",
      "Target architecture diagram",
      "One ADR per material decision",
      "Non-functional requirements quantified",
      "Risk register with blast-radius analysis",
    ],
    humanGate: true,
    gateReason:
      "Cloud, region, Kubernetes distribution, state backend, deployment strategy and DR objectives are client decisions, not ours to make silently.",
  },
  {
    stage: "PLANNING",
    ownerAgent: "delivery-manager",
    title: "Planning and staffing",
    description:
      "The delivery manager converts the architecture into team shape, effort, duration, cost, margin, delivery model and release approach.",
    exitCriteria: [
      "Effort model in hours per role",
      "Elapsed duration including client-side dependencies",
      "Internal cost, revenue and gross margin computed",
      "Delivery and release model chosen with rationale",
      "Milestone plan with acceptance criteria per milestone",
      "Environment and promotion strategy",
    ],
    humanGate: true,
    gateReason: "Commits the firm's people and margin. Requires a human decision.",
  },
  {
    stage: "MOBILISATION",
    ownerAgent: "delivery-manager",
    title: "Mobilization",
    description:
      "Team leads decompose milestones into tasks with a definition of done, and access is arranged through the client's own process.",
    exitCriteria: [
      "Task breakdown per workstream with definitions of done",
      "Access requested and granted through the client's normal process",
      "Environments confirmed and reachable",
      "Kick-off held with the named client contact",
    ],
    humanGate: false,
  },
  {
    stage: "EXECUTION",
    ownerAgent: "lead-infrastructure",
    title: "Execution",
    description:
      "Engineers produce artefacts. Every output is reviewed by its team lead, then by the delivery manager, before anything reaches the client.",
    exitCriteria: [
      "All milestone tasks complete and reviewed",
      "Plans and diffs produced for every change, none applied by an agent",
      "Security gates passing",
      "Weekly demonstrable increment delivered",
    ],
    humanGate: true,
    gateReason:
      "Nothing is applied to a client environment by an agent. A named human executes every mutating change.",
  },
  {
    stage: "VERIFICATION",
    ownerAgent: "qa",
    title: "Verification",
    description:
      "Independent verification against the written acceptance criteria, including load and failure-mode testing where the SLOs require it.",
    exitCriteria: [
      "Every acceptance criterion demonstrably met, with evidence",
      "Load tests run against the SLO targets",
      "Failure modes and rollback rehearsed",
      "Defect register clear, or remaining items accepted in writing",
    ],
    humanGate: true,
    gateReason: "Declaring work complete is a contractual statement.",
  },
  {
    stage: "HANDOVER",
    ownerAgent: "tech-writer",
    title: "Handover",
    description:
      "Documentation, runbooks and recorded sessions, so the client's team can operate the platform without us.",
    exitCriteria: [
      "Runbooks written and validated by someone who did not build it",
      "Architecture documentation matches what was actually built",
      "Handover sessions held and recorded",
      "Client engineers have demonstrated they can operate it",
    ],
    humanGate: true,
    gateReason: "Triggers final invoicing and the start of any warranty period.",
  },
  {
    stage: "CLOSED",
    ownerAgent: "principal",
    title: "Closed",
    description: "Engagement complete. Retrospective held, lessons written back into the vault.",
    exitCriteria: ["Final invoice issued", "Retrospective held", "Lessons recorded in the knowledge vault"],
    humanGate: false,
  },
];

export const stageDefinition = (stage: Stage) => PIPELINE.find((p) => p.stage === stage);

export const nextStage = (stage: Stage): Stage | null => {
  const i = PIPELINE.findIndex((p) => p.stage === stage);
  return i >= 0 && i < PIPELINE.length - 1 ? PIPELINE[i + 1]!.stage : null;
};

/**
 * A unit of work handed to the firm's Claude Code agent setup. This is the
 * contract between this application and the `.claude/` agent configuration
 * already running on the team's machines.
 */
export interface WorkPackage {
  id: string;
  engagementId: string;
  stage: Stage;
  /** Delivery-org agent key, which maps to a persona in `.claude/agents/`. */
  assignedTo: string;
  /** Skills from `.claude/skills/` the agent should load. */
  skills: string[];
  title: string;
  brief: string;
  requirements: string[];
  definitionOfDone: string[];
  guardrails: string[];
  /** Agents that must review the output before it advances. */
  reviewChain: string[];
  /** Never true for anything touching a client environment. */
  autonomous: false;
  createdAt: string;
}

export function buildWorkPackage(input: {
  engagementId: string;
  stage: Stage;
  assignedTo: string;
  title: string;
  brief: string;
  requirements: string[];
}): WorkPackage {
  const agent = agentByKey(input.assignedTo);
  if (!agent) throw new Error(`Unknown delivery agent: ${input.assignedTo}`);

  const def = stageDefinition(input.stage);

  return {
    id: `wp-${input.engagementId}-${input.stage}-${Date.now().toString(36)}`,
    engagementId: input.engagementId,
    stage: input.stage,
    assignedTo: agent.key,
    skills: agent.skills,
    title: input.title,
    brief: input.brief,
    requirements: input.requirements,
    definitionOfDone: def?.exitCriteria ?? agent.produces,
    guardrails: [
      ...agent.guardrails,
      "Produce artefacts for review. Do not apply changes to any client environment.",
      "If a required input is missing, say so and stop. Do not assume it.",
    ],
    reviewChain: chainOfReview(agent.key).map((a) => a.key),
    autonomous: false,
    createdAt: new Date().toISOString(),
  };
}

/** Everyone who would be mobilized for a given set of workstreams. */
export function teamFor(workstreams: Array<"infrastructure" | "platform" | "data" | "security">) {
  const leadMap = {
    infrastructure: "lead-infrastructure",
    platform: "lead-platform",
    data: "lead-data",
    security: "lead-security",
  } as const;

  const leadKeys = workstreams.map((w) => leadMap[w]);
  const engineers = DELIVERY_ORG.filter((a) => a.level === "engineer" && leadKeys.includes(a.reportsTo as never));

  return [
    agentByKey("principal")!,
    agentByKey("architect")!,
    agentByKey("delivery-manager")!,
    ...leadKeys.map((k) => agentByKey(k)!),
    ...engineers,
    agentByKey("qa")!,
    agentByKey("tech-writer")!,
  ];
}
