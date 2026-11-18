import { Button } from "@utakata-ui/react";
import { Flex, Heading, Inline } from "lism-css/react";
import { MaterialIcon } from "../MaterialIcon";

type Props = {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
};

const iconBtnStyle = { "--ui-button-square-size": "44px", minHeight: 44 } as React.CSSProperties;

export function MonthHeader({ year, month, onPrev, onNext, onToday }: Props) {
  return (
    <Flex jc="between" ai="center" mt="10">
      <div>
        <span className="c--cal-eyebrow" style={{ display: "block", marginBottom: 2 }}>
          ARCHIVE &amp; INSIGHTS
        </span>
        <Heading level="1" ff="accent" fz="3xl" fw="normal" lh="s">
          {year}
          <Inline fz="s" c="inherit" className="c--cal-muted">
            年
          </Inline>{" "}
          {month + 1}
          <Inline fz="s" className="c--cal-muted">
            月
          </Inline>
        </Heading>
      </div>
      <div className="c--cal-pillbar" role="group" aria-label="表示する月の切り替え">
        <Button
          iconOnly
          square
          variant="ghost"
          aria-label="前の月"
          style={iconBtnStyle}
          onClick={onPrev}
        >
          <MaterialIcon name="chevron_left" size={18} />
        </Button>
        <Button
          variant="ghost"
          className="c--cal-today"
          style={{ minHeight: 44, minWidth: 44 }}
          onClick={onToday}
        >
          今月
        </Button>
        <Button
          iconOnly
          square
          variant="ghost"
          aria-label="次の月"
          style={iconBtnStyle}
          onClick={onNext}
        >
          <MaterialIcon name="chevron_right" size={18} />
        </Button>
      </div>
    </Flex>
  );
}
