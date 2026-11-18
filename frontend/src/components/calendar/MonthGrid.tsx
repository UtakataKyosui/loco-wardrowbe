import { Flex, Heading } from "lism-css/react";
import { WEEKDAYS, type Cell } from "./calendarUtils";

type Props = {
  cells: Cell[];
  monthEnglish: string;
  wornDates: Set<string>;
  selected: string;
  today: string;
  onSelect: (iso: string) => void;
};

export function MonthGrid({ cells, monthEnglish, wornDates, selected, today, onSelect }: Props) {
  return (
    <section className="c--cal-card" aria-label="着用カレンダー">
      <Flex jc="between" ai="center" mb="20" fxw="wrap" g="10">
        <Heading level="2" fz="m" fw="500" ff="base" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>着用カレンダー</span>
          <span style={{ fontSize: 10, background: "var(--accent-soft)", color: "var(--on-accent-container)", padding: "2px 8px", borderRadius: "var(--radius-pill)", fontWeight: 600 }}>
            {monthEnglish}
          </span>
        </Heading>
        <Flex g="20" className="c--cal-muted" style={{ fontSize: 10 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span className="c--cal-dot is-worn" style={{ width: 8, height: 8 }} /> 記録済
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span className="c--cal-dot" style={{ width: 8, height: 8, background: "var(--surface-high)", border: "1px solid var(--primary)" }} /> 選択中
          </span>
        </Flex>
      </Flex>
      <div className="c--cal-grid c--cal-muted" style={{ fontSize: 10, letterSpacing: "0.1em", fontWeight: 500, marginBottom: 8 }} aria-hidden="true">
        {WEEKDAYS.map((w, i) => (
          <span key={w} style={{ color: i === 0 ? "var(--error)" : i === 6 ? "var(--primary)" : undefined }}>{w}</span>
        ))}
      </div>
      <div className="c--cal-grid">
        {cells.map((c) =>
          c.inMonth ? (
            <button
              key={c.iso}
              type="button"
              aria-pressed={c.iso === selected}
              aria-label={`${c.iso}${wornDates.has(c.iso) ? " 記録あり" : ""}`}
              className={[
                "c--cal-day",
                c.weekday === 0 && "is-sun",
                c.weekday === 6 && "is-sat",
                c.iso === today && "is-today",
                c.iso === selected && "is-selected",
              ].filter(Boolean).join(" ")}
              onClick={() => onSelect(c.iso)}
            >
              <span>{c.day}</span>
              <span className={`c--cal-dot ${wornDates.has(c.iso) ? "is-worn" : ""}`} style={{ marginTop: 4 }} />
            </button>
          ) : (
            <span key={c.iso} className="c--cal-fill" aria-hidden="true">{c.day}</span>
          ),
        )}
      </div>
    </section>
  );
}
