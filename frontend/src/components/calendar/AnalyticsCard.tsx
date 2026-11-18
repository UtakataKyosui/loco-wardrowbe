import { Flex, Grid, Stack } from "lism-css/react";
import { MaterialIcon } from "../MaterialIcon";

type Props = { utilization: number; wornDays: number; totalDays: number; topItem: string; topItemCount: number };

export function AnalyticsCard({ utilization, wornDays, totalDays, topItem, topItemCount }: Props) {
  return (
    <section className="c--cal-card" aria-label="マンスリー・アナリティクス">
      <Stack g="30">
        <Flex jc="between" ai="center">
          <span className="c--cal-muted" style={{ fontSize: 10, letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 6 }}>
            <span className="c--cal-dot is-worn" />
            マンスリー・アナリティクス
          </span>
          <span className="c--cal-muted" style={{ fontSize: 10 }}>集計対象: {totalDays}日間</span>
        </Flex>
        <Grid gtc="5fr 7fr" g="20" ai="center">
          <div className="c--cal-well" style={{ padding: 12, textAlign: "center" }}>
            <div style={{ position: "relative", width: 64, height: 64, margin: "4px auto" }}>
              <svg viewBox="0 0 36 36" width="64" height="64" style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--surface-highest)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${utilization}, 100`} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                <span style={{ fontFamily: "var(--ff--accent)", fontSize: 20, fontWeight: 600, lineHeight: 1 }}>
                  {utilization}<span style={{ fontSize: 11, fontWeight: 400 }}>%</span>
                </span>
              </div>
            </div>
            <span className="c--cal-muted" style={{ fontSize: 10, letterSpacing: "0.06em", display: "block", marginTop: 4 }}>
              クローゼット稼働率
            </span>
          </div>
          <Stack g="20">
            <Flex className="c--cal-well" jc="between" ai="center" p="15">
              <div>
                <span className="c--cal-muted" style={{ fontSize: 10, display: "block" }}>着用コーデ数</span>
                <span style={{ color: "var(--primary)", fontFamily: "var(--ff--accent)", fontSize: 22, lineHeight: 1.2 }}>{wornDays}</span>
                <span className="c--cal-muted" style={{ fontSize: 14 }}> 日 / {totalDays}日</span>
              </div>
              <span className="c--cal-chip" style={{ background: "var(--surface-high)", color: "var(--primary)", width: 32, height: 32, padding: 0, justifyContent: "center", borderRadius: 9999 }}>
                <MaterialIcon name="checkroom" size={16} />
              </span>
            </Flex>
            <Flex className="c--cal-well" jc="between" ai="center" p="15" g="10">
              <div style={{ minWidth: 0 }}>
                <span className="c--cal-muted" style={{ fontSize: 10, display: "block" }}>最多着用アイテム</span>
                <span style={{ fontSize: 13, fontWeight: 500, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{topItem}</span>
                <span style={{ fontSize: 10, color: "var(--primary)" }}>合計 {topItemCount}回 着用</span>
              </div>
              <span className="c--cal-chip" style={{ background: "var(--accent-container)", color: "var(--on-accent-container)", width: 32, height: 32, padding: 0, justifyContent: "center", borderRadius: 9999, flexShrink: 0 }}>
                <MaterialIcon name="hotel_class" size={16} />
              </span>
            </Flex>
          </Stack>
        </Grid>
      </Stack>
    </section>
  );
}
