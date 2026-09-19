export function normalizeWhatsapp(value: string | null | undefined) {
  const digits = (value || "").replace(/\D/g, "");
  if (!digits) return null;
  return digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
}

export function safeExternalUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function whatsappUrl(value: string | null | undefined) {
  const whatsapp = normalizeWhatsapp(value);
  return whatsapp ? `https://wa.me/${whatsapp}` : null;
}
