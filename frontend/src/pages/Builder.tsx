import { useEffect, useRef, useState } from "react";
import { Box, Flex, Grid, Heading, Inline, Stack, Text } from "lism-css/react";
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
const catToSlot = (cat: Category): BuilderSlot | null => (cat === "outer" ? null : cat);

export function Builder() {
  const [sel, setSel] = useState<Record<BuilderSlot, string>>(defaultSelection);
  const [tab, setTab] = useState<Category>("tops");
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const notify = (msg: string) => {
    setToast(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2200);
  };

  const current = (slot: BuilderSlot) => builderItems.find((i) => i.id === sel[slot]) ?? slotItems(slot)[0];
  const cycle = (slot: BuilderSlot, dir: number) => {
    const list = slotItems(slot);
    const idx = list.findIndex((i) => i.id === sel[slot]);
    setSel({ ...sel, [slot]: list[(idx + dir + list.length) % list.length].id });
  };

  const drawerSlot = catToSlot(tab);
  const drawer = drawerSlot ? slotItems(drawerSlot) : [];

  const zoneRow = (slot: "tops" | "bottoms", item: BuilderItem, zoneLabel: string, prev: string, next: string) => (
    <div className="c--bld-card">
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
        <button type="button" aria-label={prev} className="c--bld-round" onClick={() => cycle(slot, -1)}>
          <MaterialIcon name="chevron_left" size={18} />
        </button>
        <Flex ai="center" g="20" style={{ flex: 1, minWidth: 0 }}>
          <div className="c--bld-thumb" style={{ width: 112, height: 128, flex: "none" }}>
            <img src={item.imageUrl} alt={item.name} />
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
        <button type="button" aria-label={next} className="c--bld-round" onClick={() => cycle(slot, 1)}>
          <MaterialIcon name="chevron_right" size={18} />
        </button>
      </Flex>
    </div>
  );

  const smallCard = (slot: "shoes" | "accessories", item: BuilderItem, label: string) => (
    <div className="c--bld-card" style={{ minWidth: 0 }}>
      <Flex ai="center" jc="between">
        <span className="c--bld-label" style={{ color: "var(--on-surface-variant)" }}>
          {label}
        </span>
        <button type="button" aria-label={`${label}を入れ替え`} className="c--bld-round is-sm" onClick={() => cycle(slot, 1)}>
          <MaterialIcon name="swap_horiz" size={14} />
        </button>
      </Flex>
      <div className="c--bld-thumb" style={{ height: 96, margin: "4px 0" }}>
        <img src={item.imageUrl} alt={item.name} />
      </div>
      <Text fz="xs" fw="500" className="c--bld-ellipsis">
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
          <Heading level="2" ff="accent" fz="l" fw="500">
            コーデを組み立てる
          </Heading>
          <Text fz="2xs" c="text-2" tt="uppercase" lts="l">
            Vol. 14 / Spring Archival
          </Text>
        </Stack>
        <Flex g="10">
          <button
            type="button"
            className="c--bld-pill is-plain"
            style={{ height: 36 }}
            onClick={() => {
              setSel(defaultSelection);
              notify("キャンバスをリセットしました");
            }}
          >
            クリア
          </button>
          <button type="button" className="c--bld-pill is-primary" style={{ height: 36 }} onClick={() => notify("Lookbook #44 にセットアップを保存しました")}>
            <MaterialIcon name="bookmark_add" size={16} />
            保存する
          </button>
        </Flex>
      </Flex>

      <div className="c--bld-scroll">
        {builderFilters.map((f) => (
          <button key={f.label} type="button" className={`c--bld-pill${f.active ? " is-active" : ""}`}>
            <MaterialIcon name={f.icon} size={14} style={f.active ? { color: "var(--accent)" } : undefined} />
            <span>{f.label}</span>
            {f.chevron && <MaterialIcon name="expand_more" size={14} />}
          </button>
        ))}
      </div>

      <div className="c--bld-stage">
        <Flex ai="center" jc="between" g="10" p="10" mb="20" className="c--bld-analysis">
          <Flex ai="center" g="20" style={{ minWidth: 0 }}>
            <span className="c--bld-badge" style={{ width: 32, height: 32, background: "var(--accent-soft)", color: "var(--on-accent-container)" }}>
              <MaterialIcon name="magic_button" size={18} />
            </span>
            <Stack g="0" style={{ minWidth: 0 }}>
              <Flex ai="center" g="10" fxw="wrap">
                <span className="c--bld-label" style={{ color: "var(--accent)" }}>
                  Match {builderAnalysis.score}%
                </span>
                <Inline fz="xs" fw="600">
                  {builderAnalysis.palette}
                </Inline>
              </Flex>
              <Text fz="2xs" c="text-2">
                {builderAnalysis.note}
              </Text>
            </Stack>
          </Flex>
          <button type="button" aria-label="診断の詳細" className="c--bld-round is-sm" style={{ width: 28, height: 28 }} onClick={() => notify("AI相性診断: 96% (カラーバランス極めて良好)")}>
            <MaterialIcon name="analytics" size={16} />
          </button>
        </Flex>

        <Stack g="10">
          {zoneRow("tops", current("tops"), "Zone 01: Tops & Outer", "前のトップス", "次のトップス")}
          {zoneRow("bottoms", current("bottoms"), "Zone 02: Bottoms", "前のボトムス", "次のボトムス")}
          <Grid gtc="1fr 1fr" g="10">
            {smallCard("shoes", current("shoes"), "Footwear")}
            {smallCard("accessories", current("accessories"), "Acc & Bag")}
          </Grid>
        </Stack>
      </div>

      <Box p="20" className="c--bld-drawer">
        <Flex ai="center" jc="between" mb="10">
          <Flex ai="center" g="10">
            <MaterialIcon name="checkroom" size={18} style={{ color: "var(--accent)" }} />
            <Inline ff="accent" fz="s" fw="500">
              クローゼットから選ぶ
            </Inline>
          </Flex>
          <Inline fz="2xs" c="text-2">
            タップして差替え
          </Inline>
        </Flex>
        <div className="c--bld-scroll" role="tablist" style={{ paddingBottom: 8 }}>
          {drawerTabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={`c--bld-pill${tab === t.key ? " is-primary" : " is-plain"}`}
              onClick={() => setTab(t.key)}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>
        <div className="c--bld-scroll" style={{ padding: "4px 2px" }}>
          {drawer.map((it) => {
            const on = drawerSlot ? sel[drawerSlot] === it.id : false;
            return (
              <button
                key={it.id}
                type="button"
                className={`c--bld-wcard${on ? " is-selected" : ""}`}
                onClick={() => {
                  if (!drawerSlot) return;
                  setSel({ ...sel, [drawerSlot]: it.id });
                  notify(`${it.name} をセットしました`);
                }}
              >
                <div className="c--bld-thumb" style={{ height: 96, marginBottom: 6, position: "relative" }}>
                  <img src={it.imageUrl} alt={it.name} />
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
            );
          })}
          {drawerSlot === null && (
            <Text fz="xs" c="text-2" py="20">
              このカテゴリのアイテムはまだありません
            </Text>
          )}
          <button type="button" className="c--bld-wcard is-add">
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
        </div>
      </Box>

      <div role="status" aria-live="polite" className={`c--bld-toast${toast ? " is-show" : ""}`}>
        <MaterialIcon name="verified" size={18} style={{ color: "var(--accent-soft)" }} />
        <span>{toast}</span>
      </div>
    </Stack>
  );
}
