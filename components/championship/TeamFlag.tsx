import Image from "next/image";

const localFlagCodes = new Set(["ar", "co", "de", "es", "fr", "gb-eng", "hr", "mx", "no", "se", "sn", "us"]);

function getCountryCode(icon: string | null | undefined) {
  if (!icon) return null;
  if (icon === "🏴󠁧󠁢󠁥󠁮󠁧󠁿") return "gb-eng";
  const indicators = Array.from(icon).filter((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint >= 0x1f1e6 && codePoint <= 0x1f1ff;
  });
  if (indicators.length !== 2) return null;
  return indicators.map((character) => String.fromCharCode((character.codePointAt(0) ?? 0) - 0x1f1e6 + 65)).join("").toLowerCase();
}

export function TeamFlag({ icon, className = "" }: { icon: string | null | undefined; className?: string }) {
  const countryCode = getCountryCode(icon);
  if (countryCode && localFlagCodes.has(countryCode)) {
    return <Image src={`/flags/${countryCode}.svg`} alt="" width={28} height={20} unoptimized className={`inline-block h-auto ${className}`} />;
  }
  return icon ? <span aria-hidden="true" className={className}>{icon}</span> : null;
}
