import "server-only";

/** The connector and subject are server configuration, never supplied by the webhook. */
export async function getMicrosoftMailToken(): Promise<string> {
  const connector = process.env.MICROSOFT_MAIL_CONNECTOR;
  const subject = process.env.MICROSOFT_MAIL_SUBJECT_ID;
  const oidc = process.env.VERCEL_OIDC_TOKEN;
  if (!connector || !subject || !oidc) throw new Error("Conexão de e-mail indisponível.");
  const response = await fetch(`https://api.vercel.com/v1/connect/token/${encodeURIComponent(connector)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${oidc}`, "Content-Type": "application/json" },
    body: JSON.stringify({ subject: { type: "user", id: subject }, scopes: ["Mail.Send"] }),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Conexão de e-mail indisponível.");
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("token" in result) || typeof result.token !== "string" || !result.token) throw new Error("Conexão de e-mail indisponível.");
  return result.token;
}
