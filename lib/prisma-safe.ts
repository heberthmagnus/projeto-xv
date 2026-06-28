import { Prisma } from "@prisma/client";

export const DATABASE_UNAVAILABLE_MESSAGE =
  "Sistema temporariamente indisponível. Tente novamente em alguns instantes.";

export class DatabaseConnectionUnavailableError extends Error {
  constructor(message = DATABASE_UNAVAILABLE_MESSAGE) {
    super(message);
    this.name = "DatabaseConnectionUnavailableError";
  }
}

export function isPrismaConnectionError(error: unknown) {
  if (error instanceof DatabaseConnectionUnavailableError) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P1001";
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return error.message.includes("Can't reach database server");
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P1001"
  ) {
    return true;
  }

  if (error instanceof Error) {
    return error.message.includes("Can't reach database server");
  }

  return false;
}

export function logPrismaError(context: string, error: unknown) {
  console.error(`[prisma:${context}]`, error);
}

export async function executePrisma<T>(
  operation: () => Promise<T>,
  context: string,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logPrismaError(context, error);

    if (isPrismaConnectionError(error)) {
      throw new DatabaseConnectionUnavailableError();
    }

    throw error;
  }
}

export async function executePrismaWithFallback<T>(
  operation: () => Promise<T>,
  fallback: T,
  context: string,
): Promise<{
  data: T;
  databaseUnavailable: boolean;
}> {
  try {
    return {
      data: await operation(),
      databaseUnavailable: false,
    };
  } catch (error) {
    logPrismaError(context, error);

    if (isPrismaConnectionError(error)) {
      return {
        data: fallback,
        databaseUnavailable: true,
      };
    }

    throw error;
  }
}

export function getFriendlyDatabaseErrorMessage(error: unknown) {
  if (isPrismaConnectionError(error)) {
    return DATABASE_UNAVAILABLE_MESSAGE;
  }

  return null;
}
