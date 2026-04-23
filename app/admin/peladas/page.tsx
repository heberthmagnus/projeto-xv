import Link from "next/link";
import { getAuthenticatedAdmin } from "@/lib/auth";
import {
  getPeladaDurationRuleLabel,
  getFirstGameRuleLabel,
  getPeladaStatusLabel,
  getPeladaTypeLabel,
} from "@/lib/peladas";
import { prisma } from "@/lib/prisma";
import { ADMIN_PELADAS_PATH } from "@/lib/routes";
import { createPelada, deletePelada, updatePelada } from "./actions";
import { PeladaFeedbackBanner } from "./pelada-feedback";
import { PeladaForm } from "./pelada-form";
import { buildPeladaFormValues } from "./pelada-form-values";

type PeladasFilter = "today" | "upcoming" | "past" | "all";

type SearchParams = Promise<{
  success?: string;
  edit?: string;
  error?: string;
  warning?: string;
  filter?: string;
}>;

export default async function PeladasAdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const adminUser = await getAuthenticatedAdmin();

  const peladas = await prisma.pelada.findMany({
    include: {
      _count: {
        select: {
          confirmations: true,
          arrivals: true,
        },
      },
    },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
  });

  const classifiedPeladas = classifyPeladasForOperations(peladas);
  const focusPelada =
    classifiedPeladas.today[0] || classifiedPeladas.upcoming[0] || null;
  const defaultFilter: PeladasFilter =
    classifiedPeladas.today.length > 0 ? "today" : "upcoming";
  const activeFilter = resolvePeladasFilter(params.filter, defaultFilter);
  const filteredPeladas =
    activeFilter === "today"
      ? classifiedPeladas.today
      : activeFilter === "upcoming"
        ? classifiedPeladas.upcoming
        : activeFilter === "past"
          ? classifiedPeladas.past
          : classifiedPeladas.all;
  const editingPelada = peladas.find((pelada) => pelada.id === params.edit) || null;

  return (
    <main className="xv-page-shell">
      <div className="xv-page-container">
        <PeladaFeedbackBanner
          scope="admin-list"
          success={params.success}
          error={params.error}
          warning={params.warning}
        />

        <PeladaForm
          title="Criar pelada"
          description="Cadastre manualmente cada pelada para controlar data, horário, tipo e regras iniciais do dia."
          submitLabel="Salvar pelada"
          action={createPelada}
        />

        {editingPelada && (
          <div className="xv-card">
            <div style={editingHeaderStyle}>
              <div>
                <h2 style={sectionTitleStyle}>Editar informações da pelada</h2>
                <p style={sectionDescriptionStyle}>
                  Ajuste data, horário, status e regras da pelada mesmo depois da criação.
                </p>
              </div>

              <Link href={ADMIN_PELADAS_PATH} style={cancelEditLinkStyle}>
                Cancelar edição
              </Link>
            </div>

            <PeladaForm
              title={`Pelada de ${formatDate(editingPelada.scheduledAt)}`}
              description="Atualize os dados principais da pelada e salve novamente."
              submitLabel="Salvar alterações"
              action={updatePelada}
              initialValues={buildPeladaFormValues(editingPelada)}
            />
          </div>
        )}

        <section className="xv-card">
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Peladas cadastradas</h2>
              <p style={sectionDescriptionStyle}>
                Total de peladas: <strong>{peladas.length}</strong>
                {adminUser && (
                  <>
                    {" "}
                    • logado como <strong>{adminUser.email}</strong>
                  </>
                )}
              </p>
            </div>
          </div>

          {focusPelada ? (
            <div style={focusCardStyle}>
              <div style={focusCardHeaderStyle}>
                <div>
                  <p style={focusEyebrowStyle}>Em foco</p>
                  <h3 style={focusTitleStyle}>
                    {classifiedPeladas.today.length > 0
                      ? "Pelada de hoje"
                      : "Próxima pelada"}
                  </h3>
                  <p style={focusDescriptionStyle}>
                    {formatDate(focusPelada.scheduledAt)} às {formatTime(focusPelada.scheduledAt)}
                    {" • "}
                    {getPeladaTypeLabel(focusPelada.type)}
                    {" • "}
                    {getPeladaStatusLabel(focusPelada.status)}
                  </p>
                </div>

                <div style={focusStatsGridStyle}>
                  <MiniMetric
                    label="Confirmados"
                    value={String(focusPelada._count.confirmations)}
                  />
                  <MiniMetric
                    label="Chegadas"
                    value={String(focusPelada._count.arrivals)}
                  />
                </div>
              </div>

              <div style={focusActionsStyle}>
                <Link href={`/admin/peladas/${focusPelada.id}`} style={editSecondaryLinkStyle}>
                  Abrir operação
                </Link>
                <Link
                  href={buildPeladasFilterHref(activeFilter, {
                    ...params,
                    edit: focusPelada.id,
                  })}
                  style={editLinkStyle}
                >
                  Editar dados
                </Link>
              </div>
            </div>
          ) : (
            <div style={emptyFocusStyle}>
              Nenhuma pelada cadastrada para hoje ou para as próximas datas.
            </div>
          )}

          <div style={filterBarStyle}>
            {FILTER_OPTIONS.map((filterOption) => {
              const isActive = activeFilter === filterOption.value;

              return (
                <Link
                  key={filterOption.value}
                  href={buildPeladasFilterHref(filterOption.value, params)}
                  style={{
                    ...filterChipStyle,
                    ...(isActive ? activeFilterChipStyle : inactiveFilterChipStyle),
                  }}
                >
                  {filterOption.label}
                </Link>
              );
            })}
          </div>

          <p style={filterSummaryStyle}>
            Exibindo <strong>{filteredPeladas.length}</strong> pelada(s) em{" "}
            <strong>{getFilterLabel(activeFilter).toLowerCase()}</strong>.
          </p>

          <div className="xv-table-scroll">
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Data</th>
                  <th style={thStyle}>Horário</th>
                  <th style={thStyle}>Tipo</th>
                  <th style={thStyle}>Regra da primeira</th>
                  <th style={thStyle}>Horário limite</th>
                  <th style={thStyle}>Limite da primeira</th>
                  <th style={thStyle}>Duração</th>
                  <th style={thStyle}>Formação</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Confirmações</th>
                  <th style={thStyle}>Chegadas</th>
                  <th style={thStyle}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredPeladas.length === 0 ? (
                  <tr>
                    <td colSpan={12} style={emptyStyle}>
                      {getEmptyFilterMessage(activeFilter)}
                    </td>
                  </tr>
                ) : (
                  filteredPeladas.map((pelada) => (
                    <tr key={pelada.id}>
                      <td style={tdStyle}>
                        {formatDate(pelada.scheduledAt)}
                      </td>
                      <td style={tdStyle}>
                        {formatTime(pelada.scheduledAt)}
                      </td>
                      <td style={tdStyle}>{getPeladaTypeLabel(pelada.type)}</td>
                      <td style={tdStyle}>
                        {getFirstGameRuleLabel(pelada.firstGameRule)}
                      </td>
                      <td style={tdStyle}>{pelada.arrivalCutoffTime || "—"}</td>
                      <td style={tdStyle}>
                        {pelada.maxFirstGamePlayers ?? "—"}
                      </td>
                      <td style={tdStyle}>{getPeladaDurationRuleLabel(pelada.type)}</td>
                      <td style={tdStyle}>{pelada.linePlayersCount} de linha</td>
                      <td style={tdStyle}>
                        <span style={getStatusBadgeStyle(pelada.status)}>
                          {getPeladaStatusLabel(pelada.status)}
                        </span>
                      </td>
                      <td style={tdStyle}>{pelada._count.confirmations}</td>
                      <td style={tdStyle}>{pelada._count.arrivals}</td>
                      <td style={tdStyle}>
                        <div style={actionsStyle}>
                          <Link
                            href={`/admin/peladas/${pelada.id}`}
                            style={editLinkStyle}
                          >
                            Abrir
                          </Link>

                          <Link
                            href={`${ADMIN_PELADAS_PATH}?edit=${pelada.id}`}
                            style={editSecondaryLinkStyle}
                          >
                            Editar dados
                          </Link>

                          <form action={deletePelada}>
                            <input type="hidden" name="id" value={pelada.id} />
                            <button type="submit" style={deleteButtonStyle}>
                              Excluir
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div style={miniMetricStyle}>
      <span style={miniMetricLabelStyle}>{label}</span>
      <strong style={miniMetricValueStyle}>{value}</strong>
    </div>
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

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function getStatusBadgeStyle(
  status: "ABERTA" | "EM_ANDAMENTO" | "FINALIZADA" | "CANCELADA",
): React.CSSProperties {
  if (status === "FINALIZADA") {
    return {
      ...statusBadgeBaseStyle,
      background: "#ECFDF3",
      border: "1px solid #A7F3D0",
      color: "#047857",
    };
  }

  if (status === "CANCELADA") {
    return {
      ...statusBadgeBaseStyle,
      background: "#FEF2F2",
      border: "1px solid #FECACA",
      color: "#B91C1C",
    };
  }

  if (status === "EM_ANDAMENTO") {
    return {
      ...statusBadgeBaseStyle,
      background: "#FFFBEB",
      border: "1px solid #FCD34D",
      color: "#A16207",
    };
  }

  return {
    ...statusBadgeBaseStyle,
    background: "#EFF6FF",
    border: "1px solid #BFDBFE",
    color: "#1D4ED8",
  };
}

function getClubDayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function classifyPeladasForOperations<
  TPelada extends {
    scheduledAt: Date;
    createdAt: Date;
  },
>(peladas: TPelada[]) {
  const todayKey = getClubDayKey(new Date());
  const today: TPelada[] = [];
  const upcoming: TPelada[] = [];
  const past: TPelada[] = [];

  for (const pelada of peladas) {
    const peladaDayKey = getClubDayKey(pelada.scheduledAt);

    if (peladaDayKey === todayKey) {
      today.push(pelada);
      continue;
    }

    if (peladaDayKey > todayKey) {
      upcoming.push(pelada);
      continue;
    }

    past.push(pelada);
  }

  today.sort((left, right) => left.scheduledAt.getTime() - right.scheduledAt.getTime());
  upcoming.sort((left, right) => left.scheduledAt.getTime() - right.scheduledAt.getTime());
  past.sort((left, right) => right.scheduledAt.getTime() - left.scheduledAt.getTime());

  return {
    today,
    upcoming,
    past,
    all: [...today, ...upcoming, ...past],
  };
}

function resolvePeladasFilter(
  rawFilter: string | undefined,
  defaultFilter: PeladasFilter,
): PeladasFilter {
  if (rawFilter === "today" || rawFilter === "upcoming" || rawFilter === "past" || rawFilter === "all") {
    return rawFilter;
  }

  return defaultFilter;
}

function buildPeladasFilterHref(
  filter: PeladasFilter,
  params: {
    success?: string;
    edit?: string;
    error?: string;
    warning?: string;
    filter?: string;
  },
) {
  const nextParams = new URLSearchParams();

  if (params.edit) {
    nextParams.set("edit", params.edit);
  }

  nextParams.set("filter", filter);

  const query = nextParams.toString();
  return `${ADMIN_PELADAS_PATH}${query ? `?${query}` : ""}`;
}

function getFilterLabel(filter: PeladasFilter) {
  return FILTER_OPTIONS.find((option) => option.value === filter)?.label || "Todas";
}

function getEmptyFilterMessage(filter: PeladasFilter) {
  if (filter === "today") {
    return "Nenhuma pelada marcada para hoje.";
  }

  if (filter === "upcoming") {
    return "Nenhuma próxima pelada cadastrada.";
  }

  if (filter === "past") {
    return "Nenhuma pelada passada cadastrada.";
  }

  return "Nenhuma pelada cadastrada ainda.";
}

const sectionHeaderStyle: React.CSSProperties = {
  marginBottom: 18,
};

const focusCardStyle: React.CSSProperties = {
  marginBottom: 18,
  padding: 18,
  borderRadius: 18,
  border: "1px solid #E7C56A",
  background: "linear-gradient(180deg, #FFF8E7 0%, #FFFFFF 100%)",
  boxShadow: "0 10px 24px rgba(184, 144, 32, 0.08)",
};

const focusCardHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
};

const focusEyebrowStyle: React.CSSProperties = {
  margin: "0 0 6px",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#8B6914",
};

const focusTitleStyle: React.CSSProperties = {
  margin: "0 0 6px",
  fontSize: 22,
  color: "#101010",
};

const focusDescriptionStyle: React.CSSProperties = {
  margin: 0,
  color: "#4B5563",
  lineHeight: 1.6,
};

const focusStatsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(110px, 1fr))",
  gap: 10,
};

const miniMetricStyle: React.CSSProperties = {
  display: "grid",
  gap: 4,
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid #E5E7EB",
  background: "rgba(255, 255, 255, 0.92)",
};

const miniMetricLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "#6B7280",
};

const miniMetricValueStyle: React.CSSProperties = {
  fontSize: 20,
  color: "#101010",
};

const focusActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 16,
};

const emptyFocusStyle: React.CSSProperties = {
  marginBottom: 18,
  padding: "16px 18px",
  borderRadius: 16,
  border: "1px dashed #D1D5DB",
  background: "#FAFAFA",
  color: "#6B7280",
};

const filterBarStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 12,
};

const filterChipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 40,
  padding: "8px 14px",
  borderRadius: 999,
  border: "1px solid transparent",
  textDecoration: "none",
  fontWeight: 700,
  fontSize: 14,
};

const activeFilterChipStyle: React.CSSProperties = {
  background: "#101010",
  borderColor: "#101010",
  color: "#FFFFFF",
};

const inactiveFilterChipStyle: React.CSSProperties = {
  background: "#FFFFFF",
  borderColor: "#D1D5DB",
  color: "#374151",
};

const filterSummaryStyle: React.CSSProperties = {
  margin: "0 0 14px",
  color: "#4B5563",
  lineHeight: 1.6,
};

const editingHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 18,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: 24,
  color: "#101010",
};

const sectionDescriptionStyle: React.CSSProperties = {
  margin: 0,
  color: "#4B5563",
  lineHeight: 1.6,
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 980,
  borderCollapse: "collapse",
};

const thStyle: React.CSSProperties = {
  padding: "12px 14px",
  textAlign: "left",
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "#6B7280",
  borderBottom: "1px solid #E5E7EB",
  background: "#FAFAFA",
};

const tdStyle: React.CSSProperties = {
  padding: "14px",
  borderBottom: "1px solid #F3F4F6",
  color: "#101010",
  verticalAlign: "middle",
};

const emptyStyle: React.CSSProperties = {
  padding: "20px 16px",
  textAlign: "center",
  color: "#6B7280",
};

const statusBadgeBaseStyle: React.CSSProperties = {
  display: "inline-flex",
  padding: "6px 10px",
  borderRadius: 999,
  fontWeight: 700,
  fontSize: 13,
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const actionButtonBaseStyle: React.CSSProperties = {
  borderRadius: 10,
  padding: "9px 12px",
  fontWeight: 700,
  textDecoration: "none",
  fontSize: 14,
};

const editLinkStyle: React.CSSProperties = {
  ...actionButtonBaseStyle,
  border: "1px solid #D1D5DB",
  background: "#FFFFFF",
  color: "#101010",
};

const editSecondaryLinkStyle: React.CSSProperties = {
  ...actionButtonBaseStyle,
  border: "1px solid #D6B14B",
  background: "#FFF8E8",
  color: "#8B6914",
};

const cancelEditLinkStyle: React.CSSProperties = {
  ...actionButtonBaseStyle,
  border: "1px solid #D1D5DB",
  background: "#FFFFFF",
  color: "#101010",
};

const deleteButtonStyle: React.CSSProperties = {
  ...actionButtonBaseStyle,
  border: "1px solid #FCA5A5",
  background: "#FEF2F2",
  color: "#B91C1C",
  cursor: "pointer",
};

const FILTER_OPTIONS: Array<{
  value: PeladasFilter;
  label: string;
}> = [
  { value: "today", label: "Hoje" },
  { value: "upcoming", label: "Próximas" },
  { value: "past", label: "Passadas" },
  { value: "all", label: "Todas" },
];
