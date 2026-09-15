export type QuickRangeKey =
  | "all"
  | "today"
  | "yesterday"
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "lastYear"
  | "last7Days"
  | "last30Days"
  | "last90Days"
  | "custom";

export function getMonthRange(year: number, month: number): { start: string; end: string } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);

  const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`;
  const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;

  return { start: startStr, end: endStr };
}

export function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date();
  return getMonthRange(now.getFullYear(), now.getMonth());
}

export function getLastMonthRange(): { start: string; end: string } {
  const now = new Date();
  return getMonthRange(now.getFullYear(), now.getMonth() - 1);
}

function formatDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getQuickDateRange(key: QuickRangeKey): { start: string; end: string } {
  const now = new Date();
  const todayStr = formatDateISO(now);

  switch (key) {
    case "all":
      return { start: "2000-01-01", end: todayStr };
    case "today":
      return { start: todayStr, end: todayStr };
    case "yesterday": {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const yestStr = formatDateISO(yest);
      return { start: yestStr, end: yestStr };
    }
    case "thisWeek": {
      const day = now.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { start: formatDateISO(monday), end: formatDateISO(sunday) };
    }
    case "lastWeek": {
      const day = now.getDay();
      const diffToMonday = (day === 0 ? -6 : 1 - day) - 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { start: formatDateISO(monday), end: formatDateISO(sunday) };
    }
    case "thisMonth":
      return getCurrentMonthRange();
    case "lastMonth":
      return getLastMonthRange();
    case "thisYear": {
      const y = now.getFullYear();
      return { start: `${y}-01-01`, end: `${y}-12-31` };
    }
    case "lastYear": {
      const y = now.getFullYear() - 1;
      return { start: `${y}-01-01`, end: `${y}-12-31` };
    }
    case "last7Days": {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      return { start: formatDateISO(d), end: todayStr };
    }
    case "last30Days": {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      return { start: formatDateISO(d), end: todayStr };
    }
    case "last90Days": {
      const d = new Date(now);
      d.setDate(d.getDate() - 89);
      return { start: formatDateISO(d), end: todayStr };
    }
    default:
      return getCurrentMonthRange();
  }
}

export function detectRangeMode(range: { start: string; end: string }): QuickRangeKey {
  const presets: QuickRangeKey[] = [
    "thisMonth",
    "lastMonth",
    "today",
    "yesterday",
    "thisWeek",
    "lastWeek",
    "thisYear",
    "lastYear",
    "last7Days",
    "last30Days",
    "last90Days",
    "all",
  ];

  for (const p of presets) {
    const r = getQuickDateRange(p);
    if (r.start === range.start && r.end === range.end) {
      return p;
    }
  }

  return "custom";
}
