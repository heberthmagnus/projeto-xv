type BacklogItem = {
  title: string;
  description: string;
  area: string;
  priority: "Próximo" | "Planejado" | "Em estudo";
};

const items: BacklogItem[] = [
  {
    title: "Acesso por perfil e área do clube",
    description: "Definir perfis como Secretaria, Comissão do Campeonato e Administração. Cada perfil verá apenas as páginas e ações necessárias ao seu trabalho.",
    area: "Segurança e operação",
    priority: "Próximo",
  },
  {
    title: "Painel da Secretaria para sócios",
    description: "Cadastro e consulta de sócios, com situação ativo/inativo, dados cadastrais e filtros. O acesso ficará restrito ao perfil da Secretaria.",
    area: "Secretaria",
    priority: "Próximo",
  },
  {
    title: "Permissões detalhadas",
    description: "Permitir autorizar ações específicas por perfil, como visualizar, cadastrar, editar ou administrar uma frente do clube.",
    area: "Segurança e operação",
    priority: "Planejado",
  },
  {
    title: "Histórico de alterações",
    description: "Registrar quem alterou informações relevantes, quando e o que foi atualizado, para dar rastreabilidade à operação.",
    area: "Segurança e operação",
    priority: "Planejado",
  },
  {
    title: "Comunicados recorrentes do site",
    description: "Manter uma visão rápida das novidades liberadas para facilitar a divulgação aos associados pelo WhatsApp.",
    area: "Comunicação",
    priority: "Em estudo",
  },
];

const priorityStyle = {
  "Próximo": "bg-[#FFF0B8] text-[#855D00]",
  "Planejado": "bg-[#E9F1FF] text-[#1952A6]",
  "Em estudo": "bg-[#F4F4F5] text-[#52525B]",
} as const;

export default function AdminBacklogPage() {
  return <main className="xv-page-shell"><div className="xv-page-container space-y-5">
    <section className="xv-card">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">Planejamento do produto</p>
      <h1 className="mt-1 text-3xl font-black text-[#101010]">Backlog do site</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#4B5563]">Visão das próximas melhorias do site do Clube XV. Esta lista organiza o que será priorizado antes de iniciar cada nova frente.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Summary label="Próximos itens" value={items.filter((item) => item.priority === "Próximo").length} />
        <Summary label="Planejados" value={items.filter((item) => item.priority === "Planejado").length} />
        <Summary label="Em estudo" value={items.filter((item) => item.priority === "Em estudo").length} />
      </div>
    </section>
    <section className="grid gap-4 xl:grid-cols-3">
      {(["Próximo", "Planejado", "Em estudo"] as const).map((priority) => <section key={priority} className="xv-card"><h2 className="text-xl font-black text-[#101010]">{priority}</h2><div className="mt-4 grid gap-3">{items.filter((item) => item.priority === priority).map((item) => <article key={item.title} className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFC] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold uppercase tracking-wide text-[#8B6914]">{item.area}</p><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${priorityStyle[item.priority]}`}>{item.priority}</span></div><h3 className="mt-2 font-black text-[#101010]">{item.title}</h3><p className="mt-2 text-sm leading-6 text-[#4B5563]">{item.description}</p></article>)}</div></section>)}
    </section>
  </div></main>;
}

function Summary({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] p-4"><p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">{label}</p><p className="mt-1 text-2xl font-black text-[#101010]">{value}</p></div>;
}
