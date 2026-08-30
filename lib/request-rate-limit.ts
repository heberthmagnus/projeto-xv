import { headers } from "next/headers";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

declare global {
  var xvRateLimits: Map<string, RateLimitEntry> | undefined;
}

const rateLimits = globalThis.xvRateLimits ?? new Map<string, RateLimitEntry>();

if (process.env.NODE_ENV !== "production") {
  globalThis.xvRateLimits = rateLimits;
}

function getRequestFingerprint(requestHeaders: Headers) {
  const forwardedFor = requestHeaders.get("x-forwarded-for");

  return (
    forwardedFor?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * A small first-line defense for public Server Actions. Vercel/serverless
 * instances do not share memory, so this complements (rather than replaces)
 * an edge/WAF rate limit configured by the hosting platform.
 */
export async function isRateLimited(
  scope: string,
  limit: number,
  windowMs: number,
) {
  const requestHeaders = await headers();
  const key = `${scope}:${getRequestFingerprint(requestHeaders)}`;
  const now = Date.now();
  const current = rateLimits.get(key);

  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  current.count += 1;
  rateLimits.set(key, current);

  return current.count > limit;
}
