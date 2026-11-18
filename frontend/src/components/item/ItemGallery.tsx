import { useId, useState, type CSSProperties } from "react";
import { Button, ToggleGroup } from "@utakata-ui/react";
import { MaterialIcon } from "../MaterialIcon";
import type { MockItem } from "../../mocks/item";

const iconBtn = { "--ui-button-square-size": "44px", minHeight: 44 } as CSSProperties;

export function ItemGallery({ images }: { images: MockItem["images"] }) {
  const uid = useId();
  const [index, setIndex] = useState(0);
  const current = images[index];
  return (
    <section className="c--itemCard c--itemGallery" aria-labelledby={`${uid}-h`}>
      <h2 id={`${uid}-h`} className="u-visually-hidden">
        アイテム写真
      </h2>
      <div className="c--itemStage">
        <img alt={current.alt} src={current.src} />
        <div className="c--itemGlass c--itemBadge">
          <MaterialIcon name="magic_button" size={13} style={{ color: "var(--accent)" }} />
          背景透過・補正済
        </div>
        <div className="c--itemStageActions">
          <Button iconOnly square variant="ghost" aria-label="撮り直す" className="c--itemGlass c--itemStageBtn" style={iconBtn}>
            <MaterialIcon name="photo_camera" size={16} />
          </Button>
          <Button iconOnly square variant="ghost" aria-label="拡大" className="c--itemGlass c--itemStageBtn" style={iconBtn}>
            <MaterialIcon name="zoom_in" size={16} />
          </Button>
        </div>
        {/* Persistent polite live region: announces which photo is shown after a thumbnail change. */}
        <p className="c--itemCounter" role="status">
          <span className="u-visually-hidden">写真 </span>
          {index + 1} / {images.length}
        </p>
      </div>
      <div className="c--itemThumbs">
        <ToggleGroup.Root
          aria-label="写真の選択"
          className="c--itemThumbGroup"
          value={[String(index)]}
          onValueChange={(v) => {
            // A photo is always shown, so ignore deselection.
            if (v.length > 0) setIndex(Number(v[v.length - 1]));
          }}
        >
          {images.map((img, i) => (
            <ToggleGroup.Item
              key={img.src}
              value={String(i)}
              aria-label={`${img.alt} (${i + 1} / ${images.length})`}
              className="c--itemThumb"
            >
              <img alt="" src={img.src} />
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
        <Button variant="ghost" className="c--itemThumbAdd">
          <MaterialIcon name="add_photo_alternate" size={18} />
          追加
        </Button>
      </div>
    </section>
  );
}
