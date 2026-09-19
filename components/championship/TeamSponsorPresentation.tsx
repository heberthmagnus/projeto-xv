import { safeExternalUrl, whatsappUrl } from "@/lib/sponsor-links";

type Sponsor = { name: string; logoUrl: string; websiteUrl: string | null; instagramUrl: string | null; whatsapp: string | null; description: string | null };

export function TeamSponsorPresentation({ sponsor, shirtImageUrl, compact = false }: { sponsor?: Sponsor | null; shirtImageUrl?: string | null; compact?: boolean }) {
  const shirt = safeExternalUrl(shirtImageUrl);
  if (!sponsor && !shirt) return null;
  const logo = sponsor ? safeExternalUrl(sponsor.logoUrl) : null;
  const website = sponsor ? safeExternalUrl(sponsor.websiteUrl) : null;
  const instagram = sponsor ? safeExternalUrl(sponsor.instagramUrl) : null;
  const whatsapp = sponsor ? whatsappUrl(sponsor.whatsapp) : null;
  return <article className={`xv-card ${compact ? "p-4" : ""}`}><p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">{sponsor ? "Patrocínio" : "Camisa do time"}</p>{shirt ? <img src={shirt} alt="Camisa do time" className="mt-4 max-h-80 w-full rounded-2xl border border-[#E5E7EB] bg-white object-contain" /> : null}{sponsor ? <div className="mt-4 flex items-start gap-4">{logo ? <img src={logo} alt={`Logotipo ${sponsor.name}`} className="h-16 w-28 shrink-0 rounded-xl border border-[#E5E7EB] bg-white object-contain p-2" /> : null}<div><h2 className="text-xl font-black text-[#101010]">{sponsor.name}</h2>{sponsor.description ? <p className="mt-1 text-sm leading-6 text-[#4B5563]">{sponsor.description}</p> : null}<div className="mt-3 flex flex-wrap gap-3 text-sm font-bold text-[#8B6914]">{instagram ? <a href={instagram} target="_blank" rel="noopener noreferrer">Instagram</a> : null}{website ? <a href={website} target="_blank" rel="noopener noreferrer">Site</a> : null}{whatsapp ? <a href={whatsapp} target="_blank" rel="noopener noreferrer">Falar no WhatsApp</a> : null}</div></div></div> : null}</article>;
}
