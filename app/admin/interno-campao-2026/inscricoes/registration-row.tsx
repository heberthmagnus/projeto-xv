"use client";

import { useState } from "react";
import { PhoneInput } from "@/app/components/phone-input";
import { deleteRegistration, updateRegistration } from "./actions";

type Registration = {
  id: string;
  fullName: string;
  nickname: string | null;
  preferredPosition: string;
  birthDate: Date;
  phone: string;
  email: string | null;
  category: "ADULTO" | "MASTER" | null;
  level: "A" | "B" | "C" | "D" | "E" | null;
  createdAt: Date;
};

export function RegistrationRow({ registration }: { registration: Registration }) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <tr className="bg-white even:bg-[#FCFCFC]">
        <td className="border-b border-[#F1F5F9] px-4 py-3 font-semibold text-[#101010]">{registration.fullName}</td>
        <td className="border-b border-[#F1F5F9] px-4 py-3 text-[#374151]">{registration.nickname || "-"}</td>
        <td className="border-b border-[#F1F5F9] px-4 py-3 text-[#374151]">{formatPosition(registration.preferredPosition)}</td>
        <td className="border-b border-[#F1F5F9] px-4 py-3 text-[#374151]">{registration.phone}</td>
        <td className="border-b border-[#F1F5F9] px-4 py-3 text-[#374151]">{registration.email || "-"}</td>
        <td className="border-b border-[#F1F5F9] px-4 py-3 text-[#374151]">{formatCategory(registration.category)}</td>
        <td className="border-b border-[#F1F5F9] px-4 py-3 text-[#374151]">{registration.level || "-"}</td>
        <td className="border-b border-[#F1F5F9] px-4 py-3 text-[#374151]">{registration.createdAt.toLocaleDateString("pt-BR")}</td>
        <td className="border-b border-[#F1F5F9] px-4 py-3">
          <div className="flex min-w-36 flex-wrap gap-2">
            <button type="button" onClick={() => setEditing((value) => !value)} className="rounded-lg bg-[#374151] px-3 py-2 text-sm font-semibold text-white">
              {editing ? "Fechar" : "Editar"}
            </button>
            <form action={deleteRegistration} onSubmit={(event) => { if (!window.confirm("Tem certeza que deseja excluir esta inscrição?")) event.preventDefault(); }}>
              <input type="hidden" name="id" value={registration.id} />
              <button type="submit" className="rounded-lg bg-[#B91C1C] px-3 py-2 text-sm font-semibold text-white">Excluir</button>
            </form>
          </div>
        </td>
      </tr>
      {editing ? (
        <tr className="bg-[#FAFAFA]">
          <td colSpan={9} className="border-b border-[#E5E7EB] p-4">
            <form action={updateRegistration} className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
              <input type="hidden" name="id" value={registration.id} />
              <Field label="Nome completo *"><input name="fullName" defaultValue={registration.fullName} required className={inputClass} /></Field>
              <Field label="Apelido"><input name="nickname" defaultValue={registration.nickname || ""} className={inputClass} /></Field>
              <Field label="Posição *"><PositionSelect value={registration.preferredPosition} /></Field>
              <Field label="Nascimento *"><input name="birthDate" type="date" defaultValue={formatDate(registration.birthDate)} required className={inputClass} /></Field>
              <Field label="Telefone / WhatsApp *"><PhoneInput name="phone" defaultValue={registration.phone} required style={phoneInputStyle} /></Field>
              <Field label="E-mail"><input name="email" type="email" defaultValue={registration.email || ""} className={inputClass} /></Field>
              <Field label="Categoria"><select name="category" defaultValue={registration.category || "UNDEFINED"} className={inputClass}><option value="ADULTO">Adulto</option><option value="MASTER">Master</option><option value="UNDEFINED">Undefined</option></select></Field>
              <Field label="Nível"><select name="level" defaultValue={registration.level || ""} className={inputClass}><option value="">-</option>{["A", "B", "C", "D", "E"].map((level) => <option key={level}>{level}</option>)}</select></Field>
              <div className="flex items-end"><button type="submit" className="min-h-10 rounded-xl bg-[#B89020] px-4 py-2 font-semibold text-white">Salvar alterações</button></div>
            </form>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1 text-sm font-semibold text-[#374151]"><span>{label}</span>{children}</label>;
}

function PositionSelect({ value }: { value: string }) {
  return <select name="preferredPosition" defaultValue={value} className={inputClass}>{[["GOLEIRO", "Goleiro"], ["LATERAL", "Lateral"], ["ZAGUEIRO", "Zagueiro"], ["VOLANTE", "Volante"], ["MEIA", "Meia"], ["ATACANTE", "Atacante"]].map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select>;
}

function formatPosition(position: string) { return ({ GOLEIRO: "Goleiro", LATERAL: "Lateral", ZAGUEIRO: "Zagueiro", VOLANTE: "Volante", MEIA: "Meia", ATACANTE: "Atacante" } as Record<string, string>)[position] || position; }
function formatCategory(category: Registration["category"]) { return category === "ADULTO" ? "Adulto" : category === "MASTER" ? "Master" : "Undefined"; }
function formatDate(date: Date) { return new Date(date).toISOString().slice(0, 10); }

const inputClass = "min-h-10 rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-sm font-normal text-[#101010]";
const phoneInputStyle: React.CSSProperties = { minHeight: 40, borderRadius: 12, border: "1px solid #D1D5DB", background: "#FFFFFF", padding: "8px 12px", fontSize: 14, fontWeight: 400, color: "#101010" };
