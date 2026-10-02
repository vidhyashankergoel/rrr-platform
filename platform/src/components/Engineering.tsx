/**
 * HOW WE ENGINEER — the AI-assisted and progressive-delivery capabilities.
 *
 * EVERY CLAIM HERE IS BACKED BY SOMETHING A READER CAN OPEN. The AI cards
 * point at public repositories; the delivery cards describe techniques that
 * appear in the engagement record. Nothing describes a client's arrangement,
 * names a client, or reveals how any particular estate is put together —
 * these are the standard components of the discipline, which is exactly why
 * they can be published.
 *
 * The temptation on a page like this is to write "AI-powered" four times and
 * leave. The test applied to every line below: could a competent engineer
 * read this and tell whether we are describing something real? If the answer
 * is no, it is marketing noise and it is cut.
 */

const AI = [
  {
    tag: "Agentic",
    title: "Agents that cannot reach your estate",
    body:
      "Diagnostic agents run against a read-only view, inside per-task containers that are destroyed afterwards. An agent proposes; an engineer approves; the pipeline executes. The containment boundary is published code, not a policy document.",
    proof: "https://github.com/vidhya101/hive-k8s-agents",
    proofLabel: "Isolated execution containers",
  },
  {
    tag: "Retrieval",
    title: "Grounded in your estate, not a model's memory",
    body:
      "Retrieval over your own runbooks, manifests and incident history, so an answer cites the document it came from. A model that cannot show its source is a model nobody should act on at 3 a.m.",
    proof: "https://github.com/vidhya101/code-review-graph",
    proofLabel: "Structural code graph",
  },
  {
    tag: "In-cluster",
    title: "Local models where the data cannot leave",
    body:
      "An operator running against a model hosted inside the cluster, for estates where sending telemetry to a third-party endpoint is not an option a regulator would accept.",
    proof: "https://github.com/vidhya101/k8s-ai-operator",
    proofLabel: "Kubernetes AI operator",
  },
] as const;

const DELIVERY = [
  {
    k: "Canary",
    body: "A weighted slice of real traffic, shifted at the mesh rather than the load balancer, so the percentage is exact and the rollback is a config change.",
  },
  {
    k: "Blue-green",
    body: "Two full environments, one cutover, one DNS or routing switch back. The rollback path is tested before the rollout, not discovered during it.",
  },
  {
    k: "A/B and shadow",
    body: "Header or identity-based routing for a cohort, and mirrored traffic to a new version that serves nobody, so behaviour is observed before anyone depends on it.",
  },
  {
    k: "Ephemeral sandboxes",
    body: "A disposable cluster per pull request, built from the same modules as production and destroyed on merge. The environment that validates a change is not a snowflake.",
  },
] as const;

export default function Engineering() {
  return (
    <>
      <div className="grid grid-3 ai-grid">
        {AI.map((a) => (
          <article className="card card--hover ai-card" key={a.title}>
            <span className="tag tag--accent ai-card__tag">{a.tag}</span>
            <h3 className="ai-card__h">{a.title}</h3>
            <p className="ai-card__p">{a.body}</p>
            <a
              className="ai-card__proof"
              href={a.proof}
              target="_blank"
              rel="noopener noreferrer"
            >
              {a.proofLabel}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
            </a>
          </article>
        ))}
      </div>

      <div className="delivery-strip">
        {DELIVERY.map((d) => (
          <div className="delivery" key={d.k}>
            <span className="delivery__k">{d.k}</span>
            <p className="delivery__p">{d.body}</p>
          </div>
        ))}
      </div>
    </>
  );
}
