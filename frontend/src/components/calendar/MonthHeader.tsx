import { Flex, Heading, Inline } from "lism-css/react";
import { MaterialIcon } from "../MaterialIcon";

type Props = { year: number; month: number; onPrev: () => void; onNext: () => void; onToday: () => void };

export function MonthHeader({ year, month, onPrev, onNext, onToday }: Props) {
  return (
    <Flex jc="between" ai="center" mt="10">
      <div>
        <span className="c--cal-eyebrow" style={{ display: "block", marginBottom: 2 }}>
          ARCHIVE &amp; INSIGHTS
        </span>
        <Heading level="1" ff="accent" fz="3xl" fw="normal" lh="s" aria-live="polite">
          {year}
          <Inline fz="s" c="inherit" className="c--cal-muted">年</Inline> {month + 1}
          <Inline fz="s" className="c--cal-muted">月</Inline>
        </Heading>
      </div>
      <div className="c--cal-pillbar">
        <button type="button" className="c--cal-iconbtn" aria-label="先月" onClick={onPrev}>
          <MaterialIcon name="chevron_left" size={18} />
        </button>
        <button
          type="button"
          onClick={onToday}
          aria-label="今月へ戻る"
          style={{ background: "none", border: 0, cursor: "pointer", color: "var(--primary)", font: "inherit", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", padding: "0 4px" }}
        >
          今月
        </button>
        <button type="button" className="c--cal-iconbtn" aria-label="来月" onClick={onNext}>
          <MaterialIcon name="chevron_right" size={18} />
        </button>
      </div>
    </Flex>
  );
}
