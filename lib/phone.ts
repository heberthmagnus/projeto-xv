const PHONE_REGEX = /^\(\d{2}\) 9\d{4}-\d{4}$/;

export const PHONE_PLACEHOLDER = "(51) 91234-5678";
export const PHONE_PATTERN = "\\(\\d{2}\\) 9\\d{4}-\\d{4}";
export const PHONE_ERROR_MESSAGE =
  "Informe o telefone no formato (DD) 9XXXX-XXXX.";

export function isValidBrazilPhone(phone: string) {
  return PHONE_REGEX.test(phone.trim());
}

export function formatBrazilPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) {
    return digits ? `(${digits}` : "";
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(
    7,
    11,
  )}`;
}
