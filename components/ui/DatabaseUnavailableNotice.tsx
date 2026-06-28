type DatabaseUnavailableNoticeProps = {
  title?: string;
  description?: string;
  className?: string;
};

const defaultTitle = "Sistema temporariamente indisponível";
const defaultDescription =
  "Não foi possível carregar os dados agora. Tente novamente em alguns instantes.";

export function DatabaseUnavailableNotice({
  title = defaultTitle,
  description = defaultDescription,
  className = "",
}: DatabaseUnavailableNoticeProps) {
  return (
    <section
      className={`rounded-[20px] border border-[#F3C37A] bg-[#FFF7ED] p-5 text-[#9A3412] shadow-[0_12px_30px_rgba(154,52,18,0.08)] sm:p-6 ${className}`.trim()}
    >
      <div className="inline-flex rounded-full border border-[#FDBA74] bg-white px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#9A3412]">
        Aviso do sistema
      </div>
      <h2 className="mt-3 text-[1.35rem] font-black tracking-tight text-[#7C2D12]">
        {title}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#9A3412]">
        {description}
      </p>
    </section>
  );
}
