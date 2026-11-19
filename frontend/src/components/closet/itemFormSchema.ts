import { z } from "zod";
import type { Category, Season } from "../../mocks/types";

export const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: "tops", label: "トップス" },
  { value: "bottoms", label: "ボトムス" },
  { value: "outer", label: "アウター" },
  { value: "shoes", label: "シューズ" },
  { value: "accessories", label: "アクセサリー" },
];

export const SEASON_OPTIONS: { value: Season; label: string }[] = [
  { value: "spring", label: "春" },
  { value: "summer", label: "夏" },
  { value: "autumn", label: "秋" },
  { value: "winter", label: "冬" },
];

const categoryValues = CATEGORY_OPTIONS.map((o) => o.value) as [Category, ...Category[]];
const seasonValues = SEASON_OPTIONS.map((o) => o.value) as [Season, ...Season[]];

/** Form values stay strings (the way inputs hold them); `toClothingItem` converts on submit. */
export const itemFormSchema = z.object({
  brand: z
    .string()
    .trim()
    .min(1, "ブランドを入力してください。")
    .max(60, "60文字以内で入力してください。"),
  name: z
    .string()
    .trim()
    .min(1, "アイテム名を入力してください。")
    .max(80, "80文字以内で入力してください。"),
  color: z
    .string()
    .trim()
    .min(1, "カラーを入力してください。")
    .max(40, "40文字以内で入力してください。"),
  category: z.enum(categoryValues, "カテゴリを選択してください。"),
  seasons: z.array(z.enum(seasonValues)).min(1, "季節を1つ以上選択してください。"),
  size: z.string().trim().max(20, "20文字以内で入力してください。"),
  material: z.string().trim().max(60, "60文字以内で入力してください。"),
  price: z
    .string()
    .trim()
    .regex(/^\d{0,9}$/, "半角数字で入力してください。"),
  purchasedAt: z
    .string()
    .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "日付の形式が正しくありません。"),
  favorite: z.boolean(),
});

export type ItemFormValues = z.input<typeof itemFormSchema>;

export const itemFormDefaults: ItemFormValues = {
  brand: "",
  name: "",
  color: "",
  category: "tops",
  seasons: [],
  size: "",
  material: "",
  price: "",
  purchasedAt: "",
  favorite: false,
};
