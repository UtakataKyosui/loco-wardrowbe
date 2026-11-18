import { useState } from "react";
import { Flex, Grid, Stack } from "lism-css/react";
import { MaterialIcon } from "../components/MaterialIcon";
import { ItemCard } from "../components/closet/ItemCard";
import "../components/closet/closet.css";
import { categoryFilters, closetItems, closetTotal, sortOptions } from "../mocks/closet";

export function Closet() {
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState(sortOptions[0]);
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
      <Flex g="10" ai="center">
        <label className="c--closetSearch">
          <MaterialIcon name="search" size={18} />
          <input
            type="search"
            placeholder="ブランド・アイテム・素材を検索..."
            aria-label="アイテムを検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="c--closetCount">
          <b>{closetTotal}</b>アイテム
        </div>
      </Flex>

      <div className="c--closetScroll" role="group" aria-label="カテゴリ">
        {categoryFilters.map((c) => (
          <button key={c.key} type="button" className="c--chip" aria-pressed={category === c.key} onClick={() => setCategory(c.key)}>
            <span>{c.label}</span>
            <small>{c.count}</small>
          </button>
        ))}
      </div>

      <div className="c--closetScroll" role="group" aria-label="並び替え">
        {sortOptions.map((s, i) => (
          <button key={s} type="button" className="c--sortBtn" aria-pressed={sort === s} onClick={() => setSort(s)}>
            <span>{s}</span>
            {i === 0 && <MaterialIcon name="expand_more" size={14} />}
            {i === 2 && <MaterialIcon name="tune" size={14} />}
          </button>
        ))}
      </div>

      <Grid gtc="repeat(2, minmax(0, 1fr))" g="20">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} onToggleFavorite={toggleFav} />
        ))}
      </Grid>

      <Flex ai="center" jc="center" g="10" fz="2xs" c="var(--on-surface-variant)" mt="10">
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} />
        <span>アーカイブ同期完了・今季{closetTotal}点登録中</span>
      </Flex>

      <button type="button" className="c--closetFab">
        <MaterialIcon name="add_a_photo" size={20} />
        アイテム追加
      </button>
    </Stack>
  );
}
