"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { company } from "@/lib/company";
import { Mark, Wordmark } from "@/components/Logo";
import BookCallButton from "./BookCall";

const NAV = [
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/work", label: "Our work" },
  { href: "/security", label: "Security" },
  { href: "/trust", label: "Why trust us" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = (() => {
      try {
        return localStorage.getItem("np-theme");
      } catch {
        return null;
      }
    })();
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = (stored as "light" | "dark" | null) ?? (prefersDark ? "dark" : "light");
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("np-theme", next);
    } catch {
      /* private browsing */
    }
  };

  return (
    <header className={`site-header${stuck ? " is-stuck" : ""}`}>
      <nav className="nav wrap" aria-label="Primary">
        <Link className="brand" href="/">
          <Mark size={28} />
          <Wordmark />
        </Link>

        <ul className={`nav__links${open ? " is-open" : ""}`} id="navLinks">
          {NAV.map((n) => (
            <li key={n.href}>
              <Link href={n.href} aria-current={pathname === n.href ? "page" : undefined}>
                {n.label}
              </Link>
            </li>
          ))}
          <li className="nav__cta" style={{ marginLeft: ".6rem" }}>
            <BookCallButton className="btn btn--primary btn--sm">Book a free call</BookCallButton>
          </li>
        </ul>

        <div className="nav__actions">
          <button
            className="icon-btn"
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            {theme === "dark" ? (
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="4.2" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            )}
          </button>
          <button
            className="icon-btn nav__toggle"
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
            aria-controls="navLinks"
          >
            <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <Link className="brand" href="/" style={{ marginBottom: "1rem" }}>
              <Mark size={28} ground="#05121F" />
              <Wordmark onDark />
            </Link>
            <p style={{ fontSize: ".88rem", maxWidth: "34ch" }}>
              Cloud, Kubernetes and platform engineering for Canadian teams. Incorporated in Ontario,
              Canada.
            </p>
            <div className="social" style={{ marginTop: "1.25rem" }}>
              <a href={company.linkedin} aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5M3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.82-2.05 3.75-2.05C20.4 8.65 21 10.9 21 14v7h-4v-6.2c0-1.5 0-3.4-2.1-3.4s-2.4 1.6-2.4 3.3V21H9z" /></svg>
              </a>
              <a href={company.githubOrg} aria-label="GitHub" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.6 2 12.2c0 4.5 2.9 8.3 6.8 9.7.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.4-3.4-1.4-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.8-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.3 9.3 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.8 1 1.7 1 2.8 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5 3.9-1.4 6.8-5.2 6.8-9.7C22 6.6 17.5 2 12 2" /></svg>
              </a>
              <a href={company.dockerHub} aria-label="Docker Hub" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.8 9.9c-.5-.4-1.7-.5-2.6-.3-.1-.9-.6-1.6-1.4-2.3l-.5-.3-.3.5c-.4.6-.6 1.5-.5 2.3.1.3.2.8.5 1.2-.3.1-.8.3-1.5.3H2.3l-.1.4c-.2 1.3 0 2.7.6 3.9.7 1.4 1.8 2.4 3.2 2.9 1 .4 2.2.6 3.4.6 1 0 1.9-.1 2.8-.3 1.2-.2 2.3-.7 3.3-1.3 1.5-1 2.7-2.5 3.5-4.4h.3c1 0 1.9-.3 2.4-.9l.3-.4zM4.4 10.9h2v2h-2zm2.6 0h2v2H7zm2.6 0h2v2h-2zm2.6 0h2v2h-2zM7 8.3h2v2H7zm2.6 0h2v2h-2zm2.6 0h2v2h-2zm0-2.6h2v2h-2z" /></svg>
              </a>
            </div>
          </div>

          <div>
            <h5>Services</h5>
            <ul>
              <li><Link href="/services#landing-zone">Cloud landing zone</Link></li>
              <li><Link href="/services#migration">Cloud migration</Link></li>
              <li><Link href="/services#k8s-platform">Kubernetes platform</Link></li>
              <li><Link href="/services#iac">Terraform &amp; Ansible</Link></li>
              <li><Link href="/services#cicd">CI/CD pipelines</Link></li>
              <li><Link href="/services#observability">Observability</Link></li>
              <li><Link href="/services#databases">Databases</Link></li>
              <li><Link href="/services#security">Security &amp; compliance</Link></li>
            </ul>
          </div>

          <div>
            <h5>Company</h5>
            <ul>
              <li><Link href="/story">Our story</Link></li>
              <li><Link href="/about">About us</Link></li>
              <li><Link href="/trust">Why trust us</Link></li>
              <li><Link href="/security">Security</Link></li>
              <li><Link href="/work">Case studies</Link></li>
              <li><Link href="/pricing">Pricing</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h5>Contact</h5>
            <ul>
              <li><a href={`mailto:${company.email}`}>{company.email}</a></li>
              <li><a href={`tel:${company.phoneHref}`}>{company.phone}</a></li>
              <li>Toronto, Ontario, Canada</li>
              <li style={{ color: "#6b8299", fontSize: ".82rem", marginTop: ".8rem" }}>
                {company.hours}
                <br />
                {company.onCall}
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            &copy; {new Date().getFullYear()} {company.legalName}. All rights reserved.
            {company.businessNumber ? ` · BN ${company.businessNumber}` : ""}
          </div>
          <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
            <Link href="/legal/privacy">Privacy</Link>
            <Link href="/legal/terms">Terms</Link>
            <Link href="/legal/accessibility">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
