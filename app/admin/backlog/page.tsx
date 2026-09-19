import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BacklogBoard } from "./backlog-board";

export default async function AdminBacklogPage() {
  await requireAdmin();
  const items = await prisma.siteBacklogItem.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  return <main className="xv-page-shell"><div className="xv-page-container space-y-5">
    <section className="xv-card">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">Planejamento do produto</p>
      <h1 className="mt-1 text-3xl font-black text-[#101010]">Backlog do site</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#4B5563]">Clique em um card para editar todos os detalhes ou movê-lo de status. As mensagens do “Fale conosco” entram automaticamente em Ideias.</p>
    </section>
    <BacklogBoard items={items.map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() }))} />
  </div></main>;
}
