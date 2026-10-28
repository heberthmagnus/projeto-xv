import Link from "next/link";
import { ConfirmationStatus } from "./clear-fragment";

export default function ConfirmarEmailPage() {
  return <main className="xv-page-shell"><div className="xv-page-container"><section className="xv-card"><h1 className="text-2xl font-black">Confirmação de e-mail</h1><ConfirmationStatus/><p className="mt-3 text-sm text-[#4B5563]">Após a aprovação, você poderá entrar usando o e-mail e a senha escolhidos no cadastro.</p><Link href="/login" className="mt-4 inline-block font-bold text-[#8B6914] underline">Voltar ao login</Link></section></div></main>;
}
