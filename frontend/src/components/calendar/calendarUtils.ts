export const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export type Cell = { iso: string; day: number; inMonth: boolean; weekday: number };

export const pad = (n: number) => String(n).padStart(2, "0");
export const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
export const monthKey = (y: number, m: number) => `${y}-${pad(m + 1)}`;
export const parseIso = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m: m - 1, d };
};

/** Full-week month grid (Sunday first), padded with neighbouring-month days. */
export function buildMonthGrid(year: number, month: number): Cell[] {
  const lead = new Date(year, month, 1).getDay();
  const total = Math.ceil((lead + new Date(year, month + 1, 0).getDate()) / 7) * 7;
  return Array.from({ length: total }, (_, i) => {
    const date = new Date(year, month, 1 - lead + i);
    return {
      iso: toIso(date.getFullYear(), date.getMonth(), date.getDate()),
      day: date.getDate(),
      inMonth: date.getMonth() === month,
      weekday: date.getDay(),
    };
  });
}

export const WEEKDAYS_LONG = [
  "日曜日",
  "月曜日",
  "火曜日",
  "水曜日",
  "木曜日",
  "金曜日",
  "土曜日",
] as const;

/** "11月19日 木曜日" (spoken date, no year). */
export function dateLabel(iso: string): string {
  const { y, m, d } = parseIso(iso);
  return `${m + 1}月${d}日 ${WEEKDAYS_LONG[new Date(y, m, d).getDay()]}`;
}

/** Move `iso` by whole days. */
export function addDays(iso: string, n: number): string {
  const { y, m, d } = parseIso(iso);
  const t = new Date(y, m, d + n);
  return toIso(t.getFullYear(), t.getMonth(), t.getDate());
}

/** Move `iso` by whole months, clamping the day to the target month's length. */
export function addMonths(iso: string, n: number): string {
  const { y, m, d } = parseIso(iso);
  const last = new Date(y, m + n + 1, 0);
  return toIso(last.getFullYear(), last.getMonth(), Math.min(d, last.getDate()));
}
