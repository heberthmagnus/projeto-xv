import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/auth-session";
import { hasAdministrativeRole, hasPermission, type Permission } from "@/lib/permissions";
import { createSupabaseAuthClient } from "@/lib/supabase/server-auth";
import { prisma } from "@/lib/prisma";
import {
  executePrisma,
  isPrismaConnectionError,
} from "@/lib/prisma-safe";
const SESSION_DURATION_SECONDS = 60 * 60 * 12;

type SessionPayload = {
  userId: string;
  expiresAt: number;
  supabaseAccessToken?: string;
};

export class AuthDatabaseUnavailableError extends Error {
  constructor() {
    super("Banco de dados indisponível no momento.");
    this.name = "AuthDatabaseUnavailableError";
  }
}

export class AuthConfigurationError extends Error {
  constructor() {
    super("A autenticação não está configurada corretamente.");
    this.name = "AuthConfigurationError";
  }
}

function getSessionSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new AuthConfigurationError();
  }

  return "xv-dev-secret";
}

function encodePayload(payload: SessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(value: string) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as SessionPayload;
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret())
    .update(value)
    .digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function verifyScryptPassword(storedPassword: string, password: string) {
  const [algorithm, salt, expectedKey] = storedPassword.split("$");

  if (algorithm !== "scrypt" || !salt || !expectedKey) {
    return false;
  }

  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return safeEqual(derivedKey, expectedKey);
}

function isBcryptHash(password: string) {
  return /^\$2[aby]\$\d{2}\$/.test(password);
}

function normalizeBcryptHash(password: string) {
  if (password.startsWith("$2y$")) {
    return `$2b$${password.slice(4)}`;
  }

  return password;
}

export async function createAdminSession(userId: string, supabaseAccessToken?: string) {
  const expiresAt = Date.now() + SESSION_DURATION_SECONDS * 1000;
  const payload = encodePayload({ userId, expiresAt, supabaseAccessToken });
  const signature = sign(payload);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, `${payload}.${signature}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function readAdminSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;

  if (!raw) {
    return null;
  }

  const [payload, signature] = raw.split(".");

  if (!payload || !signature || !safeEqual(sign(payload), signature)) {
    return null;
  }

  try {
    const session = decodePayload(payload);

    if (!session.userId || session.expiresAt <= Date.now()) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function getAuthenticatedUser() {
  const session = await readAdminSession();

  if (!session) {
    return null;
  }

  try {
    const user = await executePrisma(
      () =>
        prisma.user.findUnique({
          where: { id: session.userId },
          select: { id: true, email: true, role: true, supabaseAuthId: true, roles: { select: { role: true } }, member: { select: { id: true, status: true } } },
        }),
      "auth:get-authenticated-admin",
    );

    if (user?.supabaseAuthId) {
      if (!session.supabaseAccessToken) return null;
      const { data, error } = await createSupabaseAuthClient().auth.getUser(session.supabaseAccessToken);
      if (error || data.user?.id !== user.supabaseAuthId || !data.user.email_confirmed_at) return null;
    }
    return user;
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      throw new AuthDatabaseUnavailableError();
    }

    throw error;
  }
}

export function userHasPermission(user: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>>, permission: Permission) {
  // Explicitly migrated users use their assigned roles; legacy-only users retain access.
  return (user.roles.length === 0 && isAdminRole(user.role)) || hasPermission(user.roles.map((item) => item.role), permission);
}

export function canAccessAdministration(user: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>>) {
  return (user.roles.length === 0 && isAdminRole(user.role)) || hasAdministrativeRole(user.roles.map((item) => item.role));
}

export function isActiveMember(user: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>>) {
  return user.roles.some((item) => item.role === "ASSOCIADO") && user.member?.status === "ATIVO";
}

export async function getAuthenticatedAdmin() {
  const user = await getAuthenticatedUser();
  return user && canAccessAdministration(user) ? user : null;
}

export async function requireAdministrativeAccess() {
  const user = await getAuthenticatedAdmin();
  if (!user) redirect("/login");
  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");
  if (!userHasPermission(user, permission)) throw new Error("Acesso não autorizado.");
  return user;
}

export async function requireSportsAdmin() {
  return requirePermission("sports.manage");
}

export async function requireActiveMember() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");
  if (!isActiveMember(user)) throw new Error("Acesso disponível apenas para associados ativos.");
  return user;
}

export async function requireAdmin() {
  return requirePermission("permission.manage");
}

export async function verifyStoredPassword(
  storedPassword: string,
  password: string,
) {
  const normalizedPassword = storedPassword.trim();

  if (normalizedPassword.startsWith("scrypt$")) {
    return verifyScryptPassword(normalizedPassword, password);
  }

  if (isBcryptHash(normalizedPassword)) {
    return bcrypt.compare(password, normalizeBcryptHash(normalizedPassword));
  }

  // Passwords stored without a recognized one-way hash are deliberately
  // rejected. Legacy plaintext values are migrated separately before deploy.
  return false;
}

export function isAdminRole(role: string | null | undefined) {
  return role === "ADMIN" || role === "OWNER" || role === "SUPERADMIN";
}
