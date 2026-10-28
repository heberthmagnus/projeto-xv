import Link from "next/link";
import { SignupForm } from "./signup-form";

export default function CriarContaPage() {
  return <main className="xv-page-shell"><div className="xv-page-container"><section className="xv-card mx-auto max-w-lg"><Link href="/login" className="text-sm font-bold text-[#8B6914]">← Voltar ao login</Link><h1 className="mt-3 text-2xl font-black">Criar conta de associado</h1><p className="my-4 text-sm text-[#4B5563]">Informe seus dados e escolha uma senha. Depois, confirme seu e-mail. A diretoria ou a secretaria verificará sua identidade e associação antes de liberar o acesso.</p><SignupForm /></section></div></main>;
}
