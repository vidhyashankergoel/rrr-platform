import type { Metadata } from "next";
import { company } from "@/lib/company";
import { PageHead } from "@/components/Bits";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "Terms governing use of this website.",
};

export default function TermsPage() {
  return (
    <>
      <PageHead
        crumb="Terms"
        title="Terms of use"
        lede="These govern this website. They are not the terms of an engagement — that is a separate signed agreement."
      />

      <section className="section">
        <div className="wrap-tight">
          <div className="card" style={{ background: "var(--bg-alt)", border: 0, marginBottom: "2.5rem" }}>
            <p style={{ marginBottom: 0 }}>
              <strong style={{ color: "var(--text)" }}>Read this first:</strong> nothing on this site is
              an offer capable of acceptance. Published prices are indicative ranges to help you budget.
              A binding commitment exists only in a written agreement signed by both parties.
            </p>
          </div>

          <h2>1. Who these terms are with</h2>
          <p>
            This site is operated by {company.legalName}, a corporation with its registered office in{" "}
            {company.city}, {company.regionName}, Canada. Using the site means you accept these terms.
          </p>

          <h2>2. Pricing information is indicative</h2>
          <p>
            We publish price ranges and durations because we think hiding them wastes everyone&rsquo;s
            time. They are estimates based on typical engagements, and they are not:
          </p>
          <ul>
            <li>an offer capable of acceptance;</li>
            <li>a quotation;</li>
            <li>a guarantee of price, duration, scope or availability.</li>
          </ul>
          <p>
            A firm price follows a scoping call and a short discovery, and is set out in a written
            proposal. Where anything on this site conflicts with a signed agreement, the signed
            agreement governs.
          </p>

          <h2>3. The automated assistant</h2>
          <p>
            This site provides an automated assistant. It is software. It can be wrong, incomplete or
            out of date.
          </p>
          <ul>
            <li>Nothing it says is an offer, a quotation, professional advice or legal advice.</li>
            <li>It cannot bind us to a price, a date, a scope or any other commitment.</li>
            <li>It cannot send you a contract or an invoice. Every outward-facing action requires a named person here to approve it.</li>
            <li>Do not send it confidential information, credentials, or personal information about other people.</li>
          </ul>
          <p>
            Where it matters, rely on a written statement from a person, not on the assistant.
          </p>

          <h2>4. Case studies and prior work</h2>
          <p>
            Case studies describe work performed by our founder, in some cases in the course of
            employment with a prior employer and on that employer&rsquo;s client account. They are
            presented as evidence of hands-on capability. They do not imply that any client or former
            employer endorses, sponsors or is affiliated with this firm. Third-party names and marks
            belong to their owners.
          </p>

          <h2>5. Intellectual property</h2>
          <p>
            The content, design, code and marks on this site belong to {company.legalName} unless stated
            otherwise. You may read, print and share pages for your own evaluation. You may not
            reproduce the site substantially, or use our name or marks in a way that suggests
            endorsement or affiliation, without written permission.
          </p>
          <p>
            Separately, and importantly: <strong>work we deliver under an engagement belongs to the
            client</strong>, on the terms of that engagement agreement. These website terms do not cut
            that down.
          </p>

          <h2>6. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>attempt to gain unauthorized access to the site, its database or its infrastructure;</li>
            <li>submit false contact details, or another person&rsquo;s details without their authority;</li>
            <li>use the assistant to attempt to extract confidential information or to manipulate it into making commitments;</li>
            <li>scrape the site at a rate that degrades it for others, or bypass rate limiting;</li>
            <li>use the site to transmit malware or unlawful material.</li>
          </ul>
          <p>
            We rate-limit requests and may block access that breaches these terms. If you are a security
            researcher and find a vulnerability, please report it to{" "}
            <a href={`mailto:${company.email}`}>{company.email}</a> rather than exploiting it — we will
            respond, and we will not pursue good-faith research that stops at proof and does not access
            or destroy other people&rsquo;s data.
          </p>

          <h2>7. No professional advice</h2>
          <p>
            Content here is general information about our services. It is not architectural, security,
            legal, tax or accounting advice for your specific circumstances, and you should not act on
            it without engaging someone — us or anyone else — to look at your actual situation.
          </p>

          <h2>8. Availability</h2>
          <p>
            We make no promise that this site will be available uninterrupted or error-free. We may
            change, suspend or withdraw any part of it without notice. Service levels for engagements
            are a separate matter, set out in the relevant agreement.
          </p>

          <h2>9. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, we are not liable for indirect, incidental, special
            or consequential loss, or for loss of profit, revenue, data or goodwill, arising from use of
            this website. Our total aggregate liability arising from your use of this website is limited
            to CAD $100.
          </p>
          <p>
            Nothing in these terms excludes or limits liability that cannot lawfully be excluded,
            including liability for fraud or fraudulent misrepresentation, or any right you have under
            applicable Canadian consumer protection legislation. This clause applies to the website
            only; liability under an engagement is governed by that engagement&rsquo;s agreement.
          </p>

          <h2>10. Privacy</h2>
          <p>
            Our handling of personal information is set out in our{" "}
            <a href="/legal/privacy">privacy notice</a>, which forms part of these terms.
          </p>

          <h2>11. Governing law</h2>
          <p>
            These terms are governed by the laws of the Province of {company.regionName} and the federal
            laws of Canada applicable in it. The courts of {company.regionName} have exclusive
            jurisdiction, except that nothing here prevents a consumer from bringing proceedings in
            their own province where legislation gives them that right.
          </p>

          <h2>12. Changes</h2>
          <p>
            We may update these terms. The version published here at the time you use the site is the
            version that applies.
          </p>

          <h2>13. Contact</h2>
          <p>
            {company.legalName}
            <br />
            {company.addressLine ? `${company.addressLine}, ` : ""}
            {company.city}, {company.region} {company.postalCode}, {company.country}
            <br />
            <a href={`mailto:${company.email}`}>{company.email}</a> ·{" "}
            <a href={`tel:${company.phoneHref}`}>{company.phone}</a>
          </p>

          <hr />
          <div className="card" style={{ borderLeft: "4px solid var(--warn)" }}>
            <p style={{ marginBottom: 0, fontSize: ".9rem" }}>
              <strong style={{ color: "var(--text)" }}>Note for the site owner:</strong> these terms are
              a careful, conventional starting point but have not been reviewed by a Canadian lawyer.
              Have counsel review them — particularly the limitation of liability and governing law
              clauses — before relying on them commercially. The cost of that review is small next to
              the cost of an unenforceable limitation clause.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
