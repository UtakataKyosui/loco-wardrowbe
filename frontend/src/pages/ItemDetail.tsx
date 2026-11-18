import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MaterialIcon } from "../components/MaterialIcon";
import { ItemGallery } from "../components/item/ItemGallery";
import { ItemLooks } from "../components/item/ItemLooks";
import { ItemSpecs } from "../components/item/ItemSpecs";
import { ItemSummary } from "../components/item/ItemSummary";
import "../components/item/item.css";
import { mockItem } from "../mocks/item";

export function ItemDetail() {
  const item = mockItem;
  const [favorite, setFavorite] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const showToast = (msg: string) => {
    setToast(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2200);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div className="c--item">
      <div className="c--itemSub">
        <Link to="/closet" className="c--itemBack">
          <MaterialIcon name="arrow_back" size={20} />
          クローゼット
        </Link>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="c--itemRoundBtn" aria-label="共有">
            <MaterialIcon name="share" size={18} />
          </button>
          <button
            type="button"
            className="c--itemRoundBtn"
            aria-label="お気に入り"
            aria-pressed={favorite}
            onClick={() => {
              showToast(favorite ? "お気に入りから解除しました" : "お気に入りに登録しました");
              setFavorite(!favorite);
            }}
          >
            <MaterialIcon name="favorite" size={19} filled={favorite} />
          </button>
        </div>
      </div>

      <ItemGallery images={item.images} />
      <ItemSummary item={item} />
      <ItemSpecs item={item} onToast={showToast} />
      <ItemLooks looks={item.looks} />

      <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 8 }}>
        <button type="button" className="c--itemSave" onClick={() => showToast("アイテム情報を最新に保存しました")}>
          <MaterialIcon name="done" size={18} />
          変更内容を保存する
        </button>
        <div className="c--itemRow" style={{ padding: "0 4px" }}>
          <button type="button" className="c--itemTextBtn">
            <MaterialIcon name="content_copy" size={15} />
            アイテム情報を複製
          </button>
          <button type="button" className="c--itemTextBtn is-danger">
            <MaterialIcon name="inventory_2" size={15} />
            手放す・アーカイブ
          </button>
        </div>
      </div>

      {toast && (
        <div className="c--itemToast" role="status">
          <MaterialIcon name="check_circle" size={18} style={{ color: "var(--accent)" }} />
          {toast}
        </div>
      )}
    </div>
  );
}
