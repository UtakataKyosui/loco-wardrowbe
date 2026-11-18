import { Badge, Card } from "@utakata-ui/react";
import { Flex } from "lism-css/react";
import { useEffect, useId, useRef, type KeyboardEvent } from "react";
import { WEEKDAYS, WEEKDAYS_LONG, addDays, addMonths, dateLabel, type Cell } from "./calendarUtils";

type Props = {
  cells: Cell[];
  monthEnglish: string;
  /** ISO dates with a wear log (all months). */
  wornDates: Set<string>;
  selected: string;
  /** Roving-tabindex target; always inside the displayed month. */
  focusIso: string;
  today: string;
  onSelect: (iso: string) => void;
  onFocusDate: (iso: string) => void;
};

export function MonthGrid({ cells, monthEnglish, wornDates, selected, focusIso, today, onSelect, onFocusDate }: Props) {
  const headingId = useId();
  const gridRef = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(false);

  // After a keyboard move, DOM focus follows the roving target (also across month changes).
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-iso="${focusIso}"]`)?.focus();
  }, [focusIso, cells]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.metaKey) return;
    const col = new Date(`${focusIso}T00:00:00`).getDay();
    let next: string | null = null;
    switch (e.key) {
      case "ArrowLeft": next = addDays(focusIso, -1); break;
      case "ArrowRight": next = addDays(focusIso, 1); break;
      case "ArrowUp": next = addDays(focusIso, -7); break;
      case "ArrowDown": next = addDays(focusIso, 7); break;
      case "Home": next = addDays(focusIso, -col); break;
      case "End": next = addDays(focusIso, 6 - col); break;
      case "PageUp": next = addMonths(focusIso, e.shiftKey ? -12 : -1); break;
      case "PageDown": next = addMonths(focusIso, e.shiftKey ? 12 : 1); break;
      default: return;
    }
    e.preventDefault();
    moveFocus.current = true;
    onFocusDate(next);
  };

  const weeks: Cell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <Card.Root className="c--cal-card" role="region" aria-labelledby={headingId}>
      <Flex jc="between" ai="center" mb="20" fxw="wrap" g="10">
        <h2 id={headingId} className="c--cal-h2">
          <span>着用カレンダー</span>
          <Badge lang="en" className="c--cal-month-badge">{monthEnglish}</Badge>
        </h2>
        <Flex g="20" className="c--cal-muted" style={{ fontSize: 11 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span className="c--cal-dot is-worn" style={{ width: 8, height: 8 }} aria-hidden="true" /> 記録済
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span className="c--cal-dot" style={{ width: 8, height: 8, background: "var(--surface-high)", border: "1px solid var(--primary)" }} aria-hidden="true" /> 選択中
          </span>
        </Flex>
      </Flex>
      {/* ARIA date grid: arrows/Home/End/PageUp/PageDown move focus, Enter/Space select. */}
      <div ref={gridRef} role="grid" aria-labelledby={headingId} className="c--cal-gridwrap" onKeyDown={onKeyDown}>
        <div role="row" className="c--cal-grid c--cal-muted c--cal-weekdays">
          {WEEKDAYS.map((w, i) => (
            <div key={w} role="columnheader" className={i === 0 ? "is-sun" : i === 6 ? "is-sat" : undefined}>
              <abbr title={WEEKDAYS_LONG[i]}>{w}</abbr>
            </div>
          ))}
        </div>
        {weeks.map((week) => (
          <div key={week[0].iso} role="row" className="c--cal-grid">
            {week.map((c) => {
              if (!c.inMonth) {
                return (
                  <div key={c.iso} role="gridcell" className="c--cal-fill">
                    <span aria-hidden="true">{c.day}</span>
                  </div>
                );
              }
              const worn = wornDates.has(c.iso);
              const isToday = c.iso === today;
              const label = [dateLabel(c.iso), isToday && "今日", worn ? "記録あり" : "記録なし"].filter(Boolean).join("、");
              return (
                <div key={c.iso} role="gridcell" aria-selected={c.iso === selected}>
                  <button
                    type="button"
                    data-iso={c.iso}
                    tabIndex={c.iso === focusIso ? 0 : -1}
                    aria-current={isToday ? "date" : undefined}
                    aria-label={label}
                    className={[
                      "c--cal-day",
                      c.weekday === 0 && "is-sun",
                      c.weekday === 6 && "is-sat",
                      isToday && "is-today",
                      c.iso === selected && "is-selected",
                    ].filter(Boolean).join(" ")}
                    onClick={() => onSelect(c.iso)}
                  >
                    <span aria-hidden="true">{c.day}</span>
                    <span aria-hidden="true" className={`c--cal-dot ${worn ? "is-worn" : ""}`} style={{ marginTop: 4 }} />
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </Card.Root>
  );
}
