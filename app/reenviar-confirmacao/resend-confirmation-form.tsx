"use client";

import { useActionState } from "react";
import { reenviarConfirmacao } from "@/app/criar-conta/actions";

export function ResendConfirmationForm() {
  const [state, action, pending] = useActionState(reenviarConfirmacao, { message: "", done: false });
  return <form action={action} className="grid gap-3">
    <label>E-mail<input className="w-full rounded-lg border border-[#D1D5DB] bg-white p-3" name="email" type="email" autoComplete="email" maxLength={254} required /></label>
    {state.message && <p role={state.done ? "status" : "alert"} className={state.done ? "rounded-lg bg-[#F5F0E8] p-3 text-sm" : "text-sm text-red-700"}>{state.message}</p>}
    <button disabled={pending} className="rounded-lg bg-[#B89020] p-3 font-bold text-white">{pending ? "Reenviando…" : "Reenviar confirmação"}</button>
  </form>;
}
