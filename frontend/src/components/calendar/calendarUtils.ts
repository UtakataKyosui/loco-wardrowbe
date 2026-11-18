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
