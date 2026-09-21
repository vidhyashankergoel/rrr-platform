import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header, Footer } from "@/components/Chrome";
import Assistant from "@/components/Assistant";
import { ScrollProgress, BackToTop } from "@/components/Enhancements";
import { company } from "@/lib/company";

export const metadata: Metadata = {
  metadataBase: new URL(company.siteUrl),
  title: {
    default: `${company.shortName} — Cloud, Kubernetes & Platform Engineering | Toronto`,
    template: `%s | ${company.shortName}`,
  },
  description:
    "Toronto-based cloud and platform engineering. AWS, Azure and GCP builds, on-premises migration, Kubernetes, Terraform, CI/CD, observability and database migration. Fixed-price engagements with published CAD pricing.",
  applicationName: company.shortName,
  authors: [{ name: company.legalName }],
  openGraph: {
    type: "website",
    locale: "en_CA",
    siteName: company.shortName,
    title: `${company.shortName} — Cloud, Kubernetes & Platform Engineering`,
    description:
      "We build, migrate and operate cloud platforms for Canadian teams. Fixed-price engagements with published CAD pricing.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#05121f",
  width: "device-width",
  initialScale: 1,
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: company.legalName,
  alternateName: company.shortName,
  description: "Cloud, Kubernetes and platform engineering consultancy based in Toronto, Ontario.",
  url: company.siteUrl,
  email: company.email,
  telephone: company.phone,
  areaServed: ["CA", "US"],
  address: {
    "@type": "PostalAddress",
    addressLocality: company.city,
    addressRegion: company.region,
    addressCountry: "CA",
  },
  priceRange: "$$$",
  sameAs: [company.linkedin, company.githubOrg, company.dockerHub].filter(Boolean),
  knowsAbout: [
    "Amazon Web Services",
    "Microsoft Azure",
    "Google Cloud Platform",
    "Kubernetes",
    "Terraform",
    "Ansible",
    "ArgoCD",
    "Prometheus",
    "Grafana",
    "PostgreSQL",
    "Oracle Database",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-CA" data-theme="light" suppressHydrationWarning>
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%2305121f'/%3E%3Cpath d='M7 22V10h4.6a3 3 0 0 1 0 6H7l5 6' stroke='%2316b8a6' stroke-width='2.4' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M17 22V10h3.4a2.6 2.6 0 0 1 0 5.2H17l4.2 6.8' stroke='%23f0a830' stroke-width='2.2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to main content
        </a>
        <ScrollProgress />
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <BackToTop />
        <Assistant />
      </body>
    </html>
  );
}
