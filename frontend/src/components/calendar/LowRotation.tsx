import { Badge, Button, Card, ScrollArea } from "@utakata-ui/react";
import { Flex, Heading, Stack } from "lism-css/react";
import { useId } from "react";
import type { LowRotationItem } from "../../mocks/calendar";
import { MaterialIcon } from "../MaterialIcon";

const btnStyle = { minHeight: 44, flex: 1, fontSize: 12 } as React.CSSProperties;

export function LowRotation({ items }: { items: LowRotationItem[] }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} style={{ paddingTop: 8 }}>
      <Stack g="20">
        <Flex jc="between" ai="center" g="10">
          <div>
            <span className="c--cal-eyebrow" lang="en" style={{ display: "block", marginBottom: 2 }}>WARDROBE DIAGNOSIS</span>
            <Heading level="2" id={headingId} ff="accent" fz="l" fw="normal">出番が少ないアイテム</Heading>
          </div>
          <Badge variant="destructive" style={{ flexShrink: 0 }}>30日以上未着用</Badge>
        </Flex>
        <p className="c--cal-muted" style={{ fontSize: 14, lineHeight: 1.6 }}>
          稼働率を上げるために、手放すか新しいコーデを試してみましょう。
        </p>
        <ScrollArea aria-label="出番が少ないアイテム（横にスクロールできます）" style={{ overflowX: "auto" }}>
          <ul role="list" className="c--cal-scroller">
            {items.map((it) => (
              <li key={it.id} style={{ listStyle: "none", flexShrink: 0 }}>
                <Card.Root className="c--cal-card" style={{ width: 224, height: "100%", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="c--cal-thumb" style={{ width: "100%", height: 144 }}>
                    <img src={it.imageUrl} alt="" />
                    <span className="c--cal-overlay c--cal-muted" style={{ top: 8, right: 8, padding: "2px 8px", borderRadius: "var(--radius-pill)" }}>
                      未着用 {it.daysIdle}日
                    </span>
                  </div>
                  <div>
                    <span className="c--cal-muted" style={{ fontSize: 11, letterSpacing: "0.08em", display: "block" }}>{it.category}</span>
                    <h3 style={{ fontSize: 14, fontWeight: 500, overflowWrap: "anywhere" }}>{it.name}</h3>
                  </div>
                  <Flex g="10" style={{ marginTop: "auto" }}>
                    <Button variant="outline" size="sm" style={btnStyle} aria-label={`${it.name}を再提案`}>
                      <MaterialIcon name="auto_fix_high" size={14} /> 再提案
                    </Button>
                    <Button variant="outline" size="sm" style={btnStyle} aria-label={`${it.name}を手放す`}>
                      <MaterialIcon name="recycling" size={14} /> 手放す
                    </Button>
                  </Flex>
                </Card.Root>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </Stack>
    </section>
  );
}
