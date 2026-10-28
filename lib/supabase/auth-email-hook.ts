import { Webhook } from "standardwebhooks";

export type AuthEmailMessage = { recipient: string; subject: string; text: string; webhookId: string };

/** Verify the exact raw payload and construct only supported auth messages. */
export function verifyAuthEmailHook(input: {
  payload: string;
  headers: Record<string, string>;
  secrets: string;
  supabaseOrigin: string;
  appOrigin: string;
}): AuthEmailMessage {
  if (Buffer.byteLength(input.payload, "utf8") > 32768) throw new Error("Solicitação inválida.");
  const secrets = input.secrets.split("|").filter(Boolean);
  if (secrets.length === 0) throw new Error("Configuração indisponível.");
  let verified: unknown;
  for (const secret of secrets) {
    try {
      if (!secret.startsWith("v1,whsec_")) continue;
      verified = new Webhook(secret.slice(3)).verify(input.payload, input.headers);
      break;
    } catch { /* Try the previous secret during rotation. */ }
  }
  if (!verified || typeof verified !== "object") throw new Error("Solicitação inválida.");
  const event = verified as { user?: { email?: unknown }; email_data?: { token_hash?: unknown; email_action_type?: unknown; redirect_to?: unknown } };
  const email = event.user?.email;
  const hash = event.email_data?.token_hash;
  const action = event.email_data?.email_action_type;
  const redirect = event.email_data?.redirect_to;
  // GoTrue documents this value as an alphanumeric token hash. Do not restrict it
  // to hexadecimal: legitimate confirmation tokens can be shorter than 32 chars.
  // The URL-safe constraint still prevents an injected query-string fragment.
  if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof hash !== "string" || !/^[A-Za-z0-9_-]{16,128}$/.test(hash) || (action !== "signup" && action !== "recovery") || typeof redirect !== "string") throw new Error("Solicitação inválida.");
  const app = new URL(input.appOrigin);
  const supabase = new URL(input.supabaseOrigin);
  const destination = new URL(redirect);
  const expectedPath = action === "signup" ? "/auth/confirmar" : "/reset-password";
  if (app.protocol !== "https:" || supabase.protocol !== "https:" || app.origin !== input.appOrigin || supabase.origin !== input.supabaseOrigin || destination.username || destination.password || destination.origin !== app.origin || destination.pathname !== expectedPath || destination.search || destination.hash) throw new Error("Destino inválido.");
  const link = new URL("/auth/v1/verify", supabase);
  link.search = new URLSearchParams({ token: hash, type: action, redirect_to: destination.href }).toString();
  const subject = action === "signup" ? "Confirme seu e-mail — Clube XV" : "Recuperação de senha — Clube XV";
  const text = action === "signup" ? `Confirme seu e-mail pelo link abaixo:\n\n${link.href}\n\nSe você não solicitou, ignore esta mensagem.` : `Para redefinir sua senha, acesse:\n\n${link.href}\n\nSe você não solicitou, ignore esta mensagem.`;
  const webhookId = input.headers["webhook-id"];
  if (!webhookId) throw new Error("Solicitação inválida.");
  return { recipient: email, subject, text, webhookId };
}
