import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
const SESSION_DURATION_SECONDS = 60 * 60 * 12;

type SessionPayload = {
  userId: string;
  expiresAt: number;
};

function getSessionSecret() {
  return (
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.DATABASE_URL ||
    "xv-dev-secret"
  );
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

export async function createAdminSession(userId: string) {
  const expiresAt = Date.now() + SESSION_DURATION_SECONDS * 1000;
  const payload = encodePayload({ userId, expiresAt });
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

export async function getAuthenticatedAdmin() {
  const session = await readAdminSession();

  if (!session) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true },
  });
}

export async function requireAdmin() {
  const user = await getAuthenticatedAdmin();

  if (!user) {
    redirect("/login");
  }

  return user;
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

  return safeEqual(normalizedPassword, password);
}
