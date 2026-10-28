type GmailMessage = { accessToken: string; recipient: string; subject: string; text: string };

/** Sends a single plain-text message; never logs the message, token or provider response. */
export async function sendGmailMessage({ accessToken, recipient, subject, text }: GmailMessage): Promise<void> {
  if (!accessToken || !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(recipient) || recipient.length > 254 || !subject || /[\r\n]/.test(subject) || subject.length > 200) {
    throw new Error("Mensagem inválida.");
  }
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;
  const body = Buffer.from(text, "utf8").toString("base64").match(/.{1,76}/g)?.join("\r\n") ?? "";
  const mime = [`To: ${recipient}`, `Subject: ${encodedSubject}`, "MIME-Version: 1.0", 'Content-Type: text/plain; charset="UTF-8"', "Content-Transfer-Encoding: base64", "", body].join("\r\n");
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: Buffer.from(mime, "utf8").toString("base64url") }),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Não foi possível enviar a mensagem.");
}
