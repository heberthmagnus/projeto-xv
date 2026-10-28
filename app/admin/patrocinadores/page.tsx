import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeExternalUrl, whatsappUrl } from "@/lib/sponsor-links";
import { executePrismaWithFallback } from "@/lib/prisma-safe";
import { DatabaseUnavailableNotice } from "@/components/ui/DatabaseUnavailableNotice";
import { createSponsor, toggleSponsor, updateSponsor } from "./actions";
import { SponsorForm } from "./sponsor-form";

type Sponsor = Awaited<ReturnType<typeof listSponsors>>[number];

export default async function SponsorsAdminPage() {
  await requireAdmin();
  const { data: sponsors, databaseUnavailable } = await executePrismaWithFallback(
    listSponsors,
    [],
    "admin:sponsors:list",
  );
  return <main className="xv-page-shell"><div className="xv-page-container space-y-5"><section className="xv-card"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">Base comercial</p><h1 className="mt-1 text-3xl font-black">Patrocinadores</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#4B5563]">Cadastros reutilizáveis do clube. A associação ao time é definida separadamente em cada campeonato.</p></section>{databaseUnavailable ? <DatabaseUnavailableNotice description="Os patrocinadores não puderam ser carregados agora. Tente novamente em instantes." /> : <><section className="xv-card"><h2 className="text-xl font-black">+ Novo patrocinador</h2><SponsorForm action={createSponsor} submitLabel="Cadastrar patrocinador" /></section><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{sponsors.map((sponsor) => { const logo = safeExternalUrl(sponsor.logoUrl); const instagram = safeExternalUrl(sponsor.instagramUrl); const website = safeExternalUrl(sponsor.websiteUrl); const whatsapp = whatsappUrl(sponsor.whatsapp); return <article key={sponsor.id} className="xv-card"><div className="flex items-start gap-4">{logo ? <img src={logo} alt={`Logotipo ${sponsor.name}`} className="h-16 w-24 rounded-xl border border-[#E5E7EB] bg-white object-contain p-2" /> : null}<div className="min-w-0"><h2 className="truncate text-lg font-black">{sponsor.name}</h2><span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${sponsor.active ? "bg-[#ECFDF3] text-[#166534]" : "bg-[#F3F4F6] text-[#4B5563]"}`}>{sponsor.active ? "Ativo" : "Inativo"}</span></div></div>{sponsor.description ? <p className="mt-4 text-sm leading-6 text-[#4B5563]">{sponsor.description}</p> : null}<div className="mt-4 flex flex-wrap gap-3 text-sm font-bold text-[#8B6914]">{instagram ? <a href={instagram} target="_blank" rel="noopener noreferrer">Instagram</a> : null}{website ? <a href={website} target="_blank" rel="noopener noreferrer">Site</a> : null}{whatsapp ? <a href={whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a> : null}</div><details className="mt-5"><summary className="cursor-pointer text-sm font-bold text-[#8B6914]">Editar</summary><SponsorForm action={updateSponsor} submitLabel="Salvar alterações" sponsor={sponsor} /></details><form action={toggleSponsor} className="mt-3"><input type="hidden" name="id" value={sponsor.id}/><input type="hidden" name="active" value={String(!sponsor.active)}/><button className="text-sm font-bold text-[#4B5563]">{sponsor.active ? "Desativar" : "Ativar"}</button></form></article>; })}</section>{!sponsors.length ? <section className="xv-card text-sm text-[#6B7280]">Nenhum patrocinador cadastrado.</section> : null}</>}</div></main>;
}

async function listSponsors() { return prisma.sponsor.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] }); }
