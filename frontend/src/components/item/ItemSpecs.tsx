import { useId, useState } from "react";
import { MaterialIcon } from "../MaterialIcon";
import type { MockItem } from "../../mocks/item";

type Props = { item: MockItem; onToast: (msg: string) => void };

export function ItemSpecs({ item, onToast }: Props) {
  const uid = useId();
  const [category, setCategory] = useState(item.category);
  const [color, setColor] = useState(item.colorShort);
  const [size, setSize] = useState(item.sizeSpec);
  const [purchasedAt, setPurchasedAt] = useState(item.purchasedAt);
  const [price, setPrice] = useState(String(item.price));
  const [cleaning, setCleaning] = useState(false);
  const [seasons, setSeasons] = useState(
    () => new Set(item.seasons.filter((s) => s.on).map((s) => s.key)),
  );

  const toggleSeason = (key: string) =>
    setSeasons((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
      <div className="c--itemRow" style={{ paddingBottom: 4 }}>
        <h2 className="c--itemMicro" style={{ margin: 0, fontWeight: 400 }}>
          アイテム仕様 &amp; 保管状態
        </h2>
        <span className="c--itemMicro" style={{ textTransform: "none" }}>
          タップして編集
        </span>
      </div>

      <div className="c--itemTile c--itemRow">
        <div className="c--itemRow" style={{ gap: 12, flex: 1, minWidth: 0 }}>
          <span className="c--itemIconCircle">
            <MaterialIcon name="checkroom" size={18} />
          </span>
          <label className="c--itemField" htmlFor={`${uid}-cat`}>
            <span className="c--itemMicro">カテゴリー</span>
            <input id={`${uid}-cat`} value={category} onChange={(e) => setCategory(e.target.value)} />
          </label>
        </div>
        <MaterialIcon name="chevron_right" size={18} style={{ color: "var(--on-surface-variant)" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div className="c--itemTile c--itemRow">
          <label className="c--itemField" htmlFor={`${uid}-color`}>
            <span className="c--itemMicro">カラー表記</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="c--itemDot" style={{ background: item.colorHex, width: 12, height: 12 }} />
              <input id={`${uid}-color`} value={color} onChange={(e) => setColor(e.target.value)} />
            </span>
          </label>
          <MaterialIcon name="expand_more" size={16} style={{ color: "var(--on-surface-variant)" }} />
        </div>
        <div className="c--itemTile c--itemRow">
          <label className="c--itemField" htmlFor={`${uid}-size`}>
            <span className="c--itemMicro">サイズ区分</span>
            <input id={`${uid}-size`} value={size} onChange={(e) => setSize(e.target.value)} />
          </label>
          <MaterialIcon name="expand_more" size={16} style={{ color: "var(--on-surface-variant)" }} />
        </div>
      </div>

      <div className="c--itemTile" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="c--itemRow">
          <span className="c--itemMicro">素材構成 &amp; ケアガイド</span>
          <span style={{ fontSize: 11, fontWeight: 500, color: "var(--accent)" }}>{item.material}</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingTop: 4 }}>
          {item.care.map((c) => (
            <span key={c.label} className="c--itemCare">
              <MaterialIcon name={c.icon} size={15} />
              {c.label}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <label className="c--itemTile c--itemField" htmlFor={`${uid}-when`}>
          <span className="c--itemMicro">購入時期</span>
          <input id={`${uid}-when`} value={purchasedAt} onChange={(e) => setPurchasedAt(e.target.value)} />
        </label>
        <label className="c--itemTile c--itemField" htmlFor={`${uid}-price`}>
          <span className="c--itemMicro">購入金額 (税込)</span>
          <input
            id={`${uid}-price`}
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
          />
        </label>
      </div>

      <div className="c--itemTile c--itemRow">
        <div className="c--itemRow" style={{ gap: 10, minWidth: 0 }}>
          <MaterialIcon name="local_laundry_service" size={20} style={{ color: "var(--on-surface-variant)" }} />
          <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span id={`${uid}-clean`} style={{ fontSize: 14, fontWeight: 500 }}>
              現在クリーニング預け中
            </span>
            <span className="c--itemMicro" style={{ textTransform: "none", letterSpacing: 0 }}>
              コーデ生成候補から一時的に除外されます
            </span>
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={cleaning}
          aria-labelledby={`${uid}-clean`}
          className="c--itemSwitch"
          onClick={() => {
            onToast(cleaning ? "ステータス: クローゼット保管中" : "ステータス: クリーニング中に設定");
            setCleaning(!cleaning);
          }}
        />
      </div>

      <div className="c--itemTile" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="c--itemMicro">着用推奨シーズン</span>
        <div className="c--itemSeasons">
          {item.seasons.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`c--itemSeason${s.disabled ? " is-off" : ""}`}
              aria-pressed={seasons.has(s.key)}
              onClick={() => toggleSeason(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
