import { useState } from "react";
import { MaterialIcon } from "../MaterialIcon";
import type { MockItem } from "../../mocks/item";

export function ItemGallery({ images }: { images: MockItem["images"] }) {
  const [index, setIndex] = useState(0);
  const current = images[index];
  return (
    <section className="c--itemCard c--itemGallery" aria-label="アイテム写真">
      <div className="c--itemStage">
        <img alt={current.alt} src={current.src} />
        <div className="c--itemGlass c--itemBadge">
          <MaterialIcon name="magic_button" size={13} style={{ color: "var(--accent)" }} />
          背景透過・補正済
        </div>
        <div className="c--itemStageActions">
          <button type="button" aria-label="撮り直す" className="c--itemGlass c--itemStageBtn">
            <MaterialIcon name="photo_camera" size={16} />
          </button>
          <button type="button" aria-label="拡大" className="c--itemGlass c--itemStageBtn">
            <MaterialIcon name="zoom_in" size={16} />
          </button>
        </div>
        <div className="c--itemCounter">
          {index + 1} / {images.length}
        </div>
      </div>
      <div className="c--itemThumbs">
        {images.map((img, i) => (
          <button
            key={img.src}
            type="button"
            className="c--itemThumb"
            aria-label={`${img.alt} (${i + 1})`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
          >
            <img alt="" src={img.src} />
          </button>
        ))}
        <button type="button" className="c--itemThumbAdd" aria-label="写真を追加">
          <MaterialIcon name="add_photo_alternate" size={18} />
          追加
        </button>
      </div>
    </section>
  );
}
