import type { Metadata } from "next";
import { company } from "@/lib/company";
import { PageHead } from "@/components/Bits";

export const metadata: Metadata = {
  title: "Accessibility",
  description:
    "Our accessibility commitment and conformance status under the AODA and WCAG 2.1 Level AA, and how to request content in an accessible format.",
};

export default function AccessibilityPage() {
  return (
    <>
      <PageHead
        crumb="Accessibility"
        title="Accessibility"
        lede="What we have built, what we have tested, and what we know is still imperfect."
      />

      <section className="section">
        <div className="wrap-tight">
          <h2>Our commitment</h2>
          <p>
            {company.legalName} is committed to providing services in a way that respects the dignity
            and independence of people with disabilities, consistent with the{" "}
            <em>Accessibility for Ontarians with Disabilities Act, 2005</em> (AODA) and its Integrated
            Accessibility Standards Regulation.
          </p>
          <p>
            The Regulation requires web content to conform to WCAG 2.0 Level AA. We target{" "}
            <strong>WCAG 2.1 Level AA</strong>, which is the later standard and includes additional
            criteria for mobile, low vision and cognitive accessibility.
          </p>

          <h2>Conformance status</h2>
          <p>
            <strong>Partially conformant with WCAG 2.1 Level AA.</strong> &ldquo;Partially
            conformant&rdquo; means most of the site meets the standard, and we are naming the parts we
            have not yet fully verified rather than claiming more than we have tested.
          </p>

          <h3>What is in place</h3>
          <ul className="check-list">
            <li><strong>Keyboard access.</strong> Every interactive element is reachable and operable by keyboard, with a visible focus indicator. No keyboard traps.</li>
            <li><strong>Skip link.</strong> A &ldquo;Skip to main content&rdquo; link is the first focusable element on every page.</li>
            <li><strong>Colour contrast.</strong> Body text meets or exceeds 4.5:1, and large text 3:1, in both light and dark themes.</li>
            <li><strong>Not colour alone.</strong> No information is conveyed by colour by itself.</li>
            <li><strong>Text resize.</strong> Content reflows and remains usable at 200% zoom, and down to 320px width, without horizontal scrolling.</li>
            <li><strong>Reduced motion.</strong> All animation is disabled when the operating system requests reduced motion. The terminal animation and counters render immediately in their final state.</li>
            <li><strong>Semantic structure.</strong> Proper landmarks, a logical heading order, and real lists and tables with captions.</li>
            <li><strong>Forms.</strong> Every field has a visible, programmatically associated label. Errors are described in text, not by colour, and are announced.</li>
            <li><strong>The assistant.</strong> The chat panel is a labelled dialog with an aria-live log, closes on Escape, and returns focus to the launcher.</li>
            <li><strong>Theme.</strong> Light and dark are both fully supported, following your system preference by default.</li>
          </ul>

          <h3>Known limitations, stated honestly</h3>
          <ul>
            <li>
              <strong>Assistive technology testing is not yet complete.</strong> The site has been built
              to standard and checked with automated tooling and keyboard navigation, but has not yet
              been tested end-to-end with JAWS, NVDA and VoiceOver. That testing is scheduled.
            </li>
            <li>
              <strong>Wide data tables.</strong> The pricing and rate tables scroll horizontally inside
              their own container on narrow screens. They remain keyboard accessible and properly
              marked up, but the scroll is not ideal. The same information is available in the service
              cards above each table.
            </li>
            <li>
              <strong>The assistant&rsquo;s replies are generated.</strong> Responses are structured and
              announced, but their length and structure vary, which can be harder to navigate with a
              screen reader than fixed content. Everything the assistant can tell you also exists as a
              page you can read directly.
            </li>
            <li>
              <strong>No French version yet.</strong> The site is English only. If you need information
              in French, contact us and we will provide it.
            </li>
          </ul>

          <h2>Accessible formats and communication support</h2>
          <p>
            On request we will provide any information on this site in an accessible format or with
            communication support, at no additional cost, in a timeframe that takes your needs into
            account. That includes large print, plain text, or simply a phone call with someone who will
            read and explain it.
          </p>

          <h2>Feedback</h2>
          <p>
            If you encounter a barrier on this site, please tell us. We treat accessibility feedback as
            a defect report, not a complaint, and we will tell you what we are going to do about it.
          </p>
          <div className="card" style={{ background: "var(--bg-alt)", border: 0 }}>
            <p style={{ marginBottom: ".4rem" }}>
              <strong style={{ color: "var(--text)" }}>Email:</strong>{" "}
              <a href={`mailto:${company.email}`}>{company.email}</a>
            </p>
            <p style={{ marginBottom: ".4rem" }}>
              <strong style={{ color: "var(--text)" }}>Phone:</strong>{" "}
              <a href={`tel:${company.phoneHref}`}>{company.phone}</a>
            </p>
            <p style={{ marginBottom: 0 }}>
              <strong style={{ color: "var(--text)" }}>Response time:</strong> we acknowledge within 2
              business days and tell you our plan within 10.
            </p>
          </div>

          <h2>Accessibility in the work we deliver</h2>
          <p>
            Where we build interfaces for clients — dashboards, internal tools, status pages — we build
            them to WCAG 2.1 AA as a default rather than as an extra line item. If a client asks us to
            drop it to save time, we will say why that is a false economy and, for an Ontario
            organization of any size, a compliance exposure.
          </p>

          <hr />
          <p style={{ fontSize: ".85rem", color: "var(--text-3)" }}>
            This statement was prepared on 18 September 2026 using the W3C Web Accessibility Initiative
            format, and reflects self-assessment plus automated testing. It will be updated when the
            assistive technology audit is complete.
          </p>
        </div>
      </section>
    </>
  );
}
