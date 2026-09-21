import type { Metadata } from "next";
import Link from "next/link";
import { company } from "@/lib/company";
import { PageHead, CtaBand } from "@/components/Bits";

export const metadata: Metadata = {
  title: "Security",
  description:
    "How we secure what we build, how we protect your estate during an engagement, and the controls we will never compromise on — including what we refuse to do.",
};

const BUILD_CONTROLS = [
  {
    layer: "Identity",
    risk: "Over-permissioned roles are the single most common finding in every estate we review, and the thing that turns a small breach into a large one.",
    controls: [
      "Least-privilege IAM and RBAC, with wildcard permissions requiring a written justification",
      "No long-lived access keys anywhere — OIDC federation from CI, workload identity in-cluster",
      "Multi-factor authentication enforced on every human account with production access",
      "Break-glass accounts that are sealed, monitored, and alert on use",
      "Permission boundaries and SCPs so a compromised role cannot escalate",
    ],
  },
  {
    layer: "Network",
    risk: "Flat networks mean one compromised container reaches your database. We have found this in production more often than not.",
    controls: [
      "Private subnets by default; public exposure is an explicit decision, documented",
      "Security groups and NACLs scoped to source, never 0.0.0.0/0 on anything but a load balancer",
      "Kubernetes NetworkPolicies denying east-west traffic by default, then allowing what is needed",
      "Service mesh mTLS so service-to-service traffic is encrypted and identity-verified",
      "No bastion with a static key — session-based access through SSM or equivalent, fully logged",
    ],
  },
  {
    layer: "Secrets",
    risk: "Credentials in Git are permanent. Rotating them does not remove them from history, and history gets cloned.",
    controls: [
      "Nothing confidential in a repository, ever. Values referenced by lookup from Vault, Secrets Manager, Key Vault or Parameter Store",
      "GitLeaks scanning on every commit and in CI, blocking the merge",
      "External Secrets Operator or Sealed Secrets for Kubernetes — no plaintext in a manifest",
      "Automatic rotation where the provider supports it, documented manual rotation where it does not",
      "If we find something already committed, we stop and tell you. We do not rewrite your history unilaterally",
    ],
  },
  {
    layer: "Supply chain",
    risk: "You do not write most of the code you ship. A dependency or base image is the easiest way into your build.",
    controls: [
      "Every action, image and module pinned to an exact version or digest — never a floating tag",
      "Trivy scanning images and filesystems; Snyk or Dependabot on dependencies",
      "SBOM generated per build so you can answer 'are we affected' in minutes rather than days",
      "Image signing and admission control so an unsigned image cannot run in the cluster",
      "Minimal base images — distroless or Alpine — reducing the attack surface to what you actually use",
    ],
  },
  {
    layer: "Pipeline",
    risk: "A pipeline with production credentials is a production system. It is usually protected like a development one.",
    controls: [
      "SonarQube SAST and OWASP ZAP DAST as blocking gates, not advisory reports nobody reads",
      "Checkov and tfsec on infrastructure code before a plan is ever produced",
      "Least-privilege job tokens, scoped per job rather than per workflow",
      "Branch protection, required reviews and CODEOWNERS on anything that reaches production",
      "Signed commits where your risk profile calls for it",
    ],
  },
  {
    layer: "Data",
    risk: "Encryption is usually present. A tested restore usually is not — and an untested backup is a hope, not a control.",
    controls: [
      "Encryption at rest and in transit as a default, with customer-managed keys where required",
      "Backups that we restore, time and document — you get the actual RTO, not an aspiration",
      "Point-in-time recovery configured and verified",
      "Data classification so the controls match the sensitivity rather than being uniform and expensive",
      "Canadian data residency where your obligations require it — solvable, but cheaper to solve at the start",
    ],
  },
  {
    layer: "Detection",
    risk: "The average breach goes undetected for months. You cannot respond to what you cannot see.",
    controls: [
      "Centralized, tamper-resistant audit logging across cloud, cluster and application",
      "GuardDuty, Defender for Cloud or equivalent enabled and actually routed to a human",
      "Falco for runtime anomaly detection in-cluster — catching behaviour, not just known CVEs",
      "Alerting on the signals that matter: privilege escalation, new IAM principals, unusual egress",
      "Every alert names a runbook. An alert with no runbook is noise that trains people to ignore alerts",
    ],
  },
  {
    layer: "Governance",
    risk: "Controls decay. What passes an audit in March fails in September unless it is enforced automatically.",
    controls: [
      "Policy-as-code with OPA, Gatekeeper or Azure Policy — enforced in CI and in the cluster",
      "Drift detection so a manual change in the console is caught and reported",
      "Control mapping to CIS Benchmarks, SOC 2, ISO 27001 or PCI-DSS as your obligations require",
      "An evidence pack an assessor will accept, produced as a by-product of the work rather than a scramble",
    ],
  },
];

const OUR_CONDUCT = [
  {
    title: "We never take your production credentials by email or chat",
    body: "Access is granted through your own identity provider, to a named individual, with MFA. If someone asks you for a key in a message, it is not us — telephone the number on this site and check.",
  },
  {
    title: "Access is least-privilege and time-boxed",
    body: "We ask for the narrowest access that lets us do the work, and we ask you to revoke it at the end of the engagement. We will remind you to. A supplier that still has access six months later is your risk, not your convenience.",
  },
  {
    title: "No agent touches your environment",
    body: "We use AI heavily for reading, drafting and decomposition. It produces plans and diffs. A named human executes every mutating change against your estate. This is enforced in our tooling, not just promised in a deck.",
  },
  {
    title: "Nothing destructive without explicit sign-off",
    body: "Any plan showing replacement or destruction of a stateful resource — a database, a volume, a bucket — stops and comes to you in writing, even when the rest of the change is routine.",
  },
  {
    title: "We work on copies where we can",
    body: "Discovery and testing happen against non-production or against read-only access wherever it is possible to do so. Production access is requested when it is genuinely needed, not as a default convenience.",
  },
  {
    title: "Your data stays yours, and stays minimal",
    body: "We take the least we need to do the work. We do not copy production data to laptops. Where we must handle personal information on your behalf, we sign a data processing agreement that says exactly what we may do with it.",
  },
  {
    title: "We sign an NDA before discovery",
    body: "Mutual, and usually before we have seen anything at all. Yours or ours — we are not precious about whose paper. If your procurement needs it signed before a first call, say so and we will do that.",
  },
  {
    title: "We report what we find, including when it is embarrassing",
    body: "If we discover a credential in your repository, an open bucket, or an exposed endpoint, you hear about it the same day — privately, with a remediation plan, and without an invoice attached to the telling.",
  },
];

export default function SecurityPage() {
  return (
    <>
      <PageHead
        crumb="Security"
        title="How we keep your estate secure"
        lede="Two separate questions, and most suppliers only answer the first: how we secure what we build for you, and how we behave while we have access to what you already have."
      />

      {/* ---------------- THE PREMISE ---------------- */}
      <section className="section">
        <div className="wrap split">
          <div>
            <span className="eyebrow">The premise</span>
            <h2>Bringing in a supplier is itself a security event</h2>
            <p>
              For the duration of an engagement, we are a new principal with access to your
              infrastructure. That is a risk you are taking on, and pretending otherwise would be the
              first sign we were the wrong choice.
            </p>
            <p>
              So this page has two halves. The controls we build into your platform, and the way we
              conduct ourselves while we hold the keys. You should hold every supplier to both.
            </p>
            <p style={{ fontSize: ".92rem", color: "var(--text)", fontWeight: 600 }}>
              The prior work behind this: banking under regulated change control, an insurer&rsquo;s
              compliance estate, and a critical aviation environment where a failed deployment is a
              reportable event.
            </p>
          </div>
          <div className="card" style={{ background: "var(--bg-alt)", border: 0, padding: "2rem" }}>
            <h3 style={{ fontSize: "var(--step-1)" }}>What we will not do, at any price</h3>
            <ul className="check-list">
              <li>Accept production credentials over email, chat or a shared document</li>
              <li>Let an automated agent apply a change to your environment</li>
              <li>Weaken a control to make a test pass or a deadline</li>
              <li>Commit a credential to a repository, yours or ours</li>
              <li>Rewrite your Git history to hide a leaked value without your explicit direction</li>
              <li>Keep access after an engagement ends</li>
              <li>Tell you a restore works without having performed one</li>
            </ul>
            <p style={{ marginBottom: 0, fontSize: ".86rem", color: "var(--text-3)" }}>
              If we ever propose something on this list, that is your signal to stop the engagement.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- BUILD CONTROLS ---------------- */}
      <section className="section section--alt">
        <div className="wrap">
          <div className="center" style={{ marginBottom: "3rem" }}>
            <span className="eyebrow">Part one</span>
            <h2>The controls we build in</h2>
            <p className="lede">
              Eight layers, each with the failure it prevents stated first. Security controls that
              cannot be explained in terms of a specific risk are usually cargo cult.
            </p>
          </div>

          <div className="grid grid-2">
            {BUILD_CONTROLS.map((c) => (
              <article className="card" key={c.layer}>
                <span className="tag tag--accent">{c.layer}</span>
                <p
                  style={{
                    marginTop: "1rem",
                    fontSize: ".92rem",
                    color: "var(--text)",
                    fontWeight: 550,
                    borderLeft: "3px solid var(--crit)",
                    paddingLeft: ".9rem",
                  }}
                >
                  {c.risk}
                </p>
                <ul className="check-list">
                  {c.controls.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- OUR CONDUCT ---------------- */}
      <section className="section section--dark">
        <div className="wrap">
          <div className="center" style={{ marginBottom: "3rem" }}>
            <span className="eyebrow">Part two</span>
            <h2>How we behave while we have access</h2>
            <p className="lede">
              The half most suppliers leave out. These are commitments you can write into the
              engagement agreement, and we will sign them.
            </p>
          </div>

          <div className="grid grid-2">
            {OUR_CONDUCT.map((c) => (
              <article className="card" key={c.title}>
                <h3 style={{ fontSize: "1.02rem" }}>{c.title}</h3>
                <p style={{ marginBottom: 0, fontSize: ".92rem" }}>{c.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- VULNERABILITY LIFECYCLE ---------------- */}
      <section className="section">
        <div className="wrap split">
          <div>
            <span className="eyebrow">Vulnerability management</span>
            <h2>Finding them is easy. The process is the hard part.</h2>
            <p className="lede">
              Any scanner produces a list of hundreds of findings. What matters is whether anything
              gets fixed, and whether the next one is caught before it reaches production.
            </p>
            <p>
              We set up the loop, not just the scan: detection, triage against real exploitability in
              your context, a route to a fix with an owner, and a gate that stops the same class of
              issue recurring.
            </p>
          </div>

          <div className="timeline">
            <div className="tl-item">
              <span className="tag tag--accent">Continuous</span>
              <h4>1 · Detect</h4>
              <p>
                SAST, DAST, dependency scanning, image scanning, IaC scanning and runtime detection —
                each catching a different class of problem, all reporting to one place.
              </p>
            </div>
            <div className="tl-item">
              <span className="tag">Within 24h for critical</span>
              <h4>2 · Triage in context</h4>
              <p>
                A critical CVE in a library you never call is not critical. We assess exploitability in
                your actual architecture and rank accordingly, so your team is not chasing noise.
              </p>
            </div>
            <div className="tl-item">
              <span className="tag">Agreed SLA</span>
              <h4>3 · Remediate with an owner</h4>
              <p>
                Every accepted finding gets a named owner and a target date. Anything not fixed is
                formally risk-accepted in writing by someone with the authority to accept it — not left
                quietly open.
              </p>
            </div>
            <div className="tl-item">
              <span className="tag">Permanent</span>
              <h4>4 · Prevent recurrence</h4>
              <p>
                The fix is not the fix. A policy-as-code rule that blocks the same class of issue at the
                pipeline is the fix. Otherwise you will find it again next quarter.
              </p>
            </div>
            <div className="tl-item">
              <span className="tag">Quarterly</span>
              <h4>5 · Verify the controls still hold</h4>
              <p>
                Controls decay. We re-test that the gates still block what they claimed to block, and
                that the alerts still fire.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- COMPLIANCE ---------------- */}
      <section className="section section--alt">
        <div className="wrap">
          <div className="center" style={{ marginBottom: "2.5rem" }}>
            <span className="eyebrow">Evidence</span>
            <h2>Compliance as a by-product, not a scramble</h2>
            <p className="lede">
              If controls are enforced in code, the evidence for an audit already exists. We map to
              whichever framework you are held to.
            </p>
          </div>

          <div className="grid grid-4">
            {[
              ["CIS Benchmarks", "Hardening baselines for cloud accounts, Kubernetes and operating systems, verified automatically."],
              ["SOC 2", "Control mapping and evidence collection for Type I and Type II readiness."],
              ["ISO 27001", "Annex A control coverage, with the technical controls implemented rather than described."],
              ["PCI-DSS", "Segmentation, key management, logging and access control for in-scope environments."],
              ["PIPEDA", "Safeguards proportionate to sensitivity, retention limits enforced in the schema, breach records."],
              ["Reliability Status", "The founder is eligible for Canadian Reliability Status clearance for public-sector work."],
              ["Well-Architected", "AWS and Azure framework reviews against the security pillar, with findings priced."],
              ["OWASP ASVS", "Application security verification levels where you are building software, not just infrastructure."],
            ].map(([name, desc]) => (
              <div className="card" key={name}>
                <h3 style={{ fontSize: ".98rem" }}>{name}</h3>
                <p style={{ fontSize: ".86rem", marginBottom: 0 }}>{desc}</p>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginTop: "2rem", borderLeft: "4px solid var(--warn)" }}>
            <h3 style={{ fontSize: "1rem" }}>Said plainly, because you will ask</h3>
            <p style={{ marginBottom: 0 }}>
              {company.legalName} is not itself SOC 2 or ISO 27001 certified — we are a new firm, and
              claiming otherwise would be exactly the kind of thing this page argues against. We
              implement and evidence those controls for clients, and our own certification is on the
              roadmap. What we carry today is commercial general liability, professional liability and
              cyber coverage, with certificates provided on request. If your procurement requires a
              certified supplier, tell us early and we will tell you honestly whether we qualify.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- START SMALL ---------------- */}
      <section className="section">
        <div className="wrap-tight center">
          <span className="eyebrow">Lowest-risk starting point</span>
          <h2>Test us with read-only access</h2>
          <p className="lede">
            The fixed-price audit needs nothing but read access. Five business days, a written report
            of what is actually exposed, and you keep it whether or not you ever engage us again. It is
            designed so you can evaluate us without granting us anything that could hurt you.
          </p>
          <div className="btn-row" style={{ justifyContent: "center", marginTop: "2rem" }}>
            <Link className="btn btn--primary" href="/contact?service=Infrastructure%20Audit">
              Book a read-only audit
            </Link>
            <Link className="btn btn--ghost" href="/trust">
              How we build trust
            </Link>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
