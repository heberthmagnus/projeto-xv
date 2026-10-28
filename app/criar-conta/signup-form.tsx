"use client";

import { useActionState, useState } from "react";
import { reenviarConfirmacao, solicitarConta, type SignupField } from "./actions";

export function SignupForm() {
  const [state, action, pending] = useActionState(solicitarConta, { message: "", success: false, errors: {} });
  const [resendState, resendAction, resending] = useActionState(reenviarConfirmacao, { message: "", done: false });
  const [values, setValues] = useState({ fullName: "", email: "", phone: "", password: "", confirmation: "" });
  if (state.success) return <div className="grid gap-3"><p role="status" className="rounded-xl bg-[#F5F0E8] p-4">{state.message}</p><form action={resendAction}><input type="hidden" name="email" value={state.email}/><button disabled={resending} className="font-bold text-[#8B6914] underline">{resending ? "Reenviando…" : "Reenviar e-mail de confirmação"}</button></form>{resendState.message && <p role={resendState.done ? "status" : "alert"} className={resendState.done ? "text-sm text-[#4B5563]" : "text-sm text-red-700"}>{resendState.message}</p>}</div>;
  const field = (name: SignupField) => `w-full rounded-lg border bg-white p-3 ${state.errors?.[name] ? "border-red-600" : "border-[#D1D5DB]"}`;
  const update = (name: SignupField, value: string) => setValues((current) => ({ ...current, [name]: value }));
  const error = (name: SignupField) => state.errors?.[name] ? <p id={`${name}-error`} className="mt-1 text-sm text-red-700">{state.errors[name]}</p> : null;

  return <form action={action} className="grid gap-3">
    <label>Nome completo<input className={field("fullName")} name="fullName" autoComplete="name" maxLength={120} required value={values.fullName} onChange={(event) => update("fullName", event.target.value)} aria-invalid={Boolean(state.errors?.fullName)} aria-describedby={state.errors?.fullName ? "fullName-error" : undefined} /></label>{error("fullName")}
    <label>E-mail<input className={field("email")} name="email" type="email" autoComplete="email" maxLength={254} required value={values.email} onChange={(event) => update("email", event.target.value)} aria-invalid={Boolean(state.errors?.email)} aria-describedby={state.errors?.email ? "email-error" : undefined} /></label>{error("email")}
    <label>Telefone<input className={field("phone")} name="phone" autoComplete="tel" placeholder="(27) 99999-9999" required value={values.phone} onChange={(event) => update("phone", event.target.value)} aria-invalid={Boolean(state.errors?.phone)} aria-describedby={state.errors?.phone ? "phone-error" : undefined} /></label>{error("phone")}
    <label>Senha<input className={field("password")} name="password" type="password" autoComplete="new-password" minLength={12} required value={values.password} onChange={(event) => update("password", event.target.value)} aria-invalid={Boolean(state.errors?.password)} aria-describedby={state.errors?.password ? "password-error" : undefined} /></label>{error("password")}
    <label>Confirme a senha<input className={field("confirmation")} name="confirmation" type="password" autoComplete="new-password" minLength={12} required value={values.confirmation} onChange={(event) => update("confirmation", event.target.value)} aria-invalid={Boolean(state.errors?.confirmation)} aria-describedby={state.errors?.confirmation ? "confirmation-error" : undefined} /></label>{error("confirmation")}
    {state.message && <p role="alert" className="text-sm text-red-700">{state.message}</p>}
    <button disabled={pending} className="rounded-lg bg-[#B89020] p-3 font-bold text-white">{pending ? "Enviando..." : "Solicitar acesso"}</button>
  </form>;
}
