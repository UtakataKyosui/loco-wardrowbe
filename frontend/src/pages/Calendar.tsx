import { Stack } from "lism-css/react";
import { useMemo, useState } from "react";
import "../components/calendar/calendar.css";
import { AnalyticsCard } from "../components/calendar/AnalyticsCard";
import { LowRotation } from "../components/calendar/LowRotation";
import { MonthGrid } from "../components/calendar/MonthGrid";
import { MonthHeader } from "../components/calendar/MonthHeader";
import { SelectedDay } from "../components/calendar/SelectedDay";
import { buildMonthGrid, dateLabel, monthKey, parseIso } from "../components/calendar/calendarUtils";
import { MOCK_TODAY, calendarOutfits, lowRotationItems, monthAnalytics, wearLogs } from "../mocks/calendar";

const MONTHS_EN = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

export function Calendar() {
  const t = parseIso(MOCK_TODAY);
  const [view, setView] = useState({ year: t.y, month: t.m });
  const [selected, setSelected] = useState(MOCK_TODAY);
  const [focusIso, setFocusIso] = useState(MOCK_TODAY);
  const [announcement, setAnnouncement] = useState("");

  const key = monthKey(view.year, view.month);
  const cells = useMemo(() => buildMonthGrid(view.year, view.month), [view]);
  const logByDate = useMemo(() => new Map(wearLogs.map((l) => [l.date, l])), []);
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const wornDates = useMemo(
    () => new Set(wearLogs.filter((l) => l.date.startsWith(key)).map((l) => l.date)),
    [key],
  );
  const allWorn = useMemo(() => new Set(wearLogs.map((l) => l.date)), []);
  const stats = monthAnalytics[key];
  const utilization = stats?.utilization ?? Math.round((wornDates.size / daysInMonth) * 100);

  const shift = (delta: number) => {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
    const first = `${monthKey(d.getFullYear(), d.getMonth())}-01`;
    setSelected(first);
    setFocusIso(first);
    setAnnouncement(`${d.getFullYear()}年${d.getMonth() + 1}月を表示`);
  };
  const select = (iso: string) => {
    setSelected(iso);
    setFocusIso(iso);
    setAnnouncement(`${dateLabel(iso)}を選択、${wearLogs.some((l) => l.date === iso) ? "着用記録あり" : "着用記録なし"}`);
  };
  const focusDate = (iso: string) => {
    const p = parseIso(iso);
    if (p.y !== view.year || p.m !== view.month) {
      setView({ year: p.y, month: p.m });
      setAnnouncement(`${p.y}年${p.m + 1}月を表示`);
    }
    setFocusIso(iso);
  };
  const log = logByDate.get(selected);
  const outfit = calendarOutfits.find((o) => o.id === log?.outfitId);

  return (
    <Stack g="40">
      <div role="status" className="u-visually-hidden">{announcement}</div>
      <MonthHeader
        year={view.year}
        month={view.month}
        onPrev={() => shift(-1)}
        onNext={() => shift(1)}
        onToday={() => {
          setView({ year: t.y, month: t.m });
          setSelected(MOCK_TODAY);
          setFocusIso(MOCK_TODAY);
          setAnnouncement(`${t.y}年${t.m + 1}月を表示`);
        }}
      />
      <AnalyticsCard
        utilization={utilization}
        wornDays={wornDates.size}
        totalDays={daysInMonth}
        topItem={stats?.topItem ?? "—"}
        topItemCount={stats?.topItemCount ?? 0}
      />
      <MonthGrid
        cells={cells}
        monthEnglish={MONTHS_EN[view.month]}
        wornDates={allWorn}
        selected={selected}
        focusIso={focusIso}
        today={MOCK_TODAY}
        onSelect={select}
        onFocusDate={focusDate}
      />
      <SelectedDay iso={selected} isToday={selected === MOCK_TODAY} log={log} outfit={outfit} />
      <LowRotation items={lowRotationItems} />
    </Stack>
  );
}
