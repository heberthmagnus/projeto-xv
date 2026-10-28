import { Prisma } from "@prisma/client";
import { verifyAuthEmailHook } from "@/lib/supabase/auth-email-hook";
import { getGmailToken } from "@/lib/gmail-token";
import { sendGmailMessage } from "@/lib/gmail-mail";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function readBoundedBody(request: Request): Promise<string> {
  if (!request.body) throw new Error("Corpo ausente.");
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0;
  let body = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 32768) throw new Error("Corpo excede o limite.");
      body += decoder.decode(value, { stream: true });
    }
    return body + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: Request) {
  if (process.env.AUTH_EMAIL_HOOK_ENABLED !== "true") {
    console.error("[auth-email-hook] disabled");
    return Response.json({ error: "Serviço indisponível." }, { status: 503 });
  }
  const secret = process.env.SUPABASE_AUTH_HOOK_SECRET;
  const appOrigin = process.env.AUTH_APP_ORIGIN;
  const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!secret || !appOrigin || !supabaseOrigin) {
    console.error("[auth-email-hook] required configuration unavailable");
    return Response.json({ error: "Serviço indisponível." }, { status: 503 });
  }
  const length = Number(request.headers.get("content-length") || "0");
  if (!Number.isFinite(length) || length > 32768) {
    console.error("[auth-email-hook] rejected oversized request");
    return Response.json({ error: "Solicitação inválida." }, { status: 400 });
  }
  let message;
  try {
    message = verifyAuthEmailHook({ payload: await readBoundedBody(request), headers: Object.fromEntries(request.headers), secrets: secret, appOrigin, supabaseOrigin });
    if (!/^[A-Za-z0-9_-]{1,200}$/.test(message.webhookId)) throw new Error("ID inválido.");
  } catch {
    // Keep request contents and signature material out of logs.
    console.error("[auth-email-hook] signature or payload validation failed");
    return Response.json({ error: "Solicitação inválida." }, { status: 401 });
  }
  try {
    const previous = await prisma.authEmailDelivery.findUnique({ where: { webhookId: message.webhookId }, select: { status: true } });
    if (previous) return previous.status === "SENT" ? Response.json({}) : Response.json({ error: "Entrega em análise." }, { status: 503 });
  } catch {
    console.error("[auth-email-hook] idempotency lookup failed");
    return Response.json({ error: "Serviço indisponível." }, { status: 503 });
  }
  let accessToken: string;
  try {
    // Credential failures happen before the delivery is claimed and may be retried safely.
    accessToken = await getGmailToken();
  } catch {
    console.error("[auth-email-hook] Gmail authorization unavailable");
    return Response.json({ error: "Serviço indisponível." }, { status: 503 });
  }
  try {
    await prisma.authEmailDelivery.create({ data: { webhookId: message.webhookId, status: "PROCESSING" } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await prisma.authEmailDelivery.findUnique({ where: { webhookId: message.webhookId }, select: { status: true } });
      return existing?.status === "SENT" ? Response.json({}) : Response.json({ error: "Entrega em análise." }, { status: 503 });
    }
    console.error("[auth-email-hook] delivery claim failed");
    return Response.json({ error: "Serviço indisponível." }, { status: 503 });
  }
  try {
    await sendGmailMessage({ accessToken, recipient: message.recipient, subject: message.subject, text: message.text });
    await prisma.authEmailDelivery.update({ where: { webhookId: message.webhookId }, data: { status: "SENT" } });
    return Response.json({});
  } catch {
    // Gmail may have accepted a timed-out request. Never resend this ID automatically.
    console.error("[auth-email-hook] Gmail delivery outcome unknown");
    await prisma.authEmailDelivery.updateMany({ where: { webhookId: message.webhookId, status: "PROCESSING" }, data: { status: "UNKNOWN" } }).catch(() => {});
    return Response.json({ error: "Entrega em análise." }, { status: 503 });
  }
}
