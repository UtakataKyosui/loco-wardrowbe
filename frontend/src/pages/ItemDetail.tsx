import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Button, Toast, Toggle, useToastManager } from "@utakata-ui/react";
import { MaterialIcon } from "../components/MaterialIcon";
import { ItemGallery } from "../components/item/ItemGallery";
import { ItemLooks } from "../components/item/ItemLooks";
import { ItemSpecs } from "../components/item/ItemSpecs";
import { ItemSummary } from "../components/item/ItemSummary";
import "../components/item/item.css";
import { mockItem } from "../mocks/item";

/** Toasts are polite live-region messages that the user can dismiss (WCAG 4.1.3, 2.2.1). */
function ToastList() {
  const { toasts } = useToastManager();
  return toasts.map((toast) => (
    <Toast.Root key={toast.id} toast={toast}>
      <Toast.Content className="c--itemToastContent">
        <MaterialIcon name="check_circle" size={18} style={{ color: "var(--accent)" }} />
        <Toast.Title />
        <Toast.Close className="c--itemToastClose">閉じる</Toast.Close>
      </Toast.Content>
    </Toast.Root>
  ));
}

function ItemDetailInner() {
  const item = mockItem;
  const [favorite, setFavorite] = useState(true);
  const toasts = useToastManager();

  const notify = (title: string) => {
    toasts.close();
    toasts.add({ title, priority: "low", timeout: 5000 });
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    notify("アイテム情報を最新に保存しました");
  };

  return (
    <div className="c--item">
      <div className="c--itemSub">
        <Link to="/closet" className="c--itemBack">
          <MaterialIcon name="arrow_back" size={20} />
          クローゼット
        </Link>
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            iconOnly
            square
            variant="ghost"
            aria-label="共有"
            className="c--itemRoundBtn"
            style={{ "--ui-button-square-size": "44px", minHeight: 44 } as React.CSSProperties}
          >
            <MaterialIcon name="share" size={18} />
          </Button>
          <Toggle
            iconOnly
            variant="ghost"
            aria-label="お気に入り"
            className="c--itemRoundBtn"
            pressed={favorite}
            onPressedChange={(next) => {
              notify(next ? "お気に入りに登録しました" : "お気に入りから解除しました");
              setFavorite(next);
            }}
          >
            <MaterialIcon name="favorite" size={19} filled={favorite} />
          </Toggle>
        </div>
      </div>

      <ItemGallery images={item.images} />
      <ItemSummary item={item} />

      <form onSubmit={onSubmit}>
        <ItemSpecs item={item} onToast={notify} />
        <ItemLooks looks={item.looks} />

        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 8 }}>
          <Button type="submit" variant="solid" size="lg" className="c--itemSave">
            <MaterialIcon name="done" size={18} />
            変更内容を保存する
          </Button>
          <div className="c--itemRow" style={{ padding: "0 4px" }}>
            <Button type="button" variant="ghost" className="c--itemTextBtn">
              <MaterialIcon name="content_copy" size={15} />
              アイテム情報を複製
            </Button>
            <Button type="button" variant="ghost" className="c--itemTextBtn is-danger">
              <MaterialIcon name="inventory_2" size={15} />
              手放す・アーカイブ
            </Button>
          </div>
        </div>
      </form>

      <Toast.Portal>
        <Toast.Viewport aria-label="通知" className="c--itemToastViewport">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </div>
  );
}

export function ItemDetail() {
  return (
    <Toast.Provider timeout={5000} limit={3}>
      <ItemDetailInner />
    </Toast.Provider>
  );
}
