import { strict as assert } from "node:assert";
import { randomBytes } from "node:crypto";
import { test } from "node:test";
import { Webhook } from "standardwebhooks";
import { verifyAuthEmailHook } from "../lib/supabase/auth-email-hook";

const secret = `whsec_${randomBytes(32).toString("base64")}`;
const verifier = new Webhook(secret);
function signed(payload: string, time = new Date()) {
  const id = "msg_test";
  return { payload, headers: { "webhook-id": id, "webhook-timestamp": String(Math.floor(time.getTime() / 1000)), "webhook-signature": verifier.sign(id, time, payload) }, secrets: `v1,${secret}`, appOrigin: "https://club.example", supabaseOrigin: "https://project.supabase.co" };
}
function event(action = "recovery", redirect = "https://club.example/reset-password") {
  return JSON.stringify({ user: { email: "person@example.com" }, email_data: { email_action_type: action, token_hash: "a".repeat(64), redirect_to: redirect } });
}

test("aceita hook assinado e constrói URL de recuperação no projeto configurado", () => {
  const message = verifyAuthEmailHook(signed(event()));
  assert.equal(message.recipient, "person@example.com");
  assert.match(message.text, /https:\/\/project\.supabase\.co\/auth\/v1\/verify/);
});
test("recusa corpo alterado, assinatura expirada e redirecionamento externo", () => {
  const signedPayload = signed(event());
  assert.throws(() => verifyAuthEmailHook({ ...signedPayload, payload: event("signup", "https://club.example/auth/confirmar") }));
  assert.throws(() => verifyAuthEmailHook(signed(event(), new Date(Date.now() - 600000))));
  assert.throws(() => verifyAuthEmailHook(signed(event("recovery", "https://attacker.example/reset-password"))));
});
test("recusa ações não suportadas e aceita segredo anterior durante rotação", () => {
  assert.throws(() => verifyAuthEmailHook(signed(event("email_change"))));
  const valid = signed(event());
  assert.equal(verifyAuthEmailHook({ ...valid, secrets: `v1,whsec_${randomBytes(32).toString("base64")}|${valid.secrets}` }).recipient, "person@example.com");
});

test("aceita token de confirmação alfanumérico documentado pelo GoTrue", () => {
  const payload = JSON.stringify({ user: { email: "person@example.com" }, email_data: { email_action_type: "signup", token_hash: "TokenDeConfirmacao1234567890AB", redirect_to: "https://club.example/auth/confirmar" } });
  assert.equal(verifyAuthEmailHook(signed(payload)).recipient, "person@example.com");
});
