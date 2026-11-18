import { Badge, Empty, ToggleGroup } from "@utakata-ui/react";
import { Flex, Heading, Inline, Stack, Text } from "lism-css/react";
import { useState } from "react";
import { LookCard } from "../components/lookbook/LookCard";
import { MaterialIcon } from "../components/MaterialIcon";
import {
  LOOKBOOK_ENTRIES,
  LOOKBOOK_OCCASIONS,
  type OccasionKey,
  type SeasonKey,
} from "../mocks/lookbook";
import "../components/lookbook/lookbook.css";

export function Lookbook() {
  // No season pressed = every season. The season toggle really filters the list.
  const [scope, setScope] = useState<SeasonKey | null>(null);
  const [occasion, setOccasion] = useState<OccasionKey>("all");

  const visible = LOOKBOOK_ENTRIES.filter(
    (e) =>
      (occasion === "all" || e.occasion === occasion) &&
      (scope === null || e.seasons.includes(scope)),
  );

  return (
    <div className="c--lb" style={{ paddingBottom: 32 }}>
      <Flex jc="between" ai="end" g="20" style={{ marginBottom: 16, paddingTop: 4 }}>
        <Stack>
          <span
            className="lb-label"
            style={{
              color: "var(--on-surface-variant)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            Archival Lookbook
          </span>
          <Heading level="1" ff="accent" fz="xl" fw="500" lts="s">
            保存済みコーデ{" "}
            <Inline fz="s" fw="500" ff="base" style={{ color: "var(--accent)", marginLeft: 4 }}>
              (24)
            </Inline>
          </Heading>
        </Stack>
        {/* Static sort indicator, not a control. */}
        <Badge variant="subtle" className="lb-sortChip lb-label">
          <MaterialIcon name="insights" size={15} style={{ color: "var(--accent)" }} />
          <span className="u-visually-hidden">並び順: </span>
          着用頻度順
        </Badge>
      </Flex>

      <ToggleGroup.Root
        aria-label="シーズンで絞り込み"
        className="lb-segment"
        style={{ marginBottom: 16 }}
        value={scope ? [scope] : []}
        onValueChange={(v) => setScope((v[0] as SeasonKey | undefined) ?? null)}
      >
        <ToggleGroup.Item value="ss" className="lb-segBtn lb-labelMd">
          <MaterialIcon name="eco" size={15} />
          <span>SPRING / SUMMER</span>
        </ToggleGroup.Item>
        <ToggleGroup.Item value="aw" className="lb-segBtn lb-labelMd">
          <MaterialIcon name="ac_unit" size={15} />
          <span>AUTUMN / WINTER</span>
        </ToggleGroup.Item>
      </ToggleGroup.Root>

      <ToggleGroup.Root
        aria-label="シーンで絞り込み"
        className="lb-pills"
        style={{ marginBottom: 24 }}
        value={[occasion]}
        onValueChange={(v) => setOccasion((v[0] as OccasionKey | undefined) ?? "all")}
      >
        {LOOKBOOK_OCCASIONS.map((o) => (
          <ToggleGroup.Item key={o.key} value={o.key} className="lb-pill lb-labelMd">
            {o.label} ({o.count})
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>

      <p role="status" className="u-visually-hidden">
        {visible.length}件のコーデを表示中
      </p>

      {visible.length > 0 ? (
        <ul className="lb-list">
          {visible.map((e) => (
            <LookCard key={e.id} entry={e} />
          ))}
        </ul>
      ) : (
        <Empty.Root>
          <Empty.Title level="2">コーデがありません</Empty.Title>
          <Empty.Description>この条件の保存済みコーデはまだありません</Empty.Description>
        </Empty.Root>
      )}

      <Flex
        fxd="column"
        ai="center"
        jc="center"
        g="10"
        ta="center"
        style={{ marginTop: 40, marginBottom: 16 }}
      >
        <div
          aria-hidden="true"
          style={{ width: 32, height: 2, borderRadius: 9999, background: "var(--outline-variant)" }}
        />
        <Text ff="accent" fz="xl" style={{ color: "var(--on-surface-variant)" }}>
          Kinfolk Archive
        </Text>
        <span
          className="lb-label"
          style={{
            color: "var(--on-surface-variant)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          全24件のコーディネートが同期完了しています
        </span>
      </Flex>
    </div>
  );
}
