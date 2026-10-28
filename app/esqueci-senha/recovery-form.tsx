"use client";
import { useActionState } from "react";
import { solicitarRecuperacao } from "./actions";

export function RecoveryForm() {
  const [state, action, pending] = useActionState(solicitarRecuperacao, { message: "", done: false });
  if (state.done) return <p role="status" className="mt-4">{state.message}</p>;
  return <form action={action} className="mt-4 grid gap-3"><label>E-mail<input name="email" type="email" required autoComplete="email" maxLength={254} className="block w-full rounded-lg border p-3"/></label>{state.message && <p role="alert" className="text-red-700">{state.message}</p>}<button disabled={pending} className="rounded-lg bg-[#B89020] px-4 py-3 font-bold text-white">{pending ? "Enviando…" : "Enviar instruções"}</button></form>;
}
