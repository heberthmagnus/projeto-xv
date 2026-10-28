import "server-only";
import { getToken } from "@vercel/connect";

export async function getGmailToken(): Promise<string> {
  const connector = process.env.GMAIL_CONNECTOR;
  const subject = process.env.GMAIL_CONNECT_SUBJECT_ID;
  if (!connector || !subject) throw new Error("Conexão de e-mail indisponível.");
  return getToken(connector, { subject: { type: "user", id: subject }, scopes: ["https://www.googleapis.com/auth/gmail.send"] });
}
