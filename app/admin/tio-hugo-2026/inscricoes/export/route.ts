import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function formatPosition(position: string) {
  switch (position) {
    case "GOLEIRO":
      return "Goleiro";
    case "LATERAL":
      return "Lateral";
    case "ZAGUEIRO":
      return "Zagueiro";
    case "VOLANTE":
      return "Volante";
    case "MEIA":
      return "Meia";
    case "ATACANTE":
      return "Atacante";
    default:
      return position;
  }
}

function escapeCsv(value: string | null | undefined) {
  const safe = String(value ?? "");
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET() {
  await requireAdmin();

  const championship = await prisma.championship.findUnique({
    where: { slug: "tio-hugo-2026" },
    select: { id: true, name: true },
  });

  if (!championship) {
    return new Response("Campeonato não encontrado.", { status: 404 });
  }

  const registrations = await prisma.registration.findMany({
    where: { championshipId: championship.id },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "Nome",
    "Apelido",
    "Posição",
    "Data de nascimento",
    "Telefone",
    "E-mail",
    "Nível",
    "Data da inscrição",
  ];

  const rows = registrations.map((r) => [
    escapeCsv(r.fullName),
    escapeCsv(r.nickname),
    escapeCsv(formatPosition(r.preferredPosition)),
    escapeCsv(new Date(r.birthDate).toLocaleDateString("pt-BR")),
    escapeCsv(r.phone),
    escapeCsv(r.email),
    escapeCsv(r.level),
    escapeCsv(new Date(r.createdAt).toLocaleDateString("pt-BR")),
  ]);

  const csv = [header.join(","), ...rows.map((row) => row.join(","))].join(
    "\n",
  );

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inscricoes-tio-hugo-2026.csv"`,
    },
  });
}
