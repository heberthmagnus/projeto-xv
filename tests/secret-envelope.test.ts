import { strict as assert } from "node:assert";
import { randomBytes } from "node:crypto";
import { test } from "node:test";
import { openSecret, sealSecret } from "../lib/secret-envelope";

test("protege e recupera um segredo com nonce novo por operação", () => {
  const key = randomBytes(32).toString("base64");
  const first = sealSecret("segredo", key, "microsoft:sender");
  const second = sealSecret("segredo", key, "microsoft:sender");
  assert.notEqual(first, second);
  assert.equal(first.includes("segredo"), false);
  assert.equal(openSecret(first, key, "microsoft:sender"), "segredo");
});

test("recusa chave, contexto e conteúdo alterados", () => {
  const key = randomBytes(32).toString("base64");
  const encrypted = sealSecret("segredo", key, "microsoft:sender");
  const parts = encrypted.split(".");
  const bytes = Buffer.from(parts[3], "base64url");
  bytes[0] ^= 1;
  parts[3] = bytes.toString("base64url");
  assert.throws(() => openSecret(parts.join("."), key, "microsoft:sender"));
  assert.throws(() => openSecret(encrypted, key, "other"));
  assert.throws(() => openSecret(encrypted, randomBytes(32).toString("base64"), "microsoft:sender"));
  assert.throws(() => sealSecret("segredo", "inválida", "microsoft:sender"));
});
