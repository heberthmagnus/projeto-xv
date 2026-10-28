/** Send a single message using an already obtained Microsoft Graph delegated token.
 * Token acquisition, storage, webhook authentication and retry handling are separate.
 */
export async function sendMicrosoftGraphMail(input: {
  accessToken: string;
  recipient: string;
  subject: string;
  text: string;
}, fetcher: typeof fetch = fetch): Promise<void> {
  if (!input.accessToken || input.recipient.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.recipient)) throw new Error("Dados de envio inválidos.");
  if (!input.subject.trim() || input.subject.length > 160 || /[\r\n]/.test(input.subject) || !input.text.trim() || input.text.length > 10000) throw new Error("Mensagem inválida.");
  const response = await fetcher("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: { Authorization: `Bearer ${input.accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message: { subject: input.subject, body: { contentType: "Text", content: input.text }, toRecipients: [{ emailAddress: { address: input.recipient } }] }, saveToSentItems: true }),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (response.status !== 202) throw new Error("Não foi possível enviar a mensagem pelo Microsoft Graph.");
}
