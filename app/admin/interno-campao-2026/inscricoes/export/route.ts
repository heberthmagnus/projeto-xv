import { requireAdmin } from "@/lib/auth";
import {
  ensureInternoCampao2026Championship,
} from "@/lib/championships";
import { prisma } from "@/lib/prisma";
import {
  DATABASE_UNAVAILABLE_MESSAGE,
  isPrismaConnectionError,
  logPrismaError,
} from "@/lib/prisma-safe";

function escapeCsv(value: string | Date | null | undefined) {
  const safe = value instanceof Date ? value.toLocaleDateString("pt-BR") : String(value ?? "");
  return `"${safe.replace(/"/g, '""')}"`;
}

function formatCategory(category: "ADULTO" | "MASTER" | null) {
  if (category === "ADULTO") return "Adulto";
  if (category === "MASTER") return "Master";
  return "Sem categoria";
}

function formatPosition(position: string) {
  const labels: Record<string, string> = {
    GOLEIRO: "Goleiro",
    LATERAL: "Lateral",
    ZAGUEIRO: "Zagueiro",
    VOLANTE: "Volante",
    MEIA: "Meia",
    ATACANTE: "Atacante",
  };

  return labels[position] ?? position;
}

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const category = new URL(request.url).searchParams.get("category");
    if (category !== "ADULTO" && category !== "MASTER") {
      return Response.json({ error: "Categoria inválida." }, { status: 400 });
    }

    const championship = await ensureInternoCampao2026Championship();
    const registrations = await prisma.registration.findMany({
      where: { championshipId: championship.id, category },
      orderBy: { fullName: "asc" },
      select: {
        fullName: true,
        nickname: true,
        category: true,
        preferredPosition: true,
        birthDate: true,
        phone: true,
        email: true,
        level: true,
        adminNotes: true,
        paymentStatus: true,
        createdAt: true,
      },
    });

    const header = [
      "Nome",
      "Apelido",
      "Categoria",
      "Posição",
      "Data de nascimento",
      "Telefone",
      "E-mail",
      "Nível",
      "Observações administrativas",
      "Pagamento",
      "Data da inscrição",
    ];
    const rows = registrations.map((registration) => [
      escapeCsv(registration.fullName),
      escapeCsv(registration.nickname),
      escapeCsv(formatCategory(registration.category)),
      escapeCsv(formatPosition(registration.preferredPosition)),
      escapeCsv(registration.birthDate),
      escapeCsv(registration.phone),
      escapeCsv(registration.email),
      escapeCsv(registration.level),
      escapeCsv(registration.adminNotes),
      escapeCsv(registration.paymentStatus === "PAGO" ? "Pago" : "Pendente"),
      escapeCsv(registration.createdAt),
    ]);
    const csv = `\uFEFF${[header.join(","), ...rows.map((row) => row.join(","))].join("\n")}`;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="inscricoes-${category.toLowerCase()}-interno-campao-2026.csv"`,
      },
    });
  } catch (error) {
    logPrismaError("admin:interno-campao-2026:registrations:export", error);

    if (isPrismaConnectionError(error)) {
      return Response.json({ error: DATABASE_UNAVAILABLE_MESSAGE }, { status: 503 });
    }

    throw error;
  }
}
