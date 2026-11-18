import { Card } from "@utakata-ui/react";
import { Flex, Grid, Stack } from "lism-css/react";
import { useId } from "react";
import { MaterialIcon } from "../MaterialIcon";

type Props = { utilization: number; wornDays: number; totalDays: number; topItem: string; topItemCount: number };

export function AnalyticsCard({ utilization, wornDays, totalDays, topItem, topItemCount }: Props) {
  const titleId = useId();
  const ringLabelId = useId();
  return (
    <Card.Root className="c--cal-card" role="region" aria-labelledby={titleId}>
      <Stack g="30">
        <Flex jc="between" ai="center">
          <h2 id={titleId} className="c--cal-muted c--cal-h2-small">
            <span className="c--cal-dot is-worn" aria-hidden="true" />
            マンスリー・アナリティクス
          </h2>
          <span className="c--cal-muted" style={{ fontSize: 11 }}>集計対象: {totalDays}日間</span>
        </Flex>
        <Grid gtc="5fr 7fr" g="20" ai="center">
          <div className="c--cal-well" style={{ padding: 12, textAlign: "center" }}>
            {/* Ring progress: custom SVG, exposed as a named progressbar (Progress is linear-only). */}
            <div
              role="progressbar"
              aria-labelledby={ringLabelId}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={utilization}
              aria-valuetext={`${utilization}%`}
              style={{ position: "relative", width: 64, height: 64, margin: "4px auto" }}
            >
              <svg viewBox="0 0 36 36" width="64" height="64" style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--surface-highest)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${utilization}, 100`} />
              </svg>
              <div aria-hidden="true" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                <span style={{ fontFamily: "var(--ff--accent)", fontSize: 20, fontWeight: 600, lineHeight: 1 }}>
                  {utilization}<span style={{ fontSize: 11, fontWeight: 400 }}>%</span>
                </span>
              </div>
            </div>
            <span id={ringLabelId} className="c--cal-muted" style={{ fontSize: 11, letterSpacing: "0.06em", display: "block", marginTop: 4 }}>
              クローゼット稼働率
            </span>
          </div>
          <Stack g="20" as="dl" style={{ margin: 0 }}>
            <Flex className="c--cal-well" jc="between" ai="center" p="15">
              <div>
                <dt className="c--cal-muted" style={{ fontSize: 11 }}>着用コーデ数</dt>
                <dd style={{ margin: 0 }}>
                  <span style={{ color: "var(--primary)", fontFamily: "var(--ff--accent)", fontSize: 22, lineHeight: 1.2 }}>{wornDays}</span>
                  <span className="c--cal-muted" style={{ fontSize: 14 }}> 日 / {totalDays}日</span>
                </dd>
              </div>
              <span className="c--cal-chip c--cal-roundchip" style={{ background: "var(--surface-high)", color: "var(--primary)" }}>
                <MaterialIcon name="checkroom" size={16} />
              </span>
            </Flex>
            <Flex className="c--cal-well" jc="between" ai="center" p="15" g="10">
              <div style={{ minWidth: 0 }}>
                <dt className="c--cal-muted" style={{ fontSize: 11 }}>最多着用アイテム</dt>
                <dd style={{ margin: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, display: "block", overflowWrap: "anywhere" }}>{topItem}</span>
                  <span style={{ fontSize: 11, color: "var(--primary)" }}>合計 {topItemCount}回 着用</span>
                </dd>
              </div>
              <span className="c--cal-chip c--cal-roundchip" style={{ background: "var(--accent-container)", color: "var(--on-accent-container)" }}>
                <MaterialIcon name="hotel_class" size={16} />
              </span>
            </Flex>
          </Stack>
        </Grid>
      </Stack>
    </Card.Root>
  );
}
