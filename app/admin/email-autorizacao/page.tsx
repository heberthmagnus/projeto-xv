import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { iniciarAutorizacaoGmail } from "./actions";

export default async function EmailAuthorizationPage() {
  await requirePermission("permission.manage");
  return <main className="xv-page-shell"><div className="xv-page-container"><section className="xv-card mx-auto max-w-2xl"><Link href="/acesso" className="text-sm font-bold text-[#8B6914]">← Área administrativa</Link><h1 className="mt-3 text-2xl font-black">Autorização de envio de e-mails</h1><p className="mt-3 text-sm leading-6 text-[#4B5563]">Conecte a conta Gmail do Clube XV para que confirmações de cadastro e recuperação de senha possam ser enviadas. A autorização permite somente o envio de e-mails e pode ser renovada quando necessário.</p><form action={iniciarAutorizacaoGmail} className="mt-5"><button className="rounded-lg bg-[#B89020] px-4 py-3 font-bold text-white">Autorizar Gmail para envio</button></form></section></div></main>;
}
