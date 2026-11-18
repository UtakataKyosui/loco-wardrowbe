import { Badge, Button, Card, Toggle } from "@utakata-ui/react";
import { Flex } from "lism-css/react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { MaterialIcon } from "../MaterialIcon";
import type { LookbookEntry } from "../../mocks/lookbook";

type WearState = "idle" | "busy" | "done";

function Collage({ entry }: { entry: LookbookEntry }) {
  const { layout, collage } = entry;
  const tile = (i: number, extra?: ReactNode) => (
    <div className="lb-tile">
      <img src={collage[i].src} alt={collage[i].alt} loading="lazy" />
      {extra}
    </div>
  );
  if (layout === "spread") {
    return (
      <div className="lb-grid is-spread">
        {tile(
          0,
          entry.primaryCaption && <span className="lb-tag9 is-left">{entry.primaryCaption}</span>,
        )}
        <div className="lb-stack">
          {tile(1)}
          {tile(2, entry.countChip && <span className="lb-tag9 is-right">{entry.countChip}</span>)}
        </div>
      </div>
    );
  }
  if (layout === "hero") {
    return (
      <div className="lb-grid is-hero">
        <div className="lb-tile">
          <img src={collage[0].src} alt={collage[0].alt} loading="lazy" />
          <div className="lb-scrim" />
          {entry.overlay && (
            <div className="lb-overlay">
              <span className="lb-label" style={{ textTransform: "uppercase" }}>
                {entry.overlay.eyebrow}
              </span>
              <div className="lb-overlayTitle">{entry.overlay.title}</div>
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className={`lb-grid is-${layout}`}>
      {tile(0)}
      {tile(1)}
    </div>
  );
}

function ScoreBadge({ badge }: { badge: LookbookEntry["badge"] }) {
  const text = { textTransform: "none" as const };
  if (badge.kind === "favorite") {
    return (
      <Badge variant="subtle" className="lb-chip is-accent">
        <MaterialIcon name="star" filled size={14} />
        <span className="lb-label" style={{ ...text, color: "var(--primary)" }}>
          {badge.label}
        </span>
      </Badge>
    );
  }
  return (
    <Badge variant="subtle" className="lb-chip is-accent">
      {badge.kind === "icon" && <MaterialIcon name={badge.icon} size={14} />}
      <span className="lb-labelMd" style={text}>
        {badge.label}
      </span>
    </Badge>
  );
}

export function LookCard({ entry }: { entry: LookbookEntry }) {
  const [saved, setSaved] = useState(entry.saved);
  const [wear, setWear] = useState<WearState>("idle");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const ids = timers.current;
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, []);

  const logWear = () => {
    if (wear !== "idle") return;
    setWear("busy");
    timers.current.push(window.setTimeout(() => setWear("done"), 500));
  };

  const wearMessage =
    wear === "busy" ? "着用ログ登録中..." : wear === "done" ? "本日のコーデに設定済" : "";

  return (
    <li className="lb-li">
      <Card.Root className="lb-card">
        <div className="lb-canvas">
          <div className="lb-topRow">
            <Badge variant="subtle" className="lb-chip lb-label">
              {entry.no}
            </Badge>
            <ScoreBadge badge={entry.badge} />
          </div>
          <Collage entry={entry} />
          <Flex jc="between" ai="center" g="10" style={{ marginTop: 4, paddingInline: 4 }}>
            <Flex ai="center" g="10" c="text-2">
              {entry.footLeft.dot && <span className="lb-dot" aria-hidden="true" />}
              <span className="lb-label" style={{ letterSpacing: "0.04em", fontWeight: 500 }}>
                {entry.footLeft.text}
              </span>
            </Flex>
            <span
              className={entry.footRight.accent ? "lb-labelMd" : "lb-label"}
              style={{
                color: entry.footRight.accent ? "var(--accent)" : "var(--on-surface)",
                fontWeight: entry.footRight.accent ? 600 : 500,
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
              }}
            >
              {entry.footRight.text}
            </span>
          </Flex>
        </div>

        <div className="lb-body">
          <Flex jc="between" ai="start" g="10">
            <Card.Header className="lb-head">
              <span
                className="lb-label"
                style={{ color: "var(--on-surface-variant)", textTransform: "uppercase" }}
              >
                {entry.style}
              </span>
              <Card.Title level="2" className="lb-title">
                {entry.title}
              </Card.Title>
              <Card.Description className="lb-sub">{entry.subtitle}</Card.Description>
            </Card.Header>
            {entry.id === "look-01" ? (
              <Button
                iconOnly
                square
                variant="ghost"
                className="lb-iconBtn"
                aria-label={`${entry.title}のその他のオプション`}
                style={{ "--ui-button-square-size": "44px", minHeight: 44 } as CSSProperties}
              >
                <MaterialIcon name="more_horiz" size={20} />
              </Button>
            ) : (
              <Toggle
                iconOnly
                variant="ghost"
                className="lb-iconBtn"
                aria-label={`${entry.title}をお気に入りに保存`}
                pressed={saved}
                onPressedChange={setSaved}
                style={{ minWidth: 44, minHeight: 44 }}
              >
                <MaterialIcon
                  name={saved ? "bookmark" : "bookmark_border"}
                  filled={saved}
                  size={20}
                />
              </Toggle>
            )}
          </Flex>

          <Card.Content className="lb-content">
            <div className="lb-tags">
              {entry.tags.map((t) => (
                <Badge
                  key={t.label}
                  variant="subtle"
                  className={`lb-tag lb-label is-${t.kind ?? "plain"}`}
                >
                  {t.kind === "history" && (
                    <MaterialIcon name="history" size={13} style={{ color: "var(--accent)" }} />
                  )}
                  {t.label}
                </Badge>
              ))}
            </div>

            <Button variant="ghost" className="lb-items">
              <Flex ai="center" g="10">
                <div className="lb-thumbs" aria-hidden="true">
                  {entry.items.map((it) => (
                    <div className="lb-thumb" key={it.src}>
                      <img src={it.src} alt="" loading="lazy" />
                    </div>
                  ))}
                </div>
                <span
                  className="lb-label"
                  style={{ fontWeight: 500, paddingLeft: 4, color: "var(--on-surface)" }}
                >
                  アイテム {entry.items.length}点
                  <span className="u-visually-hidden">を見る: {entry.title}</span>
                </span>
              </Flex>
              <MaterialIcon
                name="chevron_right"
                size={18}
                style={{ color: "var(--on-surface-variant)" }}
              />
            </Button>
          </Card.Content>

          <Card.Footer className="lb-foot">
            <Button
              className={`lb-cta lb-labelMd${wear === "done" ? " is-done" : ""}`}
              onClick={logWear}
              disabled={wear !== "idle"}
              focusableWhenDisabled
            >
              <MaterialIcon
                name={wear === "idle" ? "checkroom" : wear === "busy" ? "refresh" : "done"}
                size={18}
                className={wear === "busy" ? "lb-spin" : undefined}
              />
              <span>
                このコーデを着る (ログ)<span className="u-visually-hidden">: {entry.title}</span>
              </span>
            </Button>
            <Button variant="outline" className="lb-edit lb-labelMd">
              <MaterialIcon name="edit" size={17} style={{ color: "var(--accent)" }} />
              <span>
                編集<span className="u-visually-hidden">: {entry.title}</span>
              </span>
            </Button>
            <p role="status" className="lb-wearStatus lb-label">
              {wearMessage}
            </p>
          </Card.Footer>
        </div>
      </Card.Root>
    </li>
  );
}
