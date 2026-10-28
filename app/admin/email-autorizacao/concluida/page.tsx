import Link from "next/link";

export default function EmailAuthorizationCompletePage() {
  return <main className="xv-page-shell"><div className="xv-page-container"><section className="xv-card mx-auto max-w-2xl"><h1 className="text-2xl font-black">Autorização concluída</h1><p className="mt-3 text-sm leading-6 text-[#4B5563]">A autorização do Gmail foi concluída. Você já pode voltar ao fluxo de cadastro para reenviar a confirmação de e-mail.</p><Link href="/reenviar-confirmacao" className="mt-5 inline-block rounded-lg bg-[#B89020] px-4 py-3 font-bold text-white">Reenviar confirmação</Link></section></div></main>;
}
