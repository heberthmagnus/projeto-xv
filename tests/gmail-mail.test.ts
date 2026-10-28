import assert from "node:assert/strict";
import test from "node:test";
import { sendGmailMessage } from "../lib/gmail-mail";

test("envia MIME ao Gmail com destinatário único e assunto UTF-8", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (input, init) => {
      assert.equal(input, "https://gmail.googleapis.com/gmail/v1/users/me/messages/send");
      assert.equal((init?.headers as Record<string, string>).Authorization, "Bearer token-teste");
      const data = JSON.parse(String(init?.body));
      const mime = Buffer.from(data.raw, "base64url").toString("utf8");
      assert.match(mime, /^To: pessoa@example.com\r\n/);
      assert.match(mime, /Subject: =\?UTF-8\?B\?/);
      assert.doesNotMatch(mime, /token-teste/);
      return new Response("{}", { status: 200 });
    };
    await sendGmailMessage({ accessToken: "token-teste", recipient: "pessoa@example.com", subject: "Confirmação", text: "Olá!" });
  } finally { globalThis.fetch = original; }
});

test("recusa injeção de cabeçalho e erros do provedor", async () => {
  await assert.rejects(sendGmailMessage({ accessToken: "x", recipient: "a@example.com\r\nBcc: x@example.com", subject: "x", text: "x" }));
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response("erro privado", { status: 403 });
    await assert.rejects(sendGmailMessage({ accessToken: "x", recipient: "a@example.com", subject: "x", text: "x" }), /Não foi possível/);
  } finally { globalThis.fetch = original; }
});
