import Link from "next/link";
import { RecoveryForm } from "./recovery-form";
export default function EsqueciSenhaPage() {
  return <main className="xv-page-shell"><div className="xv-page-container"><section className="xv-card mx-auto max-w-lg"><Link href="/login" className="text-sm font-bold text-[#8B6914]">← Voltar ao login</Link><h1 className="mt-3 text-2xl font-black">Recuperar senha</h1><p className="mt-3">Informe o e-mail usado na conta.</p><RecoveryForm/></section></div></main>;
}
