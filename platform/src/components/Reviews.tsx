import Link from "next/link";
import { testimonials, verifiable } from "@/lib/testimonials";

/**
 * REVIEWS
 *
 * Renders real testimonials once there are any. Until then it renders the
 * things a prospect can check for themselves, and says plainly that there are
 * no testimonials yet.
 *
 * Saying so is the point. A new firm with a wall of glowing quotes invites
 * exactly one question — where did those come from — and a buyer who starts
 * asking that question about the quotes carries on asking it about the case
 * studies and the prices. Admitting the gap costs a paragraph and buys the
 * credibility of everything else on the page.
 */
export default function Reviews() {
  if (testimonials.length > 0) {
    return (
      <div className="grid grid-2">
        {testimonials.map((t) => (
          <figure className="quote card" key={`${t.organization}-${t.quote.slice(0, 24)}`}>
            <svg className="quote__mark" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M9.5 5C6.5 6.6 4.8 9.3 4.8 12.6c0 .5 0 1 .1 1.4a3.6 3.6 0 1 0 3.4-2.6c.2-1.7 1.2-3.1 2.9-4.1L9.5 5Zm9 0c-3 1.6-4.7 4.3-4.7 7.6 0 .5 0 1 .1 1.4a3.6 3.6 0 1 0 3.4-2.6c.2-1.7 1.2-3.1 2.9-4.1L18.5 5Z" />
            </svg>
            <blockquote>{t.quote}</blockquote>
            <figcaption>
              {t.name && <span className="quote__name">{t.name}</span>}
              <span className="quote__role">
                {t.role}
                {t.organization && ` · ${t.organization}`}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    );
  }

  return (
    <>
      <p className="reviews__none">
        <strong>We have no testimonials yet.</strong> We started this year, and we would rather say
        so than publish quotes you have no way to check. Here is what you can verify instead —
        today, without speaking to anyone.
      </p>

      <div className="grid grid-3 reviews__proof">
        {verifiable.map((v) => {
          const external = v.href.startsWith("http");
          return (
            <article className="card card--hover proof-card" key={v.label}>
              <h3 className="proof-card__h">{v.label}</h3>
              <p className="proof-card__p">{v.detail}</p>
              {external ? (
                <a className="proof-card__cta" href={v.href} target="_blank" rel="noopener noreferrer">
                  {v.cta}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 17 17 7M9 7h8v8" />
                  </svg>
                </a>
              ) : (
                <Link className="proof-card__cta" href={v.href}>
                  {v.cta}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
