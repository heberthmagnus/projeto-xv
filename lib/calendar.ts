import { getTioHugoBasePath } from "@/lib/championships";

export type CalendarEventType =
  | "PELADA"
  | "COPA_TIO_HUGO"
  | "CAMPAO_INTERNO"
  | "INTERCLUBES";

export type CalendarEventItem = {
  id: string;
  type: CalendarEventType;
  title: string;
  startsAt: Date;
  href?: string;
  external?: boolean;
};

export const COPA_TIO_HUGO_2026_EVENTS: CalendarEventItem[] = [
  {
    id: "copa-tio-hugo-2026-r1",
    type: "COPA_TIO_HUGO",
    title: "Copa • Rodada 1",
    startsAt: new Date("2026-05-07T19:00:00-03:00"),
    href: `${getTioHugoBasePath()}?view=1`,
  },
  {
    id: "copa-tio-hugo-2026-r2",
    type: "COPA_TIO_HUGO",
    title: "Copa • Rodada 2",
    startsAt: new Date("2026-05-14T19:00:00-03:00"),
    href: `${getTioHugoBasePath()}?view=2`,
  },
  {
    id: "copa-tio-hugo-2026-r3",
    type: "COPA_TIO_HUGO",
    title: "Copa • Rodada 3",
    startsAt: new Date("2026-05-21T19:00:00-03:00"),
    href: `${getTioHugoBasePath()}?view=3`,
  },
  {
    id: "copa-tio-hugo-2026-r4",
    type: "COPA_TIO_HUGO",
    title: "Copa • Rodada 4",
    startsAt: new Date("2026-05-28T19:00:00-03:00"),
    href: `${getTioHugoBasePath()}?view=4`,
  },
  {
    id: "copa-tio-hugo-2026-r5",
    type: "COPA_TIO_HUGO",
    title: "Copa • Rodada 5",
    startsAt: new Date("2026-06-11T19:00:00-03:00"),
    href: `${getTioHugoBasePath()}?view=5`,
  },
  {
    id: "copa-tio-hugo-2026-semifinal",
    type: "COPA_TIO_HUGO",
    title: "Copa • Semifinal",
    startsAt: new Date("2026-06-18T19:00:00-03:00"),
    href: `${getTioHugoBasePath()}?view=6`,
  },
  {
    id: "copa-tio-hugo-2026-final",
    type: "COPA_TIO_HUGO",
    title: "Copa • Final",
    startsAt: new Date("2026-06-25T19:00:00-03:00"),
    href: `${getTioHugoBasePath()}?view=7`,
  },
];

export const INTERCLUBES_2026_EVENTS: CalendarEventItem[] = [
  {
    id: "interclubes-2026-fase1-r1",
    type: "INTERCLUBES",
    title: "Interclubes • 1ª fase",
    startsAt: new Date("2026-03-07T12:00:00-03:00"),
    href: "https://copafacil.com/interclubesbhrm2026",
    external: true,
  },
  {
    id: "interclubes-2026-fase1-r2",
    type: "INTERCLUBES",
    title: "Interclubes • 1ª fase",
    startsAt: new Date("2026-03-14T12:00:00-03:00"),
    href: "https://copafacil.com/interclubesbhrm2026",
    external: true,
  },
  {
    id: "interclubes-2026-fase1-r3",
    type: "INTERCLUBES",
    title: "Interclubes • 1ª fase",
    startsAt: new Date("2026-03-28T12:00:00-03:00"),
    href: "https://copafacil.com/interclubesbhrm2026",
    external: true,
  },
  {
    id: "interclubes-2026-fase1-r4",
    type: "INTERCLUBES",
    title: "Interclubes • 1ª fase",
    startsAt: new Date("2026-04-11T12:00:00-03:00"),
    href: "https://copafacil.com/interclubesbhrm2026",
    external: true,
  },
  {
    id: "interclubes-2026-fase1-r5",
    type: "INTERCLUBES",
    title: "Interclubes • 1ª fase",
    startsAt: new Date("2026-04-25T12:00:00-03:00"),
    href: "https://copafacil.com/interclubesbhrm2026",
    external: true,
  },
  {
    id: "interclubes-2026-fase1-r6",
    type: "INTERCLUBES",
    title: "Interclubes • 1ª fase",
    startsAt: new Date("2026-05-09T12:00:00-03:00"),
    href: "https://copafacil.com/interclubesbhrm2026",
    external: true,
  },
  {
    id: "interclubes-2026-quartas",
    type: "INTERCLUBES",
    title: "Interclubes • Quartas",
    startsAt: new Date("2026-05-16T12:00:00-03:00"),
    href: "https://copafacil.com/interclubesbhrm2026",
    external: true,
  },
  {
    id: "interclubes-2026-semifinais",
    type: "INTERCLUBES",
    title: "Interclubes • Semi",
    startsAt: new Date("2026-05-23T12:00:00-03:00"),
    href: "https://copafacil.com/interclubesbhrm2026",
    external: true,
  },
  {
    id: "interclubes-2026-final",
    type: "INTERCLUBES",
    title: "Interclubes • Final",
    startsAt: new Date("2026-05-30T12:00:00-03:00"),
    href: "https://copafacil.com/interclubesbhrm2026",
    external: true,
  },
];

type CalendarDay = {
  date: Date;
  inCurrentMonth: boolean;
};

export const CALENDAR_WEEKDAY_LABELS = ["S", "T", "Q", "Q", "S", "S", "D"];

const MONTH_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

const MONTH_ONLY_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  timeZone: "America/Sao_Paulo",
});

const DAY_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  timeZone: "America/Sao_Paulo",
});

const TIME_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

const PARTS_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export function normalizeCalendarMonth(inputYear?: string, inputMonth?: string) {
  const today = new Date();
  const currentYear = Number(
    new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      timeZone: "America/Sao_Paulo",
    }).format(today),
  );
  const currentMonth = Number(
    new Intl.DateTimeFormat("en-US", {
      month: "numeric",
      timeZone: "America/Sao_Paulo",
    }).format(today),
  );

  let year = Number(inputYear);
  let month = Number(inputMonth);

  if (!Number.isInteger(year) || year < 2020 || year > 2100) {
    year = currentYear;
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    month = currentMonth;
  }

  return { year, month };
}

export function getCalendarMonthLabel(year: number, month: number) {
  const label = MONTH_FORMATTER.format(getCalendarMonthAnchorDate(year, month));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function getCalendarMonthShortLabel(month: number) {
  const label = MONTH_ONLY_FORMATTER.format(getCalendarMonthAnchorDate(2026, month));
  return label.charAt(0).toUpperCase() + label.slice(1, 3);
}

export function getCalendarDayLabel(date: Date) {
  return DAY_FORMATTER.format(date);
}

export function getCalendarTimeLabel(date: Date) {
  return TIME_FORMATTER.format(date);
}

export function getCalendarDateKey(date: Date) {
  const parts = PARTS_FORMATTER.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";

  return `${year}-${month}-${day}`;
}

export function filterCalendarEventsByMonth(
  events: CalendarEventItem[],
  year: number,
  month: number,
) {
  return events.filter((event) => {
    const dateKey = getCalendarDateKey(event.startsAt);
    const [eventYear, eventMonth] = dateKey.split("-").map(Number);

    return eventYear === year && eventMonth === month;
  });
}

export function filterCalendarEventsByYear(
  events: CalendarEventItem[],
  year: number,
) {
  return events.filter((event) => {
    const dateKey = getCalendarDateKey(event.startsAt);
    const [eventYear] = dateKey.split("-").map(Number);

    return eventYear === year;
  });
}

export function getCalendarMonthGrid(year: number, month: number) {
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);
  const leadingDays = getMondayFirstIndex(firstDayOfMonth);
  const trailingDays = 6 - getMondayFirstIndex(lastDayOfMonth);

  const startDate = new Date(year, month - 1, 1 - leadingDays);
  const totalDays = leadingDays + lastDayOfMonth.getDate() + trailingDays;
  const days: CalendarDay[] = [];

  for (let offset = 0; offset < totalDays; offset += 1) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + offset);

    days.push({
      date,
      inCurrentMonth: date.getMonth() === month - 1,
    });
  }

  const weeks: CalendarDay[][] = [];

  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  return weeks;
}

export function getPreviousCalendarMonth(year: number, month: number) {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }

  return { year, month: month - 1 };
}

export function getNextCalendarMonth(year: number, month: number) {
  if (month === 12) {
    return { year: year + 1, month: 1 };
  }

  return { year, month: month + 1 };
}

function getMondayFirstIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

function getCalendarMonthAnchorDate(year: number, month: number) {
  return new Date(`${year}-${String(month).padStart(2, "0")}-01T12:00:00-03:00`);
}
