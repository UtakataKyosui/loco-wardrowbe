import { Flex, Heading, Inline, Stack, Text } from "lism-css/react";
import { useState } from "react";
import { LookCard } from "../components/lookbook/LookCard";
import { MaterialIcon } from "../components/MaterialIcon";
import { LOOKBOOK_ENTRIES, LOOKBOOK_OCCASIONS, type OccasionKey } from "../mocks/lookbook";
import "../components/lookbook/lookbook.css";

type Scope = "ss" | "aw";

export function Lookbook() {
  const [scope, setScope] = useState<Scope>("ss");
  const [occasion, setOccasion] = useState<OccasionKey>("all");

  const visible = LOOKBOOK_ENTRIES.filter((e) => occasion === "all" || e.occasion === occasion);

  return (
    <div className="c--lb" style={{ paddingBottom: 32 }}>
      <Flex jc="between" ai="end" g="20" style={{ marginBottom: 16, paddingTop: 4 }}>
        <Stack>
          <span
            className="lb-label"
            style={{ color: "var(--on-surface-variant)", textTransform: "uppercase", letterSpacing: "0.12em" }}
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
        <span className="lb-sortChip lb-label">
          <MaterialIcon name="insights" size={15} style={{ color: "var(--accent)" }} />
          着用頻度順
        </span>
      </Flex>

      <div className="lb-segment" role="group" aria-label="シーズン" style={{ marginBottom: 16 }}>
        <button type="button" className="lb-segBtn lb-labelMd" aria-pressed={scope === "ss"} onClick={() => setScope("ss")}>
          <MaterialIcon name="eco" size={15} />
          <span>SPRING / SUMMER</span>
        </button>
        <button type="button" className="lb-segBtn lb-labelMd" aria-pressed={scope === "aw"} onClick={() => setScope("aw")}>
          <MaterialIcon name="ac_unit" size={15} />
          <span>AUTUMN / WINTER</span>
        </button>
      </div>

      <div className="lb-pills" role="group" aria-label="シーン" style={{ marginBottom: 24 }}>
        {LOOKBOOK_OCCASIONS.map((o) => (
          <button
            key={o.key}
            type="button"
            className="lb-pill lb-labelMd"
            aria-pressed={occasion === o.key}
            onClick={() => setOccasion(o.key)}
          >
            {o.label} ({o.count})
          </button>
        ))}
      </div>

      <Stack style={{ gap: 32 }}>
        {visible.map((e) => (
          <LookCard key={e.id} entry={e} />
        ))}
        {visible.length === 0 && (
          <Text ta="center" c="text-2" fz="s" style={{ padding: "32px 0" }}>
            このシーンの保存済みコーデはまだありません
          </Text>
        )}
      </Stack>

      <Flex fxd="column" ai="center" jc="center" g="10" ta="center" style={{ marginTop: 40, marginBottom: 16 }}>
        <div style={{ width: 32, height: 2, borderRadius: 9999, background: "var(--outline-variant)" }} />
        <Text ff="accent" fz="xl" c="text-2" o="60">
          Kinfolk Archive
        </Text>
        <span
          className="lb-label"
          style={{ color: "var(--on-surface-variant)", textTransform: "uppercase", letterSpacing: "0.06em" }}
        >
          全24件のコーディネートが同期完了しています
        </span>
      </Flex>
    </div>
  );
}
