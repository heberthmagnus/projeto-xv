import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const VERSION = "v1";
const IV_BYTES = 12;
const TAG_BYTES = 16;

function decodeKey(base64Key: string) {
  if (!/^[A-Za-z0-9+/]{43}=$/.test(base64Key)) throw new Error("Chave de proteção inválida.");
  const key = Buffer.from(base64Key, "base64");
  if (key.length !== 32 || key.toString("base64") !== base64Key) throw new Error("Chave de proteção inválida.");
  return key;
}

export function sealSecret(secret: string, base64Key: string, context: string): string {
  if (!secret || !context) throw new Error("Dados de proteção inválidos.");
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", decodeKey(base64Key), iv, { authTagLength: TAG_BYTES });
  cipher.setAAD(Buffer.from(context, "utf8"));
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return [VERSION, iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function openSecret(envelope: string, base64Key: string, context: string): string {
  const [version, encodedIv, encodedTag, encodedPayload, extra] = envelope.split(".");
  if (version !== VERSION || !encodedIv || !encodedTag || !encodedPayload || extra !== undefined || !context) throw new Error("Dados protegidos inválidos.");
  const iv = Buffer.from(encodedIv, "base64url");
  const tag = Buffer.from(encodedTag, "base64url");
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) throw new Error("Dados protegidos inválidos.");
  try {
    const decipher = createDecipheriv("aes-256-gcm", decodeKey(base64Key), iv, { authTagLength: TAG_BYTES });
    decipher.setAAD(Buffer.from(context, "utf8"));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(Buffer.from(encodedPayload, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    throw new Error("Não foi possível abrir os dados protegidos.");
  }
}
