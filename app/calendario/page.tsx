import Link from "next/link";
import { connection } from "next/server";
import {
  CALENDAR_WEEKDAY_LABELS,
  COPA_TIO_HUGO_2026_EVENTS,
  filterCalendarEventsByMonth,
  filterCalendarEventsByYear,
  getCalendarDateKey,
  getCalendarDayLabel,
  getCalendarMonthGrid,
  getCalendarMonthLabel,
  getCalendarMonthShortLabel,
  getCalendarTimeLabel,
  INTERCLUBES_2026_EVENTS,
  getNextCalendarMonth,
  getPreviousCalendarMonth,
  normalizeCalendarMonth,
  type CalendarEventItem,
  type CalendarEventType,
} from "@/lib/calendar";
import { prisma } from "@/lib/prisma";
import { CALENDARIO_XV_PATH } from "@/lib/routes";

type SearchParams = Promise<{
  year?: string;
  month?: string;
  view?: string;
}>;

const EVENT_TYPE_META: Record<
  CalendarEventType,
  {
    label: string;
    background: string;
    border: string;
    color: string;
  }
> = {
  PELADA: {
    label: "Pelada",
    background: "#FCF7E6",
    border: "#F1D68A",
    color: "#8B6914",
  },
  COPA_TIO_HUGO: {
    label: "Copa Tio Hugo",
    background: "#EEF2FF",
    border: "#C7D2FE",
    color: "#4338CA",
  },
  INTERCLUBES: {
    label: "Interclubes",
    background: "#FFF1F2",
    border: "#FDA4AF",
    color: "#BE123C",
  },
  CAMPAO_INTERNO: {
    label: "Campão interno",
    background: "#ECFDF3",
    border: "#A7F3D0",
    color: "#047857",
  },
};

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await connection();

  const params = await searchParams;
  const { year, month } = normalizeCalendarMonth(params.year, params.month);
  const view = params.view === "year" ? "year" : "month";
  const previousMonth = getPreviousCalendarMonth(year, month);
  const nextMonth = getNextCalendarMonth(year, month);

  const peladas = await prisma.pelada.findMany({
    where: {
      status: {
        not: "CANCELADA",
      },
    },
    orderBy: [{ scheduledAt: "asc" }],
    select: {
      id: true,
      scheduledAt: true,
      status: true,
    },
  });

  const peladaEvents = peladas.map<CalendarEventItem>((pelada) => ({
    id: pelada.id,
    type: "PELADA",
    title: `Pelada • ${getCalendarTimeLabel(pelada.scheduledAt)}`,
    startsAt: pelada.scheduledAt,
    href: `/peladas/${pelada.id}`,
  }));

  const allEvents = [
    ...peladaEvents,
    ...COPA_TIO_HUGO_2026_EVENTS,
    ...INTERCLUBES_2026_EVENTS,
  ].sort(
    (left, right) => left.startsAt.getTime() - right.startsAt.getTime(),
  );
  const monthEvents = filterCalendarEventsByMonth(allEvents, year, month);
  const yearEvents = filterCalendarEventsByYear(allEvents, year);
  const monthGrid = getCalendarMonthGrid(year, month);
  const monthlyEventsByDate = buildEventsByDate(monthEvents);
  const yearlyEventsByDate = buildEventsByDate(yearEvents);
  const todayKey = getCalendarDateKey(new Date());
  const copaEventsInMonth = filterCalendarEventsByMonth(
    COPA_TIO_HUGO_2026_EVENTS,
    year,
    month,
  );
  const interclubesEventsInMonth = filterCalendarEventsByMonth(
    INTERCLUBES_2026_EVENTS,
    year,
    month,
  );
  const peladasInMonth = filterCalendarEventsByMonth(peladaEvents, year, month);

  return (
    <main className="xv-page-shell-soft">
      <div className="xv-page-container xv-page-container-medium">
        <section className="xv-calendar-hero" style={heroStyle}>
          <div style={badgeStyle}>Calendário do XV</div>
          <h1 style={titleStyle}>Agenda visual do clube</h1>
          <p style={descriptionStyle}>
            Acompanhe o mês ou o ano em formato visual e veja os dias com
            peladas, Copa Tio Hugo, Interclubes e, em breve, o campão interno.
          </p>
        </section>

        <section className="xv-card" style={sectionStyle}>
          <div className="xv-calendar-header" style={headerStyle}>
            <div>
              <h2 style={sectionTitleStyle}>
                {view === "month" ? getCalendarMonthLabel(year, month) : `Calendário ${year}`}
              </h2>
              <p style={sectionDescriptionStyle}>
                Peladas, Copa Tio Hugo e Interclubes já aparecem no calendário.
                O campão interno segue preparado para entrar quando as datas forem
                fechadas.
              </p>
            </div>

            <div className="xv-calendar-controls" style={headerControlsStyle}>
              <div className="xv-calendar-view-switch" style={viewSwitchStyle}>
                <Link
                  href={buildCalendarHref({ year, month, view: "month" })}
                  style={view === "month" ? activeViewButtonStyle : viewButtonStyle}
                >
                  Mensal
                </Link>
                <Link
                  href={buildCalendarHref({ year, month, view: "year" })}
                  style={view === "year" ? activeViewButtonStyle : viewButtonStyle}
                >
                  Anual
                </Link>
              </div>

              {view === "month" ? (
                <div className="xv-calendar-nav" style={navigationStyle}>
                  <Link
                    href={buildCalendarHref({
                      year: previousMonth.year,
                      month: previousMonth.month,
                      view,
                    })}
                    style={navButtonStyle}
                  >
                    Mês anterior
                  </Link>
                  <Link
                    href={buildCalendarHref({
                      year: nextMonth.year,
                      month: nextMonth.month,
                      view,
                    })}
                    style={navButtonStyle}
                  >
                    Próximo mês
                  </Link>
                </div>
              ) : null}
            </div>
          </div>

          <div style={legendStyle}>
            {(Object.keys(EVENT_TYPE_META) as CalendarEventType[]).map((type) => (
              <div key={type} style={legendItemStyle}>
                <span
                  style={{
                    ...legendSwatchStyle,
                    background: EVENT_TYPE_META[type].background,
                    borderColor: EVENT_TYPE_META[type].border,
                  }}
                />
                <span style={legendLabelStyle}>{EVENT_TYPE_META[type].label}</span>
              </div>
            ))}
          </div>

          <div className="xv-calendar-summary" style={monthSummaryStyle}>
            <div style={monthSummaryCardStyle}>
              <span style={monthSummaryLabelStyle}>
                {view === "month" ? "Eventos no mês" : "Eventos no ano"}
              </span>
              <strong style={monthSummaryValueStyle}>
                {view === "month" ? monthEvents.length : yearEvents.length}
              </strong>
            </div>
            <div style={monthSummaryCardStyle}>
              <span style={monthSummaryLabelStyle}>Peladas</span>
              <strong style={monthSummaryValueStyle}>
                {view === "month"
                  ? peladasInMonth.length
                  : filterCalendarEventsByYear(peladaEvents, year).length}
              </strong>
            </div>
            <div style={monthSummaryCardStyle}>
              <span style={monthSummaryLabelStyle}>Copa Tio Hugo</span>
              <strong style={monthSummaryValueStyle}>
                {view === "month"
                  ? copaEventsInMonth.length
                  : filterCalendarEventsByYear(COPA_TIO_HUGO_2026_EVENTS, year).length}
              </strong>
            </div>
            <div style={monthSummaryCardStyle}>
              <span style={monthSummaryLabelStyle}>Interclubes</span>
              <strong style={monthSummaryValueStyle}>
                {view === "month"
                  ? interclubesEventsInMonth.length
                  : filterCalendarEventsByYear(INTERCLUBES_2026_EVENTS, year).length}
              </strong>
            </div>
            <div style={monthSummaryCardStyle}>
              <span style={monthSummaryLabelStyle}>Campão interno</span>
              <strong style={monthSummaryValueStyle}>Em breve</strong>
            </div>
          </div>

          <div className="xv-calendar-note" style={infoNoticeStyle}>
            <strong style={infoNoticeTitleStyle}>Campão interno</strong>
            <p style={infoNoticeTextStyle}>
              A janela prevista segue entre agosto e o segundo domingo de dezembro.
              Assim que as datas forem fechadas, esse bloco entra no calendário com
              a cor verde já reservada na legenda.
            </p>
          </div>

          {view === "month" ? (
            <MonthlyCalendarView
              monthGrid={monthGrid}
              eventsByDate={monthlyEventsByDate}
              todayKey={todayKey}
            />
          ) : (
            <YearCalendarView
              year={year}
              eventsByDate={yearlyEventsByDate}
              todayKey={todayKey}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function MonthlyCalendarView({
  monthGrid,
  eventsByDate,
  todayKey,
}: {
  monthGrid: ReturnType<typeof getCalendarMonthGrid>;
  eventsByDate: Map<string, CalendarEventItem[]>;
  todayKey: string;
}) {
  return (
    <div className="xv-table-scroll">
      <div className="xv-calendar-month-frame" style={calendarFrameStyle}>
        <div className="xv-calendar-weekdays" style={weekdayHeaderRowStyle}>
          {CALENDAR_WEEKDAY_LABELS.map((label, index) => (
            <div
              key={`${label}-${index}`}
              className="xv-calendar-weekday-cell"
              style={weekdayHeaderCellStyle}
            >
              {label}
            </div>
          ))}
        </div>

        <div style={weeksStackStyle}>
          {monthGrid.map((week, weekIndex) => (
            <div key={`week-${weekIndex}`} style={weekRowStyle}>
              {week.map((day) => {
                const dateKey = getCalendarDateKey(day.date);
                const events = eventsByDate.get(dateKey) || [];

                return (
                  <CalendarDayCell
                    key={dateKey}
                    day={day}
                    dateKey={dateKey}
                    events={events}
                    todayKey={todayKey}
                    compact={false}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function YearCalendarView({
  year,
  eventsByDate,
  todayKey,
}: {
  year: number;
  eventsByDate: Map<string, CalendarEventItem[]>;
  todayKey: string;
}) {
  return (
    <div className="xv-calendar-year-grid" style={yearGridStyle}>
      {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => {
        const monthGrid = getCalendarMonthGrid(year, month);

        return (
          <Link
            key={`mini-${month}`}
            href={buildCalendarHref({ year, month, view: "month" })}
            className="xv-calendar-mini-month"
            style={miniMonthCardStyle}
          >
            <div style={miniMonthHeaderStyle}>
              <strong style={miniMonthTitleStyle}>
                {getCalendarMonthShortLabel(month)}
              </strong>
            </div>

            <div style={miniWeekdayHeaderRowStyle}>
              {CALENDAR_WEEKDAY_LABELS.map((label, index) => (
                <div key={`${month}-${label}-${index}`} style={miniWeekdayHeaderCellStyle}>
                  {label}
                </div>
              ))}
            </div>

            <div style={miniWeeksStackStyle}>
              {monthGrid.map((week, weekIndex) => (
                <div key={`mini-week-${month}-${weekIndex}`} style={miniWeekRowStyle}>
                  {week.map((day) => {
                    const dateKey = getCalendarDateKey(day.date);
                    const events = eventsByDate.get(dateKey) || [];

                    return (
                      <CalendarDayCell
                        key={`mini-${dateKey}`}
                        day={day}
                        dateKey={dateKey}
                        events={events}
                        todayKey={todayKey}
                        compact
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function CalendarDayCell({
  day,
  dateKey,
  events,
  todayKey,
  compact,
}: {
  day: { date: Date; inCurrentMonth: boolean };
  dateKey: string;
  events: CalendarEventItem[];
  todayKey: string;
  compact: boolean;
}) {
  const hasEvents = events.length > 0;
  const compactEventTypes = compact ? getCompactEventTypes(events) : [];

  return (
    <div
      className={compact ? "xv-calendar-mini-day" : "xv-calendar-day"}
      style={{
        ...(compact ? miniDayCellStyle : dayCellStyle),
        ...(day.inCurrentMonth ? currentMonthDayStyle : outsideMonthDayStyle),
        ...(hasEvents ? (compact ? compactEventDayStyle : eventDayStyle) : null),
        ...(dateKey === todayKey ? todayStyle : null),
      }}
    >
      <div style={compact ? miniDayNumberRowStyle : dayNumberRowStyle}>
        <span style={compact ? miniDayNumberStyle : dayNumberStyle}>
          {getCalendarDayLabel(day.date)}
        </span>
        {!compact && hasEvents ? <span style={eventCountStyle}>{events.length}</span> : null}
      </div>

      {compact && hasEvents ? (
        <div style={miniEventDotsRowStyle}>
          {compactEventTypes.map((type) => (
            <span
              key={`${dateKey}-${type}`}
              title={EVENT_TYPE_META[type].label}
              style={{
                ...miniEventTypeDotStyle,
                background: EVENT_TYPE_META[type].color,
              }}
            />
          ))}
          {events.length > compactEventTypes.length ? (
            <span style={miniMoreEventsCountStyle}>+{events.length - compactEventTypes.length}</span>
          ) : null}
        </div>
      ) : null}

      {!compact ? (
        <div style={eventsStackStyle}>
          {events.slice(0, 3).map((event) => {
            const eventStyle = {
              ...eventPillStyle,
              background: EVENT_TYPE_META[event.type].background,
              borderColor: EVENT_TYPE_META[event.type].border,
              color: EVENT_TYPE_META[event.type].color,
            };

            if (event.href) {
              return (
                <Link
                  key={event.id}
                  href={event.href}
                  target={event.external ? "_blank" : undefined}
                  rel={event.external ? "noreferrer noopener" : undefined}
                  style={eventStyle}
                >
                  {event.title}
                </Link>
              );
            }

            return (
              <span key={event.id} style={eventStyle}>
                {event.title}
              </span>
            );
          })}

          {events.length > 3 ? (
            <span style={moreEventsStyle}>+{events.length - 3} eventos</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function buildEventsByDate(events: CalendarEventItem[]) {
  const eventsByDate = new Map<string, CalendarEventItem[]>();

  for (const event of events) {
    const dateKey = getCalendarDateKey(event.startsAt);
    const list = eventsByDate.get(dateKey) || [];
    list.push(event);
    eventsByDate.set(dateKey, list);
  }

  return eventsByDate;
}

function getCompactEventTypes(events: CalendarEventItem[]) {
  return Array.from(new Set(events.map((event) => event.type))).slice(0, 3);
}

function buildCalendarHref(args: {
  year: number;
  month: number;
  view: "month" | "year";
}) {
  return `${CALENDARIO_XV_PATH}?year=${args.year}&month=${args.month}&view=${args.view}`;
}

const heroStyle: React.CSSProperties = {
  background: "#1A1A1A",
  color: "#FFFFFF",
  borderRadius: 18,
  padding: "clamp(18px, 3vw, 24px)",
  boxShadow: "0 18px 40px rgba(0,0,0,0.14)",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(184, 144, 32, 0.16)",
  color: "#F3D27A",
  fontWeight: 700,
  marginBottom: 14,
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 10px",
  fontSize: "clamp(26px, 5vw, 32px)",
};

const descriptionStyle: React.CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.86)",
  lineHeight: 1.6,
};

const sectionStyle: React.CSSProperties = {
  display: "grid",
  gap: 18,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  flexWrap: "wrap",
};

const headerControlsStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
  justifyItems: "end",
  width: "100%",
  maxWidth: 360,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: "clamp(24px, 4vw, 30px)",
  color: "#101010",
};

const sectionDescriptionStyle: React.CSSProperties = {
  margin: 0,
  color: "#4B5563",
  lineHeight: 1.6,
  maxWidth: 760,
};

const navigationStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const viewSwitchStyle: React.CSSProperties = {
  display: "inline-flex",
  borderRadius: 12,
  background: "#F3F4F6",
  padding: 4,
  gap: 4,
};

const viewButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 38,
  padding: "8px 12px",
  borderRadius: 10,
  color: "#374151",
  textDecoration: "none",
  fontWeight: 700,
};

const activeViewButtonStyle: React.CSSProperties = {
  ...viewButtonStyle,
  background: "#FFFFFF",
  color: "#101010",
  boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
};

const navButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 42,
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #D1D5DB",
  background: "#FFFFFF",
  color: "#101010",
  fontWeight: 700,
  textDecoration: "none",
};

const legendStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

const legendItemStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 10px",
  borderRadius: 999,
  background: "#FAFAFA",
  border: "1px solid #E5E7EB",
};

const legendSwatchStyle: React.CSSProperties = {
  width: 14,
  height: 14,
  borderRadius: 999,
  border: "1px solid transparent",
  flexShrink: 0,
};

const legendLabelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#374151",
};

const monthSummaryStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 12,
};

const monthSummaryCardStyle: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid #E5E7EB",
  background: "#FAFAFA",
  padding: "12px 14px",
  display: "grid",
  gap: 4,
};

const monthSummaryLabelStyle: React.CSSProperties = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#8B6914",
  fontWeight: 700,
};

const monthSummaryValueStyle: React.CSSProperties = {
  fontSize: 22,
  lineHeight: 1,
  color: "#111827",
};

const infoNoticeStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
  padding: "14px 16px",
  borderRadius: 14,
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
};

const infoNoticeTitleStyle: React.CSSProperties = {
  color: "#111827",
};

const infoNoticeTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#4B5563",
  lineHeight: 1.6,
};

const calendarFrameStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
  minWidth: 700,
};

const weekdayHeaderRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: 8,
};

const weekdayHeaderCellStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "10px 0",
  borderRadius: 10,
  background: "#FCF7E6",
  color: "#8B6914",
  fontWeight: 800,
  fontSize: 14,
};

const weeksStackStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const weekRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: 8,
};

const dayCellStyle: React.CSSProperties = {
  minHeight: "clamp(100px, 14vw, 138px)",
  borderRadius: 14,
  border: "1px solid #E5E7EB",
  padding: 10,
  display: "grid",
  alignContent: "start",
  gap: 10,
};

const miniDayCellStyle: React.CSSProperties = {
  minHeight: 36,
  borderRadius: 8,
  border: "1px solid #E5E7EB",
  padding: "4px 5px",
  display: "grid",
  alignContent: "start",
  gap: 3,
};

const currentMonthDayStyle: React.CSSProperties = {
  background: "#FFFFFF",
};

const outsideMonthDayStyle: React.CSSProperties = {
  background: "#F9FAFB",
  color: "#9CA3AF",
};

const eventDayStyle: React.CSSProperties = {
  borderColor: "#E7C96F",
  boxShadow: "0 10px 22px rgba(184, 144, 32, 0.08)",
};

const compactEventDayStyle: React.CSSProperties = {
  background: "#FFFCF3",
  borderColor: "#F1D68A",
};

const todayStyle: React.CSSProperties = {
  borderColor: "#B89020",
  boxShadow: "inset 0 0 0 1px #B89020",
};

const dayNumberRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
};

const miniDayNumberRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "center",
  gap: 4,
};

const dayNumberStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 800,
  color: "inherit",
};

const miniDayNumberStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  color: "inherit",
};

const eventCountStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 24,
  height: 24,
  padding: "0 7px",
  borderRadius: 999,
  background: "#1A1A1A",
  color: "#FFFFFF",
  fontSize: 12,
  fontWeight: 800,
};

const miniEventDotsRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 3,
  minHeight: 8,
};

const miniEventTypeDotStyle: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: 999,
  flexShrink: 0,
};

const miniMoreEventsCountStyle: React.CSSProperties = {
  fontSize: 8,
  fontWeight: 800,
  color: "#6B7280",
  lineHeight: 1,
};

const eventsStackStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
  alignContent: "start",
};

const eventPillStyle: React.CSSProperties = {
  display: "block",
  padding: "6px 8px",
  borderRadius: 10,
  border: "1px solid transparent",
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.35,
  textDecoration: "none",
};

const moreEventsStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#6B7280",
  fontWeight: 700,
};

const yearGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 14,
};

const miniMonthCardStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
  padding: 12,
  borderRadius: 14,
  border: "1px solid #E5E7EB",
  background: "#FFFFFF",
  textDecoration: "none",
  boxShadow: "0 8px 20px rgba(0,0,0,0.04)",
};

const miniMonthHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const miniMonthTitleStyle: React.CSSProperties = {
  color: "#101010",
  fontSize: 15,
};

const miniWeekdayHeaderRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: 4,
};

const miniWeekdayHeaderCellStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "4px 0",
  borderRadius: 6,
  background: "#FCF7E6",
  color: "#8B6914",
  fontWeight: 800,
  fontSize: 10,
};

const miniWeeksStackStyle: React.CSSProperties = {
  display: "grid",
  gap: 4,
};

const miniWeekRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: 4,
};
