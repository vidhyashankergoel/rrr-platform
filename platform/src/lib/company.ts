/**
 * Company constants — the single place to change identity details.
 *
 * NAME NOTE: "RRR Solution Providers Inc." is structurally valid for Canadian
 * incorporation — it has a distinctive element (RRR), a descriptive element
 * (Solution Providers) and a legal element (Inc.). Before it can be reserved
 * you need a NUANS pre-search report (valid 90 days). See docs/INCORPORATION.md.
 */

export const company = {
  legalName: "RRR Solution Providers Inc.",
  shortName: "RRR Solution Providers",
  displayName: "RRR",
  tagline: "Cloud, Kubernetes and platform engineering for Canadian teams",

  // Fill in once Corporations Canada or ServiceOntario issues them. Both the
  // OBCA and the CBCA require the legal name on contracts, invoices and other
  // public business documents.
  corporationNumber: "", // e.g. "1234567-8"
  businessNumber: "", // CRA BN, e.g. "12345 6789 RC0001"
  gstHstNumber: "", // must appear on invoices once registered

  // The business address, separate from the founder's personal mailbox. Move
  // this to hello@<domain> once the domain is bought — a free-mail address on
  // an invoice is the single most common reason a procurement team asks "are
  // these people real?". See docs/EMAIL-SETUP.md §6.
  email: "rrrsolutionprovider@gmail.com",

  /**
   * Where enquiry and booking notifications are delivered.
   *
   * Deliberately separate from `email` above. `email` is the public address —
   * it appears in the footer, on the contact page, in every mailto link and in
   * the CASL identification block. This one is only ever a destination, never
   * shown to anyone.
   *
   * Read from MAIL_TO rather than hard-coded, so a personal inbox is never
   * committed to source. This repository is public: an address sitting in a
   * public file is harvested by scrapers within days, and the resulting spam
   * lands in the mailbox you rely on for actual enquiries.
   *
   * Set MAIL_TO in platform/.env.local, and in the host's environment
   * variables once deployed, to route notifications to wherever you really
   * read mail. The committed default is the public company address.
   */
  notifyEmail: process.env.MAIL_TO ?? "rrrsolutionprovider@gmail.com",
  phone: "+1 (437) 366-4623",
  phoneHref: "+14373664623",

  addressLine: "", // required by CASL in every commercial email
  city: "Toronto",
  region: "ON",
  regionName: "Ontario",
  postalCode: "",
  country: "Canada",

  linkedin: "https://www.linkedin.com/in/vidhyashankergoel/",
  linkedinCompany: "", // fill in after creating the company page
  githubOrg: "https://github.com/vidhyashankergoel",
  githubPersonal: "https://github.com/vidhya101",
  dockerHub: "https://hub.docker.com/u/vidhya101",

  hours: "Mon–Fri 09:00–18:00 ET",
  onCall: "24/7 on-call for retainer clients",

  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.rrrsolutionproviders.ca",

  // Standard commercial terms shown on quotes and invoices.
  paymentTermsDays: 30,
  lateInterestAnnualPct: 18,
} as const;

export const currencyFromDollars = (dollars: number) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(dollars);

export const currencyExact = (dollars: number) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);

/** Cents in, formatted dollars out. */
export const currency = (cents: number) => currencyExact(cents / 100);
