import { useId, useState } from "react";
import { Field, Input, NativeSelect, Switch, ToggleGroup } from "@utakata-ui/react";
import { MaterialIcon } from "../MaterialIcon";
import type { MockItem } from "../../mocks/item";

type Props = { item: MockItem; onToast: (msg: string) => void };

const CATEGORIES = [
  "トップス › クルーネックニット",
  "トップス › カーディガン",
  "トップス › シャツ",
  "ボトムス › ワイドスラックス",
  "アウター › トレンチコート",
];
const COLORS = ["Charcoal", "Black", "White", "Navy", "Beige", "Brown"];
const SIZES = ["01 / S相当", "02 / M相当", "03 / L相当", "04 / XL相当"];

export function ItemSpecs({ item, onToast }: Props) {
  const uid = useId();
  const [category, setCategory] = useState(item.category);
  const [color, setColor] = useState(item.colorShort);
  const [size, setSize] = useState(item.sizeSpec);
  const [purchasedAt, setPurchasedAt] = useState(item.purchasedAt);
  const [price, setPrice] = useState(String(item.price));
  const [cleaning, setCleaning] = useState(false);
  const [seasons, setSeasons] = useState<string[]>(() => item.seasons.filter((s) => s.on).map((s) => s.key));

  return (
    <section
      aria-labelledby={`${uid}-h`}
      style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}
    >
      <div className="c--itemRow" style={{ paddingBottom: 4 }}>
        <h2 id={`${uid}-h`} className="c--itemMicro" style={{ margin: 0, fontWeight: 400 }}>
          アイテム仕様 &amp; 保管状態
        </h2>
        <span className="c--itemMicro" style={{ textTransform: "none" }}>
          項目を選んで編集
        </span>
      </div>

      <div className="c--itemTile c--itemRow">
        <span className="c--itemIconCircle">
          <MaterialIcon name="checkroom" size={18} />
        </span>
        <Field.Root name="category" className="c--itemField">
          <Field.Label className="c--itemMicro">カテゴリー</Field.Label>
          <NativeSelect value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </NativeSelect>
        </Field.Root>
      </div>

      <div className="c--itemPair">
        <div className="c--itemTile">
          <Field.Root name="color" className="c--itemField">
            <Field.Label className="c--itemMicro">
              <span className="c--itemDot" style={{ background: item.colorHex }} aria-hidden="true" /> カラー表記
            </Field.Label>
            <NativeSelect value={color} onChange={(e) => setColor(e.target.value)}>
              {COLORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </NativeSelect>
          </Field.Root>
        </div>
        <div className="c--itemTile">
          <Field.Root name="size" className="c--itemField">
            <Field.Label className="c--itemMicro">サイズ区分</Field.Label>
            <NativeSelect value={size} onChange={(e) => setSize(e.target.value)}>
              {SIZES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </NativeSelect>
          </Field.Root>
        </div>
      </div>

      <div className="c--itemTile" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="c--itemRow">
          <h3 className="c--itemMicro" style={{ margin: 0, fontWeight: 400 }}>
            素材構成 &amp; ケアガイド
          </h3>
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--accent)" }}>{item.material}</span>
        </div>
        <ul className="c--itemCareList" aria-label="ケア表示">
          {item.care.map((c) => (
            <li key={c.label} className="c--itemCare">
              <MaterialIcon name={c.icon} size={15} />
              {c.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="c--itemPair">
        <div className="c--itemTile">
          <Field.Root name="purchasedAt" className="c--itemField">
            <Field.Label className="c--itemMicro">購入時期</Field.Label>
            <Input value={purchasedAt} onChange={(e) => setPurchasedAt(e.target.value)} />
          </Field.Root>
        </div>
        <div className="c--itemTile">
          <Field.Root name="price" className="c--itemField">
            <Field.Label className="c--itemMicro">購入金額 (税込・円)</Field.Label>
            <Input
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
            />
            <Field.Description>半角数字のみ</Field.Description>
          </Field.Root>
        </div>
      </div>

      <Field.Root name="cleaning" className="c--itemTile c--itemSwitchRow">
        <MaterialIcon name="local_laundry_service" size={20} style={{ color: "var(--on-surface-variant)" }} />
        <span className="c--itemSwitchText">
          <Field.Label className="c--itemSwitchLabel">現在クリーニング預け中</Field.Label>
          <Field.Description className="c--itemMicro" style={{ textTransform: "none", letterSpacing: 0 }}>
            コーデ生成候補から一時的に除外されます
          </Field.Description>
        </span>
        <Switch.Root
          checked={cleaning}
          onCheckedChange={(next) => {
            onToast(next ? "ステータス: クリーニング中に設定" : "ステータス: クローゼット保管中");
            setCleaning(next);
          }}
        >
          <Switch.Thumb />
        </Switch.Root>
      </Field.Root>

      <div className="c--itemTile" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span id={`${uid}-season`} className="c--itemMicro">
          着用推奨シーズン
        </span>
        <ToggleGroup.Root
          multiple
          aria-labelledby={`${uid}-season`}
          className="c--itemSeasons"
          value={seasons}
          onValueChange={setSeasons}
        >
          {item.seasons.map((s) => (
            <ToggleGroup.Item key={s.key} value={s.key} disabled={s.disabled} className="c--itemSeason">
              {s.label}
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
      </div>
    </section>
  );
}
