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
  const salt = process.env.ADMIN_TOKEN ?? "northpath-static-salt";
  const data = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}
