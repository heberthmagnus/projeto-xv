import { PrismaClient } from "@prisma/client";

// Database access is intentionally centralized through server-only Prisma code.
// Supabase RLS can remain disabled while anon/client database access is not used;
// enable RLS only with matching policies before exposing direct client queries.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
