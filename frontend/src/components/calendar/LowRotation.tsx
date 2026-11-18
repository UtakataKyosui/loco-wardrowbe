import { Flex, Heading, Stack } from "lism-css/react";
import type { LowRotationItem } from "../../mocks/calendar";
import { MaterialIcon } from "../MaterialIcon";

export function LowRotation({ items }: { items: LowRotationItem[] }) {
  return (
    <section style={{ paddingTop: 8 }}>
      <Stack g="20">
        <Flex jc="between" ai="center" g="10">
          <div>
            <span className="c--cal-eyebrow" style={{ display: "block", marginBottom: 2 }}>WARDROBE DIAGNOSIS</span>
            <Heading level="2" ff="accent" fz="l" fw="normal">出番が少ないアイテム</Heading>
          </div>
          <span className="c--cal-chip" style={{ background: "color-mix(in srgb, var(--error-container) 70%, transparent)", border: "1px solid color-mix(in srgb, var(--error) 30%, transparent)", color: "var(--error)", fontWeight: 500, flexShrink: 0 }}>
            30日以上未着用
          </span>
        </Flex>
        <p className="c--cal-muted" style={{ fontSize: 14, lineHeight: 1.6 }}>
          稼働率を上げるために、手放すか新しいコーデを試してみましょう。
        </p>
        <div className="c--cal-scroller">
          {items.map((it) => (
            <div key={it.id} className="c--cal-card" style={{ width: 224, flexShrink: 0, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="c--cal-thumb" style={{ width: "100%", height: 144 }}>
                <img src={it.imageUrl} alt={it.name} />
                <span className="c--cal-overlay c--cal-muted" style={{ top: 8, right: 8, padding: "2px 8px", borderRadius: "var(--radius-pill)" }}>
                  未着用 {it.daysIdle}日
                </span>
              </div>
              <div>
                <span className="c--cal-muted" style={{ fontSize: 10, letterSpacing: "0.08em", display: "block" }}>{it.category}</span>
                <h3 style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.name}</h3>
              </div>
              <Flex g="10" style={{ marginTop: "auto" }}>
                <button type="button" className="c--cal-btn is-small is-accent">
                  <MaterialIcon name="auto_fix_high" size={13} /> 再提案
                </button>
                <button type="button" className="c--cal-btn is-small" style={{ color: "var(--outline)" }}>
                  <MaterialIcon name="recycling" size={13} /> 手放す
                </button>
              </Flex>
            </div>
          ))}
        </div>
      </Stack>
    </section>
  );
}
