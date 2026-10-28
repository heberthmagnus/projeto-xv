import Link from "next/link";
import { ResendConfirmationForm } from "./resend-confirmation-form";

export default function ReenviarConfirmacaoPage() {
  return <main className="xv-page-shell"><div className="xv-page-container"><section className="xv-card mx-auto max-w-lg"><Link href="/login" className="text-sm font-bold text-[#8B6914]">← Voltar ao login</Link><h1 className="mt-3 text-2xl font-black">Reenviar confirmação de e-mail</h1><p className="my-4 text-sm text-[#4B5563]">Informe o e-mail usado no cadastro. Se houver uma solicitação pendente, enviaremos um novo link de confirmação.</p><ResendConfirmationForm /></section></div></main>;
}
