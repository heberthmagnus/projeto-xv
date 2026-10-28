"use server";

import { startAuthorization } from "@vercel/connect";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";

export async function iniciarAutorizacaoGmail() {
  await requirePermission("permission.manage");
  const connector = process.env.GMAIL_CONNECTOR;
  const subject = process.env.GMAIL_CONNECT_SUBJECT_ID;
  const origin = process.env.AUTH_APP_ORIGIN;
  if (!connector || !subject || !origin || new URL(origin).origin !== origin || new URL(origin).protocol !== "https:") throw new Error("A autorização de e-mail não está configurada.");
  const authorization = await startAuthorization(connector, {
    subject: { type: "user", id: subject },
    scopes: ["https://www.googleapis.com/auth/gmail.send"],
  }, { callbackUrl: `${origin}/admin/email-autorizacao/concluida`, prompt: "consent" });
  redirect(authorization.url);
}
