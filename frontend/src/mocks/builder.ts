import type { Category } from "./types";

export type BuilderSlot = "tops" | "bottoms" | "shoes" | "accessories";

export type BuilderItem = {
  id: string;
  slot: BuilderSlot;
  brand: string;
  name: string;
  shortName: string;
  color: string;
  imageUrl: string;
  chips: string[];
};

const G = "https://lh3.googleusercontent.com/aida-public/";
const img = {
  knit: `${G}AB6AXuDyaL5MmI0G9jO62-XqmWiArKLZcSJhJWvFs0oUfxGjN_TVrQHcMC2LlhqdGFEV5cP0E8zNHQAdd0JHsJ-fqC1N8_eJyvBbc8EtIZPjhResroGEAr63eYl-9FnYm2_BEHD-ycJwIQwNJKpUABkdyzKR7t5lvBlPI4QzfSpc7LYM7Gea_zKXYhQkTPw6Qo0zf0-cOqqqBbw-UiTxQOq_dw_FrIRTO0-uA0iXbNLRDiI`,
  trousers: `${G}AB6AXuAt6J9xfc8WNEIl9so6OWMjshE4zTg0hDYXbgypuzslPV1XPxq5KpKGAXRrYAwLAITF8AiSf6E2tUv-INi5CSuqYBd18OkDDQGX41HR0cbmjzMqvl9InfQ0mmvDWckr8wFMvLg-IqZIpEUdITbzL1l6cft_JB5fatrVhZMm7bCTHH9gcb0ic0VQY7CLiBgUEVN2FX0EaLYJG6KnaehNm-5nLhSfLuwOICHsn9qXMoA`,
  boots: `${G}AB6AXuAgQppK717ZWMFgEOlV11wTOeOvDZdkmcgBskcrVfBm9eMGAesgFYso632AatumXYdt--_QW8uSVGesqiSBIqAhQe8gv5Ig7NbPqolSkFUj8Zw-Dxc7_rAZCX9z-s7FgjD3UZlQG_SMl7chxnqf7-Lo_dZn1xaTM7yGTD_5NQG-rL2ohUI3lMT0x6oHzoJjkCAdIC_0QS1U5EuQKItFvvIxRW3NKpnvNIW9uN2iCoc`,
  tote: `${G}AB6AXuCDHT8f7d83ejNr13sY_pPE2xUz4CP1AWUc_XXgltjbkiDg0yw454MrGemA_b6bqWfCPvVW6yrr5l4_vFMjcZSLtLmPcUhwsLabzv1E-_pf7IfUojXoBbWaAxCx1xuBP77vqTKkvq72dBrPyo1fTefMp17TNPJyDxadnuZU76MBQyH4xfuLWOa4-J4I1tYblxai4Nqqj4t4fEzgv3mcvE7AlqH2x3dsFQT2QD_FpnI`,
  tee: `${G}AB6AXuDqiIIwL5R2skrMSnW2AJJz_kQR7f30yW0FeLXcEPD9B89akrbCG92eYrvnuqESYYLREqgzFlV0WTI7p0ecI3oq-KNKCvfS2lMB1Ca_pNSVlpafzFIzZSDjnHZL2hhNF87zV9KYuVbAc25WLO4h5b1MlLX80kVGEld0ZUj4KIhezl_C7DhYgkltSYpKmY9XURHPM0GL_KJSJRYBjP8ORdD9CT_7_SBfpLkpnTvyz9s`,
  band: `${G}AB6AXuByY2O1hpem-ysWR6bctxol7FUUtcOSDH2GzulkkRvxPcyVGwI9EVbLBZ7u-cB1x0NT25ecJvaawsBiI2v9-vsYQV22hNcAZpoz5GlNZXL5ooTlABJBmnqyrrdoIGPe1hIDBch3eEysAMvlYO5gncHT3C_HGA6K4wydZDwKxAsHCmxSiMA_EBNPthvU33sqbEfmsqyQIjnHyiLeZUQoEw1i8BEnLRNgu7G5mrAmYYs`,
  waffle: `${G}AB6AXuDbY1Y9aUKU6x9DjCBi3nD1sDyEz3t6gI-gd1K_VCsm58PMl3s0Dv5I_UzbIk6j--8UMoz4jWcGnHj-Vv3e0DXyw4Ph5_ffWJ5B2YqDBttq9LzSKr3kQk3NeH3qDRa86SVw18U6rKKXJCJ3-dZsfu30i47qCcjNRAwIAWpzkkqzcLu4ILcDHLZc--sWxlSRkX6f1oSjxjZ6MXhX7ubLuXmszm4Izkm0Epm7nLIEV84`,
};

export const builderItems: BuilderItem[] = [
  {
    id: "t1",
    slot: "tops",
    brand: "ATON TOKYO",
    name: "OVERSIZED CASHMERE KNIT",
    shortName: "CASHMERE KNIT",
    color: "Charcoal Melange / 02",
    imageUrl: img.knit,
    chips: ["カシミヤ 100%", "着用: 3回"],
  },
  {
    id: "t2",
    slot: "tops",
    brand: "AURALEE",
    name: "HEAVYWEIGHT MOCK TEE",
    shortName: "MOCK TEE",
    color: "Blanc Ecru / 04",
    imageUrl: img.tee,
    chips: ["コットン 100%", "着用: 7回"],
  },
  {
    id: "t3",
    slot: "tops",
    brand: "LEMAIRE",
    name: "SILK COTTON BAND COLLAR",
    shortName: "BAND COLLAR",
    color: "Pale Blue / 48",
    imageUrl: img.band,
    chips: ["シルク混", "着用: 2回"],
  },
  {
    id: "t4",
    slot: "tops",
    brand: "AURALEE",
    name: "WAFFLE THERMAL PULLOVER",
    shortName: "THERMAL TOP",
    color: "Heather Grey / 03",
    imageUrl: img.waffle,
    chips: ["コットン 100%", "着用: 5回"],
  },
  {
    id: "b1",
    slot: "bottoms",
    brand: "STUDIO NICHOLSON",
    name: "PLEATED WIDE TROUSERS",
    shortName: "WIDE TROUSERS",
    color: "Sand Beige / M",
    imageUrl: img.trousers,
    chips: ["サマーウール", "ドライクリーニング"],
  },
  {
    id: "b2",
    slot: "bottoms",
    brand: "CIOTA",
    name: "SELVEDGE STRAIGHT DENIM",
    shortName: "STRAIGHT DENIM",
    color: "Medium Indigo / 31",
    imageUrl: img.trousers,
    chips: ["デニム", "着用: 12回"],
  },
  {
    id: "b3",
    slot: "bottoms",
    brand: "MARKAWARE",
    name: "WOOL FLANNEL EASY SLACKS",
    shortName: "EASY SLACKS",
    color: "Dark Charcoal / 02",
    imageUrl: img.trousers,
    chips: ["ウール", "着用: 4回"],
  },
  {
    id: "s1",
    slot: "shoes",
    brand: "OUR LEGACY",
    name: "CHELSEA BOOTS",
    shortName: "CHELSEA BOOTS",
    color: "Black Calf / 41",
    imageUrl: img.boots,
    chips: [],
  },
  {
    id: "s2",
    slot: "shoes",
    brand: "JIL SANDER",
    name: "MINIMAL SUEDE DERBY",
    shortName: "SUEDE DERBY",
    color: "Warm Taupe / 41",
    imageUrl: img.boots,
    chips: [],
  },
  {
    id: "a1",
    slot: "accessories",
    brand: "LEMAIRE",
    name: "LEATHER TOTE",
    shortName: "LEATHER TOTE",
    color: "Espresso / Medium",
    imageUrl: img.tote,
    chips: [],
  },
  {
    id: "a2",
    slot: "accessories",
    brand: "HERMÈS ARCHIVE",
    name: "SILK SCARF 65x65",
    shortName: "SILK SCARF",
    color: "Ecru / Olive",
    imageUrl: img.tote,
    chips: [],
  },
];

export type DrawerTab = { key: Category; label: string; count: number };

export const drawerTabs: DrawerTab[] = [
  { key: "tops", label: "トップス", count: 14 },
  { key: "bottoms", label: "ボトムス", count: 8 },
  { key: "outer", label: "アウター", count: 6 },
  { key: "shoes", label: "シューズ", count: 5 },
  { key: "accessories", label: "小物・バッグ", count: 11 },
];

export const builderFilters = [
  { icon: "wb_sunny", label: "天候: 晴れ / くもり (16℃)", active: true, chevron: true },
  { icon: "coffee", label: "シーン: 休日・カフェ", active: false, chevron: true },
  { icon: "tune", label: "スマート絞り込み", active: false, chevron: false },
];

export const builderAnalysis = {
  score: 96,
  palette: "モノトーン × エクリュ",
  note: "Aライン調和・想定体感: 14℃〜19℃（適温）",
};

export const defaultSelection: Record<BuilderSlot, string> = {
  tops: "t1",
  bottoms: "b1",
  shoes: "s1",
  accessories: "a1",
};
