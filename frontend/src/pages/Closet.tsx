import { useState } from "react";
import { Button, Empty, Field, Input, ToggleGroup } from "@utakata-ui/react";
import { Flex, Stack } from "lism-css/react";
import { MaterialIcon } from "../components/MaterialIcon";
import { ItemCard } from "../components/closet/ItemCard";
import "../components/closet/closet.css";
import { categoryFilters, closetItems, closetTotal, sortOptions } from "../mocks/closet";

export function Closet() {
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<string>(sortOptions[0]);
  const [query, setQuery] = useState("");
  const [favs, setFavs] = useState(() => new Set(closetItems.filter((i) => i.favorite).map((i) => i.id)));

  const toggleFav = (id: string) =>
    setFavs((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const q = query.trim().toLowerCase();
  const items = closetItems
    .filter((i) => category === "all" || i.category === category)
    .filter((i) => !q || `${i.brand} ${i.name} ${i.color}`.toLowerCase().includes(q))
    .map((i) => ({ ...i, favorite: favs.has(i.id) }));

  return (
    <Stack g="20">
      <h1 className="u-visually-hidden">クローゼット</h1>

      <Flex g="10" ai="center">
        <div role="search" className="c--closetSearch">
          <Field.Root name="q">
            <Field.Label className="u-visually-hidden">アイテムを検索</Field.Label>
            <MaterialIcon name="search" size={18} />
            <Input
              type="search"
              autoComplete="off"
              enterKeyHint="search"
              placeholder="ブランド・アイテム・素材を検索..."
              value={query}
              onValueChange={setQuery}
            />
          </Field.Root>
        </div>
        <div className="c--closetCount">
          <b>{closetTotal}</b>アイテム
        </div>
      </Flex>

      <ToggleGroup.Root
        aria-label="カテゴリ"
        className="c--closetScroll"
        value={[category]}
        onValueChange={(v) => v[0] && setCategory(v[0])}
      >
        {categoryFilters.map((c) => (
          <ToggleGroup.Item key={c.key} value={c.key} variant="outline" className="c--chip">
            <span>{c.label}</span>
            <small>{c.count}</small>
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>

      <ToggleGroup.Root
        aria-label="並び替え"
        className="c--closetScroll"
        value={[sort]}
        onValueChange={(v) => v[0] && setSort(v[0])}
      >
        {sortOptions.map((s) => (
          <ToggleGroup.Item key={s} value={s} variant="outline" className="c--sortBtn">
            {s}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>

      <h2 className="u-visually-hidden">アイテム一覧</h2>
      <p role="status" className="u-visually-hidden">
        {items.length}件
      </p>

      {items.length === 0 ? (
        <Empty.Root>
          <Empty.Title level="3">該当するアイテムがありません</Empty.Title>
          <Empty.Description>検索語やカテゴリを変えてお試しください。</Empty.Description>
        </Empty.Root>
      ) : (
        <ul className="c--closetList">
          {items.map((item) => (
            <li key={item.id}>
              <ItemCard item={item} onToggleFavorite={toggleFav} />
            </li>
          ))}
        </ul>
      )}

      <Flex ai="center" jc="center" g="10" fz="2xs" c="var(--on-surface-variant)" mt="10" pb="60">
        <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} />
        <span>アーカイブ同期完了・今季{closetTotal}点登録中</span>
      </Flex>

      <Button className="c--closetFab" type="button">
        <MaterialIcon name="add_a_photo" size={20} />
        アイテム追加
      </Button>
    </Stack>
  );
}
