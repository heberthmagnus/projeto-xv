import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/** Shared, atomic fixed-window limit using database time across all instances. */
export async function isRateLimited(scope: string, limit: number, windowMs: number) {
  if (!Number.isSafeInteger(limit) || limit < 1 || !Number.isSafeInteger(windowMs) || windowMs < 1) throw new Error("Limite inválido.");
  const requestHeaders = await headers();
  const address = requestHeaders.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    || requestHeaders.get("x-real-ip")?.trim()
    || (process.env.NODE_ENV === "production" ? "unknown" : requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "local");
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") throw new Error("Limitação de acesso não configurada.");
  const key = createHmac("sha256", secret || "xv-dev-secret").update(`${scope}:${address}`).digest("hex");
  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "RequestRateLimit" ("key", "count", "resetAt")
    VALUES (${key}, 1, (NOW() + ${windowMs} * INTERVAL '1 millisecond'))
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RequestRateLimit"."resetAt" <= NOW() THEN 1 ELSE "RequestRateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RequestRateLimit"."resetAt" <= NOW() THEN NOW() + ${windowMs} * INTERVAL '1 millisecond' ELSE "RequestRateLimit"."resetAt" END
    RETURNING "count"`;
  return rows[0].count > limit;
}
