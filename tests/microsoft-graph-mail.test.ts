import { strict as assert } from "node:assert";
import { test } from "node:test";
import { sendMicrosoftGraphMail } from "../lib/microsoft-graph-mail";

test("envia ao Graph o destinatário especificado sem copiar o token para o corpo", async () => {
  let captured: RequestInit | undefined;
  const fakeFetch: typeof fetch = async (url, options) => {
    assert.equal(url, "https://graph.microsoft.com/v1.0/me/sendMail");
    captured = options;
    return new Response(null, { status: 202 });
  };
  await sendMicrosoftGraphMail({ accessToken: "test-secret", recipient: "pessoa@example.com", subject: "Confirmação", text: "Mensagem de teste" }, fakeFetch);
  assert.equal((captured?.headers as Record<string, string>).Authorization, "Bearer test-secret");
  assert.equal(String(captured?.body).includes("test-secret"), false);
  assert.equal(JSON.parse(String(captured?.body)).message.toRecipients[0].emailAddress.address, "pessoa@example.com");
});

test("falha de maneira genérica quando o provedor recusa o envio", async () => {
  const fakeFetch: typeof fetch = async () => new Response("token ou detalhes privados", { status: 401 });
  await assert.rejects(sendMicrosoftGraphMail({ accessToken: "test-secret", recipient: "pessoa@example.com", subject: "Teste", text: "Teste" }, fakeFetch), /Não foi possível enviar/);
});

test("recusa destinatários ou assuntos inválidos antes de chamar o provedor", async () => {
  let called = false;
  const fakeFetch: typeof fetch = async () => { called = true; return new Response(null, { status: 202 }); };
  await assert.rejects(sendMicrosoftGraphMail({ accessToken: "token", recipient: "invalid", subject: "Teste", text: "Teste" }, fakeFetch));
  assert.equal(called, false);
});
