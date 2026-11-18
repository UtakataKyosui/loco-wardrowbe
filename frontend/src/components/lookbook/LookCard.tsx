import { Box, Flex, Heading, Text } from "lism-css/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
        {tile(0, entry.primaryCaption && <span className="lb-tag9 is-left">{entry.primaryCaption}</span>)}
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
              <span className="lb-label" style={{ textTransform: "uppercase", opacity: 0.85 }}>
                {entry.overlay.eyebrow}
              </span>
              <Text as="div" ff="accent" fz="l" lh="1" style={{ marginTop: 2 }}>
                {entry.overlay.title}
              </Text>
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

function Badge({ badge }: { badge: LookbookEntry["badge"] }) {
  const text = { textTransform: "none" as const };
  if (badge.kind === "favorite") {
    return (
      <span className="lb-chip is-accent">
        <MaterialIcon name="star" filled size={14} />
        <span className="lb-label" style={{ ...text, color: "var(--primary)" }}>
          {badge.label}
        </span>
      </span>
    );
  }
  return (
    <span className="lb-chip is-accent">
      {badge.kind === "icon" && <MaterialIcon name={badge.icon} size={14} />}
      <span className="lb-labelMd" style={text}>
        {badge.label}
      </span>
    </span>
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
    timers.current.push(
      window.setTimeout(() => {
        setWear("done");
        timers.current.push(window.setTimeout(() => setWear("idle"), 2400));
      }, 500),
    );
  };

  return (
    <Box as="article" className="lb-card">
      <div className="lb-canvas">
        <div className="lb-topRow">
          <span className="lb-chip lb-label">{entry.no}</span>
          <Badge badge={entry.badge} />
        </div>
        <Collage entry={entry} />
        <Flex jc="between" ai="center" g="10" style={{ marginTop: 4, paddingInline: 4 }}>
          <Flex ai="center" g="10" c="text-2">
            {entry.footLeft.dot && <span className="lb-dot" />}
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

      <Flex fxd="column" style={{ padding: 16, gap: 12 }}>
        <Flex jc="between" ai="start" g="10">
          <div>
            <span className="lb-label" style={{ color: "var(--on-surface-variant)", textTransform: "uppercase" }}>
              {entry.style}
            </span>
            <Heading level="2" ff="accent" fz="l" fw="500" style={{ marginTop: 2 }}>
              {entry.title}
            </Heading>
            <Text fz="s" c="text-2" style={{ marginTop: 2 }}>
              {entry.subtitle}
            </Text>
          </div>
          {entry.id === "look-01" ? (
            <button type="button" className="lb-iconBtn" aria-label="その他のオプション">
              <MaterialIcon name="more_horiz" size={20} />
            </button>
          ) : (
            <button
              type="button"
              className={`lb-iconBtn${saved ? " is-on" : ""}`}
              aria-label="お気に入りに保存"
              aria-pressed={saved}
              onClick={() => setSaved((v) => !v)}
            >
              <MaterialIcon name={saved ? "bookmark" : "bookmark_border"} filled={saved} size={20} />
            </button>
          )}
        </Flex>

        <div className="lb-tags">
          {entry.tags.map((t) => (
            <span key={t.label} className={`lb-tag lb-label is-${t.kind ?? "plain"}`}>
              {t.kind === "history" && <MaterialIcon name="history" size={13} style={{ color: "var(--accent)" }} />}
              {t.label}
            </span>
          ))}
        </div>

        <button type="button" className="lb-items" aria-label={`アイテム ${entry.items.length}点を見る`}>
          <Flex ai="center" g="10">
            <div className="lb-thumbs">
              {entry.items.map((it) => (
                <div className="lb-thumb" key={it.src}>
                  <img src={it.src} alt={it.alt} loading="lazy" />
                </div>
              ))}
            </div>
            <span className="lb-label" style={{ fontWeight: 500, paddingLeft: 4, color: "var(--on-surface)" }}>
              アイテム {entry.items.length}点
            </span>
          </Flex>
          <MaterialIcon name="chevron_right" size={18} style={{ color: "var(--on-surface-variant)" }} />
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8, paddingTop: 4 }}>
          <button
            type="button"
            className={`lb-cta lb-labelMd${wear === "done" ? " is-done" : ""}`}
            onClick={logWear}
            aria-live="polite"
          >
            {wear === "idle" && (
              <>
                <MaterialIcon name="checkroom" size={18} />
                <span>このコーデを着る (ログ)</span>
              </>
            )}
            {wear === "busy" && (
              <>
                <MaterialIcon name="refresh" size={18} className="lb-spin" />
                <span>着用ログ登録中...</span>
              </>
            )}
            {wear === "done" && (
              <>
                <MaterialIcon name="done" size={18} />
                <span>本日のコーデに設定済</span>
              </>
            )}
          </button>
          <button type="button" className="lb-edit lb-labelMd">
            <MaterialIcon name="edit" size={17} style={{ color: "var(--accent)" }} />
            <span>編集</span>
          </button>
        </div>
      </Flex>
    </Box>
  );
}
