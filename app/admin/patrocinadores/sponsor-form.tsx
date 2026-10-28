"use client";

import { useActionState } from "react";

import type { SponsorFormState } from "./actions";

type SponsorValues = {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl: string | null;
  instagramUrl: string | null;
  whatsapp: string | null;
  description: string | null;
  active: boolean;
};

type SponsorFormAction = (
  state: SponsorFormState,
  formData: FormData,
) => Promise<SponsorFormState>;

const inputClass = "rounded-xl border border-[#D1D5DB] bg-white px-3 py-2.5 font-normal";
const initialState: SponsorFormState = {};

export function SponsorForm({
  action,
  submitLabel,
  sponsor,
}: {
  action: SponsorFormAction;
  submitLabel: string;
  sponsor?: SponsorValues;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} encType="multipart/form-data" className="mt-4 grid gap-3 sm:grid-cols-2">
      {sponsor ? <input type="hidden" name="id" value={sponsor.id} /> : null}
      <label className="grid gap-1 text-sm font-bold">
        Nome do patrocinador *
        <input name="name" defaultValue={sponsor?.name} required className={inputClass} />
      </label>
      <label className="grid gap-1 text-sm font-bold">
        {sponsor ? "Substituir logo" : "Logo *"}
        <input name="logoFile" type="file" accept="image/png,image/jpeg,image/webp" required={!sponsor} className={inputClass} />
        <span className="font-normal text-xs text-[#6B7280]">PNG, JPG ou WebP, até 2 MB. A imagem será salva no Supabase.</span>
      </label>
      {sponsor ? <div className="flex items-center gap-2 text-xs text-[#6B7280]">A logo atual será mantida se nenhum arquivo for selecionado.</div> : null}
      <label className="grid gap-1 text-sm font-bold">
        Instagram
        <input name="instagramUrl" type="url" defaultValue={sponsor?.instagramUrl || ""} placeholder="https://instagram.com/..." className={inputClass} />
      </label>
      <label className="grid gap-1 text-sm font-bold">
        Site
        <input name="websiteUrl" type="url" defaultValue={sponsor?.websiteUrl || ""} placeholder="https://..." className={inputClass} />
      </label>
      <label className="grid gap-1 text-sm font-bold">
        WhatsApp
        <input name="whatsapp" type="tel" defaultValue={sponsor?.whatsapp || ""} placeholder="(31) 99999-9999" className={inputClass} />
      </label>
      <label className="grid gap-1 text-sm font-bold">
        Descrição curta
        <input name="description" defaultValue={sponsor?.description || ""} className={inputClass} />
      </label>
      <label className="flex items-center gap-2 text-sm font-bold sm:col-span-2">
        <input type="checkbox" name="active" defaultChecked={sponsor?.active ?? true} className="h-4 w-4" />
        Ativo
      </label>
      {state.error ? <p role="alert" className="sm:col-span-2 text-sm font-semibold text-[#B42318]">{state.error}</p> : null}
      <div className="sm:col-span-2">
        <button disabled={pending} className="rounded-xl bg-[#B89020] px-4 py-2.5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-70">
          {pending ? "Salvando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
