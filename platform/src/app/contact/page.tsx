import type { Metadata } from "next";
import { company } from "@/lib/company";
import { PageHead } from "@/components/Bits";
import ContactForm from "@/components/ContactForm";
import BookCallButton from "@/components/BookCall";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Book a free 30-minute scoping call, or send an enquiry. Toronto, Ontario — remote delivery across North America.",
};

export default function ContactPage() {
  return (
    <>
      <PageHead
        crumb="Contact"
        title="Tell us what’s broken"
        lede="Thirty minutes, no charge, no pitch deck. You will leave with an honest read on the size of the problem — including when the answer is that you don’t need a consultancy for this."
      />

      <section className="section">
        <div className="wrap split" style={{ alignItems: "start" }}>
          <div>
            <h2 style={{ fontSize: "var(--step-2)" }}>Send an enquiry</h2>
            <p>We reply within one business day. Everything marked required is required for us to be useful.</p>
            <Suspense fallback={<p>Loading form…</p>}>
              <ContactForm />
            </Suspense>
          </div>

          <div>
            {/* The faster of the two routes, so it comes first. The form
                below still exists for anyone who would rather write than
                commit to a time. */}
            <div className="card" style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "var(--step-1)" }}>Or pick a time</h3>
              <p style={{ fontSize: ".9rem" }}>
                Choose a 30-minute slot in the next two weeks. You get a calendar entry straight
                away; a person confirms it and sends the Google Meet or Teams link, usually within
                one business day.
              </p>
              <BookCallButton className="btn btn--primary">Pick a time</BookCallButton>
            </div>

            <div className="card">
              <h3 style={{ fontSize: "var(--step-1)" }}>Reach us directly</h3>

              <a className="contact-row" href={`mailto:${company.email}`}>
                <span className="contact-row__ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                </span>
                <span>
                  <strong>{company.email}</strong>
                  <span>Reply within one business day</span>
                </span>
              </a>

              <a className="contact-row" href={`tel:${company.phoneHref}`}>
                <span className="contact-row__ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5L16 12l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3 6.2 2 2 0 0 1 5 4z" />
                  </svg>
                </span>
                <span>
                  <strong>{company.phone}</strong>
                  <span>{company.hours}</span>
                </span>
              </a>

              <a className="contact-row" href={company.linkedin} target="_blank" rel="noopener noreferrer">
                <span className="contact-row__ico">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5M3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.82-2.05 3.75-2.05C20.4 8.65 21 10.9 21 14v7h-4v-6.2c0-1.5 0-3.4-2.1-3.4s-2.4 1.6-2.4 3.3V21H9z" />
                  </svg>
                </span>
                <span>
                  <strong>LinkedIn</strong>
                  <span>Connect or message directly</span>
                </span>
              </a>

              <a className="contact-row" href={company.githubOrg} target="_blank" rel="noopener noreferrer">
                <span className="contact-row__ico">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.5 2 2 6.6 2 12.2c0 4.5 2.9 8.3 6.8 9.7.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.4-3.4-1.4-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.8-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.3 9.3 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.8 1 1.7 1 2.8 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5 3.9-1.4 6.8-5.2 6.8-9.7C22 6.6 17.5 2 12 2" />
                  </svg>
                </span>
                <span>
                  <strong>GitHub</strong>
                  <span>Open-source work and modules</span>
                </span>
              </a>
            </div>

            <div className="card" style={{ marginTop: "1.5rem", background: "var(--bg-alt)", border: 0 }}>
              <h3 style={{ fontSize: "1rem" }}>What happens on the call</h3>
              <ul className="check-list">
                <li>You describe the problem. We ask questions rather than present slides.</li>
                <li>We tell you the likely shape and size — a fortnight, or a quarter.</li>
                <li>You get an indicative range before the call ends.</li>
                <li>If we are not the right fit, we say so and point you elsewhere.</li>
              </ul>
              <p style={{ fontSize: ".82rem", color: "var(--text-3)", marginBottom: 0 }}>
                No charge, no obligation, and no follow-up sequence unless you ask for one.
              </p>
            </div>

            <div className="card" style={{ marginTop: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem" }}>How we handle what you send</h3>
              <p style={{ fontSize: ".88rem" }}>
                We use it to respond to your enquiry and for nothing else. We do not sell it or share it
                with third parties for marketing. You can ask us to correct or delete it at any time, and
                we will respond within 30 days as PIPEDA requires.
              </p>
              <p style={{ fontSize: ".88rem", marginBottom: 0 }}>
                Full detail in our <a href="/legal/privacy">privacy notice</a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
