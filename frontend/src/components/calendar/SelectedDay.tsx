import { Button, Card, Empty } from "@utakata-ui/react";
import { Flex, Heading, Stack } from "lism-css/react";
import { useId } from "react";
import type { WearLog } from "../../mocks/types";
import type { CalendarOutfit } from "../../mocks/calendar";
import { MaterialIcon } from "../MaterialIcon";
import { WEEKDAYS, parseIso } from "./calendarUtils";

type Props = { iso: string; isToday: boolean; log?: WearLog; outfit?: CalendarOutfit };

export function SelectedDay({ iso, isToday, log, outfit }: Props) {
  const headingId = useId();
  const { y, m, d } = parseIso(iso);
  const weekday = WEEKDAYS[new Date(y, m, d).getDay()];
  return (
    <section aria-labelledby={headingId}>
      <Stack g="20">
        <Flex jc="between" ai="center" g="10">
          <Flex ai="baseline" g="15">
            <Heading level="2" id={headingId} ff="accent" fz="xl" fw="normal">
              {m + 1}月{d}日{" "}
              <span
                className="c--cal-muted"
                style={{ fontSize: 14, fontFamily: "var(--ff--base)" }}
              >
                ({weekday})
              </span>
            </Heading>
            {isToday && (
              <span className="c--cal-eyebrow" lang="en" style={{ fontWeight: 600 }}>
                TODAY
              </span>
            )}
          </Flex>
          {log?.weather && (
            <span
              className="c--cal-chip"
              style={{ background: "var(--surface-high)", border: "1px solid var(--outline)" }}
            >
              <MaterialIcon name="wb_sunny" size={16} style={{ color: "var(--primary)" }} />
              {log.weather.tempC}℃ / {log.weather.label}
            </span>
          )}
        </Flex>
        <Card.Root className="c--cal-card">
          {log && outfit ? (
            <Stack g="30">
              <Flex g="30" ai="start">
                <div className="c--cal-thumb" style={{ width: 112, height: 144, flexShrink: 0 }}>
                  <img src={outfit.imageUrl} alt="" />
                  <span
                    className="c--cal-overlay"
                    style={{
                      bottom: 6,
                      left: 6,
                      padding: "2px 6px",
                      borderRadius: 4,
                      color: "var(--primary)",
                    }}
                  >
                    {log.itemIds.length} ITEMS
                  </span>
                </div>
                <Flex fxd="column" jc="between" style={{ flex: 1, minWidth: 0, minHeight: 144 }}>
                  <div>
                    <span
                      className="c--cal-eyebrow"
                      lang="en"
                      style={{ display: "block", marginBottom: 4, letterSpacing: "0.18em" }}
                    >
                      SELECTED LOOK
                    </span>
                    <Heading
                      level="3"
                      fz="base"
                      fw="500"
                      lh="s"
                      style={{ overflowWrap: "anywhere" }}
                    >
                      {outfit.title}
                    </Heading>
                    <p className="c--cal-muted" style={{ fontSize: 12, marginTop: 4 }}>
                      {outfit.summary}
                    </p>
                  </div>
                  {log.note && (
                    <div className="c--cal-well" style={{ padding: 8 }}>
                      <span
                        className="c--cal-muted"
                        lang="en"
                        style={{
                          fontSize: 10,
                          letterSpacing: "0.08em",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          marginBottom: 2,
                        }}
                      >
                        <MaterialIcon
                          name="edit_note"
                          size={12}
                          style={{ color: "var(--primary)" }}
                        />{" "}
                        NOTE
                      </span>
                      <p style={{ fontSize: 12, lineHeight: 1.4 }}>{log.note}</p>
                    </div>
                  )}
                </Flex>
              </Flex>
              <Flex g="15">
                <Button className="c--cal-primary" size="lg" style={{ flex: 1 }}>
                  <MaterialIcon name="add_task" size={18} />
                  <span>{isToday ? "今日のコーデを変更・編集" : "このコーデを変更・編集"}</span>
                </Button>
                <Button
                  iconOnly
                  square
                  variant="outline"
                  size="lg"
                  aria-label="シェア"
                  className="c--cal-share"
                >
                  <MaterialIcon name="ios_share" size={18} />
                </Button>
              </Flex>
            </Stack>
          ) : (
            <Empty.Root>
              <MaterialIcon name="event_busy" size={28} style={{ color: "var(--outline)" }} />
              <Empty.Title level="3">この日の着用記録はありません</Empty.Title>
              <Empty.Actions>
                <Button className="c--cal-primary" size="lg">
                  <MaterialIcon name="add_task" size={18} />
                  <span>コーデを記録する</span>
                </Button>
              </Empty.Actions>
            </Empty.Root>
          )}
        </Card.Root>
      </Stack>
    </section>
  );
}
