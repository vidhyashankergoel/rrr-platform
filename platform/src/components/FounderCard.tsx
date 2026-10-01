"use client";

/**
 * FOUNDER CARD
 *
 * The one place on the site where a buyer sees who they would actually be
 * dealing with, with a face and a way to reach them directly.
 *
 * THE PHOTO FALLS BACK RATHER THAN BREAKING. If `public/founder.jpg` is
 * missing the card renders initials instead of a broken-image icon. That is
 * not defensive programming for its own sake: the photo is the one asset here
 * that lives outside the repository's own build, so it is the one most likely
 * to be absent on a fresh clone or a deploy where it was never committed.
 *
 * CONTACT DETAILS ARE THE COMPANY'S, NOT A PERSONAL INBOX. The email and phone
 * below come from `company.ts`, which holds the public address. The founder's
 * personal address is deliberately not here and must never be — this page is
 * indexed, scraped within days, and a personal mailbox is not recoverable once
 * it is on a public company site.
 */

import { useState } from "react";
import { company } from "@/lib/company";

export interface Founder {
  name: string;
  role: string;
  location: string;
  bio: string;
  certs: readonly string[];
  /** Path under /public. Falls back to initials when absent. */
  photo?: string;
  linkedin: string;
}

export default function FounderCard({ person }: { person: Founder }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = Boolean(person.photo) && !photoFailed;

  const initials = person.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  return (
    <article className="founder card">
      <div className="founder__head">
        {showPhoto ? (
          // A plain <img>, not next/image: this is one small fixed-size portrait
          // and the optimiser's benefit here is rounding error against the cost
          // of a build-time failure when the file is not yet committed.
          <img
            className="founder__photo"
            src={person.photo}
            alt={`${person.name}, ${person.role}`}
            width={132}
            height={132}
            loading="lazy"
            decoding="async"
            onError={() => setPhotoFailed(true)}
          />
        ) : (
          <div className="founder__photo founder__photo--initials" aria-hidden="true">
            {initials}
          </div>
        )}

        <div className="founder__id">
          <h3 className="founder__name">{person.name}</h3>
          <p className="founder__role">{person.role}</p>
          <p className="founder__loc">{person.location}</p>
        </div>
      </div>

      <p className="founder__bio">{person.bio}</p>

      <div className="tags founder__certs">
        {person.certs.map((c) => (
          <span className="tag tag--accent" key={c}>
            {c}
          </span>
        ))}
      </div>

      <ul className="founder__contact">
        <li>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
            <path d="m3 7 9 6 9-6" />
          </svg>
          <a href={`mailto:${company.email}`}>{company.email}</a>
        </li>
        <li>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5L17 13l4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 3 5.2 2 2 0 0 1 5 3Z" />
          </svg>
          <a href={`tel:${company.phoneHref}`}>{company.phone}</a>
        </li>
        <li>
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM3 9h4v12H3V9Zm6 0h3.8v1.7h.05a4.2 4.2 0 0 1 3.75-2c4 0 4.4 2.6 4.4 6V21h-4v-5.3c0-1.3 0-2.9-1.8-2.9s-2.1 1.4-2.1 2.8V21H9V9Z" />
          </svg>
          <a href={person.linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn profile
          </a>
        </li>
      </ul>
    </article>
  );
}
