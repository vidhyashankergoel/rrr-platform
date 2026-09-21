import type { Metadata } from "next";
import { company } from "@/lib/company";
import { PageHead } from "@/components/Bits";

export const metadata: Metadata = {
  title: "Privacy notice",
  description:
    "How RRR Solution Providers collects, uses, retains and protects personal information under PIPEDA.",
};

const EFFECTIVE = "18 September 2026";

export default function PrivacyPage() {
  return (
    <>
      <PageHead
        crumb="Privacy"
        title="Privacy notice"
        lede="Written to be read. This explains what we collect, why, how long we keep it, and how to make us delete it."
      />

      <section className="section">
        <div className="wrap-tight">
          <div
            className="card"
            style={{ background: "var(--bg-alt)", border: 0, marginBottom: "2.5rem" }}
          >
            <p style={{ marginBottom: ".5rem" }}>
              <strong style={{ color: "var(--text)" }}>Effective:</strong> {EFFECTIVE}
            </p>
            <p style={{ marginBottom: 0 }}>
              <strong style={{ color: "var(--text)" }}>The short version:</strong> we collect the
              minimum needed to answer your enquiry and deliver work you have engaged us for. We do not
              sell it. We do not share it for anyone else&rsquo;s marketing. You can ask to see it,
              correct it, or have it deleted, and we will respond within 30 days.
            </p>
          </div>

          <h2>1. Who we are</h2>
          <p>
            {company.legalName} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is a cloud and platform
            engineering firm based in {company.city}, {company.regionName}, Canada. We are the
            organization accountable for the personal information described in this notice.
          </p>
          <p>
            We operate under the <em>Personal Information Protection and Electronic Documents Act</em>{" "}
            (PIPEDA). Where we act as a service provider processing personal information on a
            client&rsquo;s behalf, that processing is governed by the data processing agreement in the
            relevant engagement contract rather than by this notice.
          </p>
          <p>
            <strong>Privacy Officer:</strong>{" "}
            <a href={`mailto:${company.email}`}>{company.email}</a> · {company.phone}
          </p>

          <h2>2. What we collect, and why</h2>
          <p>
            PIPEDA Principle 4 limits collection to what is necessary for identified purposes. We hold
            ourselves to that. Specifically:
          </p>

          <div className="table-scroll" style={{ marginBottom: "2rem" }}>
            <table>
              <caption className="visually-hidden">Personal information collected, purpose and retention</caption>
              <thead>
                <tr>
                  <th scope="col">What</th>
                  <th scope="col">Why</th>
                  <th scope="col">How long</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Name, work email, phone, company, job title</strong></td>
                  <td>To respond to an enquiry you sent us and to deliver services you engage us for</td>
                  <td className="num">2 years from last contact</td>
                </tr>
                <tr>
                  <td><strong>What you tell us about your infrastructure</strong></td>
                  <td>To scope the work and give you a realistic estimate</td>
                  <td className="num">2 years from last contact</td>
                </tr>
                <tr>
                  <td><strong>Budget band and timeline, if you provide them</strong></td>
                  <td>To tell you honestly whether we are a sensible fit</td>
                  <td className="num">2 years from last contact</td>
                </tr>
                <tr>
                  <td><strong>Chat transcripts with our assistant</strong></td>
                  <td>To answer you properly, and to improve the answers we give</td>
                  <td className="num">1 year</td>
                </tr>
                <tr>
                  <td><strong>Consent records — what you agreed to, when, from which page</strong></td>
                  <td>Required: CASL s.13 places the burden of proving consent on us</td>
                  <td className="num">3 years after consent is withdrawn</td>
                </tr>
                <tr>
                  <td><strong>A one-way hash of your IP address</strong></td>
                  <td>To evidence that a consent came from a real session. We do not store the address itself</td>
                  <td className="num">3 years</td>
                </tr>
                <tr>
                  <td><strong>Job applications — name, contact, CV, role</strong></td>
                  <td>To assess your application</td>
                  <td className="num">1 year, then deleted unless you ask us to keep it</td>
                </tr>
                <tr>
                  <td><strong>Client engagement records and invoices</strong></td>
                  <td>To deliver the work and meet tax obligations</td>
                  <td className="num">7 years (CRA requirement)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>What we deliberately do not collect</h3>
          <ul className="check-list">
            <li>We do not use advertising or analytics cookies, and there is no tracking pixel on this site</li>
            <li>We do not ask for banking details, card numbers or government identifiers — ever, by any channel</li>
            <li>We do not ask candidates about age, marital or family status, citizenship, ethnicity, religion or disability. Work authorization is asked only as a yes/no eligibility question, as the Ontario <em>Human Rights Code</em> requires</li>
            <li>We do not buy contact lists or scrape them</li>
          </ul>

          <h2>3. Consent</h2>
          <p>
            We ask for consent in plain language, at the point of collection, with the boxes unticked.
            A pre-ticked box is not consent and we do not use them.
          </p>
          <p>We keep two consents separate, because they are different things:</p>
          <ul>
            <li>
              <strong>Consent to respond to your enquiry.</strong> Required — without it we cannot reply
              to you. A reply to an enquiry you started is a transactional message.
            </li>
            <li>
              <strong>Consent to receive marketing email.</strong> Optional, and entirely separate.
              Declining it has no effect on your enquiry. This is express consent under CASL s.6(1), and
              every such message carries our identity, our mailing address, and a working unsubscribe
              link, honoured within 10 business days.
            </li>
          </ul>
          <p>
            You can withdraw either consent at any time by emailing{" "}
            <a href={`mailto:${company.email}`}>{company.email}</a>. Withdrawal is honoured promptly and
            does not require a reason.
          </p>

          <h2>4. Our AI assistant</h2>
          <p>
            This site has an automated assistant. We would rather over-explain it than have you
            discover it later:
          </p>
          <ul className="check-list">
            <li>Your messages are stored against an anonymous session identifier generated by your browser. We do not set a tracking cookie to do this</li>
            <li>If you later submit the contact form in the same browser session, the conversation is linked to your enquiry so a person can read the context before replying</li>
            <li>The assistant runs on a model hosted either on our own infrastructure or through a gateway we operate. It is not used to train any third party&rsquo;s model</li>
            <li>The assistant cannot send email, issue a quote, or commit us to anything. Every outward-facing action is queued for a named person to approve</li>
            <li>It can be wrong. Nothing it says is an offer, a quote or legal advice</li>
          </ul>

          <h2>5. Who we share with</h2>
          <p>
            We do not sell personal information, and we do not share it for third-party marketing. We
            share it only with service providers who help us operate, each bound by contract to protect
            it and use it only for that purpose:
          </p>
          <ul>
            <li><strong>Hosting and database</strong> — to run this site and store enquiries</li>
            <li><strong>Email delivery</strong> — to send you our reply</li>
            <li><strong>Accounting</strong> — to issue and record invoices</li>
          </ul>
          <p>
            <strong>Cross-border transfer.</strong> Some providers process data outside Canada, including
            in the United States. While outside Canada, information is subject to the laws of that
            country and may be accessible to its courts and law enforcement. We use providers offering
            Canadian or North American regions where available, and contractually require comparable
            protection. If your organization requires Canadian data residency, tell us before we start —
            it is a solvable constraint, and cheaper to solve at the beginning.
          </p>

          <h2>6. How we protect it</h2>
          <ul className="check-list">
            <li>Encryption in transit (HTTPS with HSTS) and at rest</li>
            <li>Access restricted to people who need it to do their job</li>
            <li>Multi-factor authentication on every administrative system</li>
            <li>Content Security Policy and standard hardening headers on every response</li>
            <li>IP addresses hashed rather than stored</li>
            <li>An audit log of administrative access to personal information</li>
          </ul>
          <p>
            No system is perfectly secure. If a breach creates a real risk of significant harm, we will
            report it to the Office of the Privacy Commissioner of Canada and notify affected individuals
            as PIPEDA requires, and we will keep the breach record the Act requires whether or not it
            meets that threshold.
          </p>

          <h2>7. Your rights</h2>
          <p>Under PIPEDA you may:</p>
          <ul>
            <li><strong>Access</strong> — ask what we hold about you and get a copy</li>
            <li><strong>Correct</strong> — have inaccurate information fixed</li>
            <li><strong>Withdraw consent</strong> — subject to legal and contractual limits</li>
            <li><strong>Delete</strong> — ask us to erase it, except where law requires retention (invoices, for example, for seven years)</li>
            <li><strong>Complain</strong> — to us first, and to the Privacy Commissioner if we do not resolve it</li>
          </ul>
          <p>
            Email <a href={`mailto:${company.email}`}>{company.email}</a> with &ldquo;Privacy
            request&rdquo; in the subject. We respond within 30 days, as PIPEDA s.8(3) requires, and
            there is no charge.
          </p>
          <p>
            Not satisfied? You can complain to the{" "}
            <a href="https://www.priv.gc.ca/" target="_blank" rel="noopener noreferrer">
              Office of the Privacy Commissioner of Canada
            </a>{" "}
            — 1-800-282-1376.
          </p>

          <h2>8. Cookies</h2>
          <p>
            We use no advertising or analytics cookies, and there is no consent banner because there is
            nothing to consent to. Your browser stores two things locally, which never reach our servers:
            your light or dark theme preference, and a session identifier so a chat conversation survives
            a page refresh. Clearing your site data removes both.
          </p>

          <h2>9. Changes</h2>
          <p>
            If we change this notice materially we will update the effective date and, where the change
            affects information we already hold about you, tell you directly.
          </p>

          <hr />
          <p style={{ fontSize: ".85rem", color: "var(--text-3)" }}>
            This notice describes our actual practice. It has been drafted carefully but has not been
            reviewed by counsel; if you are relying on it in a procurement process, ask us for the
            reviewed version.
          </p>
        </div>
      </section>
    </>
  );
}
