import { PrismaClient } from "@prisma/client";

// Database access is intentionally centralized through server-only Prisma code.
// Supabase RLS can remain disabled while anon/client database access is not used;
// enable RLS only with matching policies before exposing direct client queries.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return undefined;

  const url = new URL(databaseUrl);
  // O pooler compartilhado do Supabase é usado por ambientes que podem abrir
  // diversas instâncias do Next. Uma conexão por instância evita esgotar o pool.
  if (url.hostname.endsWith(".pooler.supabase.com")) {
    url.searchParams.set("connection_limit", "1");
    url.searchParams.set("pool_timeout", "15");
  }
  return url.toString();
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: { db: { url: getDatabaseUrl() } },
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
