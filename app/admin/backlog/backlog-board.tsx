"use client";

import { useState } from "react";
import { SiteBacklogStatus } from "@prisma/client";
import { createBacklogItem, deleteBacklogItem, moveBacklogItem, updateBacklogItem } from "./actions";

type BacklogItem = { id: string; title: string; description: string; area: string; status: SiteBacklogStatus; sortOrder: number; createdAt: string; updatedAt: string };
type Editor = { status: SiteBacklogStatus; item?: BacklogItem } | null;

const columns = [
  ["IDEIAS", "Ideias", "bg-[#FFF7D6] text-[#855D00]"],
  ["BACKLOG", "Backlog", "bg-[#F4F4F5] text-[#52525B]"],
  ["PRIORIZADO", "Priorizado", "bg-[#FFF0B8] text-[#855D00]"],
  ["EM_ANDAMENTO", "Em andamento", "bg-[#E9F1FF] text-[#1952A6]"],
  ["EM_VALIDACAO", "Em validação", "bg-[#F3E8FF] text-[#6B21A8]"],
  ["CONCLUIDO", "Concluído", "bg-[#ECFDF3] text-[#166534]"],
] as const satisfies ReadonlyArray<readonly [SiteBacklogStatus, string, string]>;

export function BacklogBoard({ items: initialItems }: { items: BacklogItem[] }) {
  const [editor, setEditor] = useState<Editor>(null);
  const [items, setItems] = useState(initialItems);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  async function moveCard(id: string, status: SiteBacklogStatus) {
    const previousItems = items;
    setItems((currentItems) => currentItems.map((item) => item.id === id ? { ...item, status } : item));
    setDraggedId(null);
    const formData = new FormData();
    formData.set("id", id);
    formData.set("status", status);
    try {
      await moveBacklogItem(formData);
    } catch {
      setItems(previousItems);
      window.alert("Não foi possível mover este card. Tente novamente.");
    }
  }

  return <section className="overflow-hidden rounded-3xl border border-[#E5E7EB] bg-[#F7F7F5] p-3 shadow-[0_12px_28px_rgba(16,16,16,0.05)] sm:p-4">
    <div className="mb-3 flex items-center justify-between gap-3 px-1"><p className="text-sm text-[#6B7280]">Arraste um card para outro bucket ou use a edição para alterar seus detalhes.</p><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#52525B]">{items.length} cards</span></div>
    <div className="overflow-x-auto pb-2"><div className="flex min-w-max gap-3">
      {columns.map(([status, label, color]) => {
        const cards = items.filter((item) => item.status === status);
        return <section key={status} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData("text/plain") || draggedId; if (id) void moveCard(id, status); }} className={`w-[285px] shrink-0 rounded-2xl border bg-white p-3 transition ${draggedId ? "border-[#B89020] shadow-[0_0_0_2px_rgba(184,144,32,0.18)]" : "border-[#E5E7EB]"}`}><header className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><h2 className="font-black text-[#101010]">{label}</h2><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${color}`}>{cards.length}</span></div><button type="button" onClick={() => setEditor({ status })} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1A1A1A] text-lg font-medium text-white transition hover:bg-[#B89020]" aria-label={`Criar card em ${label}`}>+</button></header>
          <div className="mt-3 grid gap-2">{cards.map((item) => <button key={item.id} type="button" draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", item.id); setDraggedId(item.id); }} onDragEnd={() => setDraggedId(null)} onClick={() => setEditor({ status: item.status, item })} className={`rounded-xl border border-[#E5E7EB] bg-[#FCFCFC] p-3 text-left shadow-sm transition hover:border-[#B89020] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#B89020] ${draggedId === item.id ? "opacity-40" : ""}`}><p className="text-[0.68rem] font-bold uppercase tracking-wide text-[#8B6914]">{item.area}</p><h3 className="mt-1 font-black leading-snug text-[#101010]">{item.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-5 text-[#4B5563]">{item.description}</p></button>)}{!cards.length ? <p className="rounded-xl border border-dashed border-[#D1D5DB] px-3 py-5 text-center text-sm text-[#9CA3AF]">Solte um card aqui</p> : null}</div>
        </section>;
      })}
    </div></div>
    {editor ? <BacklogEditor editor={editor} onClose={() => setEditor(null)} /> : null}
  </section>;
}

function BacklogEditor({ editor, onClose }: { editor: Exclude<Editor, null>; onClose: () => void }) {
  const isNew = !editor.item;
  const deleteFormId = editor.item ? `delete-backlog-${editor.item.id}` : undefined;
  return <div role="dialog" aria-modal="true" aria-labelledby="backlog-editor-title" className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#8B6914]">{isNew ? "Novo card" : "Editar card"}</p><h2 id="backlog-editor-title" className="mt-1 text-2xl font-black text-[#101010]">{isNew ? "Adicionar ao quadro" : editor.item?.title}</h2></div><button type="button" onClick={onClose} className="rounded-full p-2 text-xl leading-none text-[#52525B] hover:bg-[#F4F4F5]" aria-label="Fechar">×</button></div>
      <form action={isNew ? createBacklogItem : updateBacklogItem} onSubmit={onClose} className="mt-5 grid gap-4"><input type="hidden" name="id" value={editor.item?.id || ""}/><label className="grid gap-1 text-sm font-bold text-[#374151]">Título<input name="title" required defaultValue={editor.item?.title} autoFocus className={inputClass}/></label><label className="grid gap-1 text-sm font-bold text-[#374151]">Área<input name="area" required defaultValue={editor.item?.area} placeholder="Ex.: Secretaria" className={inputClass}/></label><label className="grid gap-1 text-sm font-bold text-[#374151]">Status<select name="status" defaultValue={editor.item?.status || editor.status} className={inputClass}>{columns.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="grid gap-1 text-sm font-bold text-[#374151]">Descrição<textarea name="description" required defaultValue={editor.item?.description} rows={5} className={inputClass}/></label><div className="flex flex-wrap items-center justify-between gap-3"><button className="rounded-xl bg-[#B89020] px-4 py-2.5 text-sm font-bold text-white">{isNew ? "Criar card" : "Salvar alterações"}</button>{editor.item ? <button type="submit" form={deleteFormId} className="text-sm font-bold text-[#B91C1C]">Excluir card</button> : null}</div></form>
      {editor.item ? <form id={deleteFormId} action={deleteBacklogItem} onSubmit={(event) => { if (!window.confirm("Excluir este card?")) event.preventDefault(); else onClose(); }}><input type="hidden" name="id" value={editor.item.id}/></form> : null}
    </section>
  </div>;
}

const inputClass = "min-h-10 rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-sm font-normal text-[#101010]";
