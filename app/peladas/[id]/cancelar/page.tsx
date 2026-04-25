import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { cancelPeladaConfirmation } from "./actions";

type Params = Promise<{
  id: string;
}>;

type SearchParams = Promise<{
  token?: string;
  error?: string;
  status?: string;
}>;

export default async function PeladaCancelPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  await connection();

  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const token = String(resolvedSearchParams.token || "").trim();
  const status = String(resolvedSearchParams.status || "").trim();
  const error = String(resolvedSearchParams.error || "").trim();

  const pelada = await prisma.pelada.findUnique({
    where: { id },
    select: {
      id: true,
      scheduledAt: true,
    },
  });

  if (!pelada) {
    notFound();
  }

  const confirmation = token
    ? await prisma.peladaConfirmation.findFirst({
        where: {
          peladaId: id,
          cancelToken: token,
          parentConfirmationId: null,
        },
        select: {
          id: true,
          canceledAt: true,
        },
      })
    : null;

  const invalidToken = !token || error === "invalid" || !confirmation;
  const justCanceled = status === "success" && Boolean(confirmation);
  const alreadyCanceled =
    !justCanceled &&
    status === "already-canceled" &&
    Boolean(confirmation?.canceledAt);

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        <div style={badgeStyle}>Pelada de {formatDate(pelada.scheduledAt)}</div>
        <h1 style={titleStyle}>Cancelar presença</h1>

        {invalidToken ? (
          <p style={descriptionStyle}>
            Confirmação não encontrada ou já cancelada.
          </p>
        ) : justCanceled ? (
          <p style={descriptionStyle}>Presença cancelada com sucesso.</p>
        ) : alreadyCanceled || confirmation?.canceledAt ? (
          <p style={descriptionStyle}>Sua presença já foi cancelada.</p>
        ) : (
          <>
            <p style={descriptionStyle}>
              Deseja cancelar sua presença nesta pelada?
            </p>

            <form action={cancelPeladaConfirmation.bind(null, { peladaId: id })}>
              <input type="hidden" name="token" value={token} />
              <button type="submit" style={primaryButtonStyle}>
                Cancelar presença
              </button>
            </form>
          </>
        )}

        <div style={actionsStyle}>
          <Link href={`/peladas/${id}`} style={secondaryLinkStyle}>
            Voltar para a pelada
          </Link>
        </div>
      </div>
    </main>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

const pageStyle: React.CSSProperties = {
  minHeight: "calc(100vh - 280px)",
  background: "linear-gradient(180deg, #f7f2e9 0%, #f4eee5 100%)",
  padding: "24px 16px 48px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 560,
  background: "#FFFFFF",
  borderRadius: 18,
  border: "1px solid #E5E7EB",
  boxShadow: "0 18px 40px rgba(0,0,0,0.08)",
  padding: 32,
  textAlign: "center",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  marginBottom: 16,
  borderRadius: 999,
  padding: "6px 12px",
  background: "#FCF7E6",
  color: "#8B6914",
  fontSize: 12,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 10px",
  fontSize: 30,
  color: "#101010",
};

const descriptionStyle: React.CSSProperties = {
  margin: "0 auto",
  maxWidth: 420,
  color: "#4B5563",
  lineHeight: 1.7,
};

const primaryButtonStyle: React.CSSProperties = {
  marginTop: 24,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 18px",
  borderRadius: 10,
  border: "none",
  background: "#B42318",
  color: "#FFFFFF",
  fontWeight: 700,
  fontSize: 15,
  cursor: "pointer",
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 24,
};

const secondaryLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 18px",
  borderRadius: 10,
  textDecoration: "none",
  fontWeight: 700,
  background: "#FFFFFF",
  color: "#101010",
  border: "1px solid #D1D5DB",
};
