import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Box, Flex, Grid, Heading, Inline, Stack, Text } from "lism-css/react";
import { Button, Empty, Progress, ScrollArea, Tabs, ToggleGroup } from "@utakata-ui/react";
import "../components/builder/builder.css";
import { MaterialIcon } from "../components/MaterialIcon";
import {
  builderAnalysis,
  builderFilters,
  builderItems,
  defaultSelection,
  drawerTabs,
  type BuilderItem,
  type BuilderSlot,
} from "../mocks/builder";
import type { Category } from "../mocks/types";

const slotItems = (slot: BuilderSlot) => builderItems.filter((i) => i.slot === slot);
const slotLabel: Record<BuilderSlot, string> = {
  tops: "トップス",
  bottoms: "ボトムス",
  shoes: "シューズ",
  accessories: "小物・バッグ",
};
const roundBtn = { "--ui-button-square-size": "44px", minHeight: 44 } as CSSProperties;
const catToSlot = (cat: Category): BuilderSlot | null => (cat === "outer" ? null : cat);

export function Builder() {
  const [sel, setSel] = useState<Record<BuilderSlot, string>>(defaultSelection);
  const [tab, setTab] = useState<Category>("tops");
  const [toast, setToast] = useState<string | null>(null);
  const [toastSilent, setToastSilent] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [filters, setFilters] = useState<string[]>(builderFilters.filter((f) => f.active).map((f) => f.label));
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // silent: the message is already announced through the selection live region.
  const notify = (msg: string, silent = false) => {
    setToast(msg);
    setToastSilent(silent);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 6000);
  };
  const choose = (slot: BuilderSlot, item: BuilderItem) => {
    setSel((prev) => ({ ...prev, [slot]: item.id }));
    setAnnounce(`${slotLabel[slot]}: ${item.name}を選択`);
  };

  const current = (slot: BuilderSlot) => builderItems.find((i) => i.id === sel[slot]) ?? slotItems(slot)[0];
  const cycle = (slot: BuilderSlot, dir: number) => {
    const list = slotItems(slot);
    const idx = list.findIndex((i) => i.id === sel[slot]);
    choose(slot, list[(idx + dir + list.length) % list.length]);
  };

  const zoneRow = (slot: "tops" | "bottoms", item: BuilderItem, zoneLabel: string) => (
    <div className="c--bld-card" role="group" aria-label={slotLabel[slot]}>
      <Flex ai="center" jc="between" mb="10">
        <span className="c--bld-chip is-zone">{zoneLabel}</span>
        {slot === "tops" ? (
          <span className="c--bld-chip is-accent">レイヤード</span>
        ) : (
          <Inline fz="2xs" c="text-2">
            2タックワイド
          </Inline>
        )}
      </Flex>
      <Flex ai="center" jc="between" g="10" style={{ minHeight: 144 }}>
        <Button iconOnly square variant="ghost" aria-label={`${slotLabel[slot]}を前へ`} className="c--bld-round" style={roundBtn} onClick={() => cycle(slot, -1)}>
          <MaterialIcon name="chevron_left" size={18} />
        </Button>
        <Flex ai="center" g="20" style={{ flex: 1, minWidth: 0 }}>
          <div className="c--bld-thumb" style={{ width: 96, height: 120, flex: "none" }}>
            <img src={item.imageUrl} alt="" />
          </div>
          <Stack g="5" style={{ minWidth: 0, flex: 1 }}>
            <span className="c--bld-label" style={{ color: "var(--accent)" }}>
              {item.brand}
            </span>
            <Text fz="s" fw="500" style={{ overflowWrap: "anywhere" }}>
              {item.name}
            </Text>
            <Text fz="xs" c="text-2">
              {item.color}
            </Text>
            <Flex g="10" fxw="wrap" mt="10">
              {item.chips.map((c) => (
                <span key={c} className="c--bld-chip">
                  {c}
                </span>
              ))}
            </Flex>
          </Stack>
        </Flex>
        <Button iconOnly square variant="ghost" aria-label={`${slotLabel[slot]}を次へ`} className="c--bld-round" style={roundBtn} onClick={() => cycle(slot, 1)}>
          <MaterialIcon name="chevron_right" size={18} />
        </Button>
      </Flex>
    </div>
  );

  const smallCard = (slot: "shoes" | "accessories", item: BuilderItem, label: string) => (
    <div className="c--bld-card" style={{ minWidth: 0 }} role="group" aria-label={slotLabel[slot]}>
      <Flex ai="center" jc="between">
        <span className="c--bld-label" style={{ color: "var(--on-surface-variant)" }} aria-hidden="true">
          {label}
        </span>
        <Button iconOnly square variant="ghost" aria-label={`${slotLabel[slot]}を次へ`} className="c--bld-round is-sm" style={roundBtn} onClick={() => cycle(slot, 1)}>
          <MaterialIcon name="swap_horiz" size={16} />
        </Button>
      </Flex>
      <div className="c--bld-thumb" style={{ height: 96, margin: "4px 0" }}>
        <img src={item.imageUrl} alt="" />
      </div>
      <Text fz="xs" fw="500" className="c--bld-ellipsis" title={item.name}>
        {item.name}
      </Text>
      <Text fz="2xs" c="text-2" className="c--bld-ellipsis">
        {item.color}
      </Text>
    </div>
  );

  return (
    <Stack g="20" pb="20">
      <Flex ai="center" jc="between" g="20" pt="10">
        <Stack g="5">
          <Heading level="1" ff="accent" fz="l" fw="500">
            コーデを組み立てる
          </Heading>
          <Text fz="2xs" c="text-2" tt="uppercase" lts="l">
            Vol. 14 / Spring Archival
          </Text>
        </Stack>
        <Flex g="10">
          <Button
            className="c--bld-pill is-plain"
            style={{ minHeight: 44 }}
            onClick={() => {
              setSel(defaultSelection);
              setAnnounce("");
              notify("キャンバスをリセットしました");
            }}
          >
            クリア
          </Button>
          <Button className="c--bld-pill is-primary" style={{ minHeight: 44 }} onClick={() => notify("Lookbook #44 にセットアップを保存しました")}>
            <MaterialIcon name="bookmark_add" size={16} />
            保存する
          </Button>
        </Flex>
      </Flex>

      <ToggleGroup.Root aria-label="コーデの絞り込み条件" multiple value={filters} onValueChange={setFilters} className="c--bld-scroll">
        {builderFilters.map((f) => (
          <ToggleGroup.Item key={f.label} value={f.label} variant="outline" className="c--bld-pill is-filter">
            <MaterialIcon name={f.icon} size={14} />
            <span>{f.label}</span>
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>

      <div className="c--bld-stage">
        <h2 className="u-visually-hidden">コーデキャンバス</h2>
        <Flex ai="center" jc="between" g="10" p="10" mb="20" className="c--bld-analysis">
          <Flex ai="center" g="20" style={{ minWidth: 0 }}>
            <span className="c--bld-badge" style={{ width: 32, height: 32, background: "var(--accent-soft)", color: "var(--on-accent-soft)" }}>
              <MaterialIcon name="magic_button" size={18} />
            </span>
            <Stack g="0" style={{ minWidth: 0 }}>
              <Flex ai="center" g="10" fxw="wrap">
                <Progress.Root value={builderAnalysis.score} aria-label="コーデの相性スコア" className="c--bld-score">
                  <span className="c--bld-label" style={{ color: "var(--accent)" }}>
                    Match {builderAnalysis.score}%
                  </span>
                </Progress.Root>
                <Inline fz="xs" fw="600">
                  {builderAnalysis.palette}
                </Inline>
              </Flex>
              <Text fz="2xs" c="text-2">
                {builderAnalysis.note}
              </Text>
            </Stack>
          </Flex>
          <Button iconOnly square variant="ghost" aria-label="診断の詳細" className="c--bld-round is-sm" style={roundBtn} onClick={() => notify("AI相性診断: 96% (カラーバランス極めて良好)")}>
            <MaterialIcon name="analytics" size={16} />
          </Button>
        </Flex>

        <Stack g="10">
          {zoneRow("tops", current("tops"), "Zone 01: Tops & Outer")}
          {zoneRow("bottoms", current("bottoms"), "Zone 02: Bottoms")}
          <Grid gtc="1fr 1fr" g="10">
            {smallCard("shoes", current("shoes"), "Footwear")}
            {smallCard("accessories", current("accessories"), "Acc & Bag")}
          </Grid>
        </Stack>
      </div>

      <Box p="20" className="c--bld-drawer" as="section" aria-labelledby="bld-drawer-title">
        <Flex ai="center" jc="between" mb="10">
          <Flex ai="center" g="10">
            <MaterialIcon name="checkroom" size={18} style={{ color: "var(--accent)" }} />
            <Heading level="2" id="bld-drawer-title" ff="accent" fz="s" fw="500">
              クローゼットから選ぶ
            </Heading>
          </Flex>
          <Inline fz="2xs" c="text-2">
            タップして差替え
          </Inline>
        </Flex>
        <Tabs.Root value={tab} onValueChange={(v) => setTab(String(v) as Category)}>
          <Tabs.List aria-label="アイテムのカテゴリ" className="c--bld-scroll c--bld-tablist">
            {drawerTabs.map((t) => (
              <Tabs.Tab key={t.key} value={t.key} className="c--bld-pill is-plain">
                {t.label} ({t.count})
              </Tabs.Tab>
            ))}
          </Tabs.List>
          {drawerTabs.map((t) => {
            const slot = catToSlot(t.key);
            const list = slot ? slotItems(slot) : [];
            return (
              <Tabs.Panel key={t.key} value={t.key}>
                {slot === null ? (
                  <Empty.Root>
                    <Empty.Title level="3">このカテゴリのアイテムはまだありません</Empty.Title>
                  </Empty.Root>
                ) : null}
                <ScrollArea aria-label={`${t.label}のアイテム`}>
                  <ul className="c--bld-scroll c--bld-list">
                    {list.map((it) => {
                      const on = slot ? sel[slot] === it.id : false;
                      return (
                        <li key={it.id}>
                          <button
                            type="button"
                            aria-pressed={on}
                            className={`c--bld-wcard${on ? " is-selected" : ""}`}
                            onClick={() => {
                              if (!slot) return;
                              choose(slot, it);
                              notify(`${it.name} をセットしました`, true);
                            }}
                          >
                            <div className="c--bld-thumb" style={{ height: 96, marginBottom: 6, position: "relative" }}>
                              <img src={it.imageUrl} alt="" />
                              {on && (
                                <span className="c--bld-badge" style={{ position: "absolute", top: 4, right: 4, width: 16, height: 16, background: "var(--accent)", color: "var(--on-accent)" }}>
                                  <MaterialIcon name="check" size={10} />
                                </span>
                              )}
                            </div>
                            <Text fz="2xs" fw="500" className="c--bld-ellipsis">
                              {it.shortName}
                            </Text>
                            <Text fz="2xs" c={on ? "accent" : "text-2"} className="c--bld-ellipsis">
                              {on ? "選択中" : it.color.split(" / ")[0]}
                            </Text>
                          </button>
                        </li>
                      );
                    })}
                    <li>
                      <button type="button" className="c--bld-wcard is-add" onClick={() => notify("アイテムの追加は準備中です")}>
                        <span className="c--bld-badge" style={{ width: 32, height: 32, background: "var(--surface-highest)", marginBottom: 4 }}>
                          <MaterialIcon name="add_a_photo" size={18} />
                        </span>
                        <Inline fz="2xs" fw="500">
                          アイテム追加
                        </Inline>
                        <Inline fz="2xs" c="text-2">
                          カメラ・画像
                        </Inline>
                      </button>
                    </li>
                  </ul>
                </ScrollArea>
              </Tabs.Panel>
            );
          })}
        </Tabs.Root>
      </Box>

      <div role="status" className="u-visually-hidden">
        {announce}
      </div>
      <div role="status" aria-live="polite" aria-hidden={toastSilent || undefined} className={`c--bld-toast${toast ? " is-show" : ""}`}>
        {toast && <MaterialIcon name="verified" size={18} style={{ color: "var(--accent-soft)" }} />}
        <span>{toast}</span>
      </div>
    </Stack>
  );
}
