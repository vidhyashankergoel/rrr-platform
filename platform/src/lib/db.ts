import { PrismaClient } from "@prisma/client";

/**
 * A single Prisma client across hot reloads in development. Without this,
 * Next.js opens a new connection pool on every recompile and exhausts the
 * database within a few minutes of editing.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

/** Write an audit row. Never throws — auditing must not be able to break a request. */
export async function audit(input: {
  actor: string;
  action: string;
  subject?: string;
  detail?: string;
  leadId?: string;
}) {
  try {
    await db.auditEvent.create({ data: input });
  } catch {
    // Intentionally swallowed.
  }
}

/**
 * Hash an IP address before storing it. PIPEDA Principle 4 (Limiting
 * Collection) — we need proof that consent came from a real session, not the
 * address itself, so we keep a one-way digest.
 */
export async function hashIp(ip: string | null): Promise<string | null> {
  if (!ip) return null;

  // The salt must be secret. An IP address has only ~4 billion possibilities,
  // so a publicly-known salt makes the digest trivially reversible by anyone
  // who can read the database — the hash would then be storing the address
  // rather than protecting it.
  //
  // This repository is public, so a hard-coded fallback salt is a *published*
  // salt. Rather than pretend otherwise, fail closed: with no secret
  // configured we record that consent came from an unidentifiable session
  // instead of storing a reversible digest. Losing a weak signal is better
  // than storing personal data we told people we were protecting.
  const configured = process.env.CONSENT_SALT?.trim() || process.env.ADMIN_TOKEN?.trim();
  if (!configured || configured.length < 16) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[privacy] No CONSENT_SALT configured — consent IP digests are not being stored. " +
          "Set CONSENT_SALT to keep CASL s.13 proof-of-consent evidence.",
      );
    }
    return null;
  }
  const salt = configured;
  const data = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}
