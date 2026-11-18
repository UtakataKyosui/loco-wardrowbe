import type { Category, ClothingItem } from "./types";

const img = (id: string) => `https://lh3.googleusercontent.com/aida-public/${id}`;

export const closetItems: ClothingItem[] = [
  {
    id: "c1", brand: "UNIQLO U", name: "Cashmere Knit", color: "Charcoal", category: "tops",
    seasons: ["autumn", "winter"], tag: "A/W", wearCount: 14, favorite: true,
    imageUrl: img("AB6AXuAeJPAiFKDbcYcaKZrH82RcujMVP1VarA_mm_jh-0yV3wuruCsNKGcSY-1RuJfaloZxOm4MlEUl590R7-_y2m-o1jm7x5nvxqQPOhfuxYUSvT-OAO5ppc4gP87yvPOhEYnz2DKnJFTu-y6ai8c-wSqMQPcqUwnclL9SlHyDn3xRDfRgqSPXFxnoDCBF-clQO82jsgI5_DhUfcJK8ud0ksGB_c-EQ7dxENJd8zYErFQ"),
  },
  {
    id: "c2", brand: "STUDIO NICHOLSON", name: "Pleated Wide Pants", color: "Sand Beige", category: "bottoms",
    seasons: ["spring", "summer", "autumn", "winter"], tag: "ALL", wearCount: 8, favorite: false,
    imageUrl: img("AB6AXuA14TUGx7tqNXjmCwsXhAxpJRt7r8N4rVdgm4z4k6_TCdHpRxAEUqQAZcbBsQ9HPkq4XIau8sR4PrR8Pg3YC-9mPk5M61jlgnW24Mw-Codj8a3rYxtpyxfJ95nNoaUys-lDWdNZWFkgTtbsA5rmTPLO8NVYeInHP9qL-Lb9Y7t4Qcdd4heIoF6OoXKWQagJG-LmRSKVWhwfpIFDS8mqAbCy88uUS6vnkNTh-IrxQgk"),
  },
  {
    id: "c3", brand: "LEMAIRE", name: "Tailored Blazer", color: "Navy", category: "outer",
    seasons: ["spring", "autumn"], tag: "DINNER", wearCount: 5, favorite: false,
    imageUrl: img("AB6AXuAMNBxEGoPbgkbcI-zsCmDtpkHtP9v6nRTtXVjCpJHBuH1R4EKWcOVto8XRXa_LbkgO1YJMHeKmAhLVxQyJruvC7xwZwS_2XnyVghgz1xEt25b7HqbQePsZP37EElYF5yhFo9UUO0lcYUV0tLqOmvCXhZlJZJZMfQ47gXP5K3bkcA4cbt4bco26vx_cM5DA4Z8RXuHd0JUuurjsIcWidlPwHrsgCjEV3smyJrrDyXQ"),
  },
  {
    id: "c4", brand: "CHURCH'S", name: "Chelsea Boots", color: "Black", category: "shoes",
    seasons: ["autumn", "winter"], tag: "DAILY", wearCount: 21, favorite: true,
    imageUrl: img("AB6AXuBRVCJ9hn8Eslmu9uWxKyNxXRdT6OjGXLBypnVO-inubgx8x4vl0GqBuhCtDnup16JFGHNr5-a38ueEHxKcSrNeRoglO6sVBz-DmhbmhyhUSQFcVFJmII2bLi1zURrN55JEOwZ71gckkIsE_IdkvOru7jmeQ2sXh2LidUL4BThaLGQpXFdgG43ZUCrXtDEo74tM8oc9xlO3tQ3r3lUNgCZQ93qHI4sUlHPuRfBzq_Y"),
  },
  {
    id: "c5", brand: "MARGARET HOWELL", name: "Band Collar Shirt", color: "White", category: "tops",
    seasons: ["spring", "summer"], tag: "BASIC", wearCount: 18, favorite: false,
    imageUrl: img("AB6AXuArNf-oC45NGFxQGC9uSS6CqUWCh1GLJoVTH_NrRTinl9XDFEzlLEt_OQshLiKwF4B16eyQZ9K5aG6hQbe5zCABaUzTN70mAoW5sA6_gUl5WXr_H80emRlAQcb3DJNNcuTw_BNjAxKWFu6qTEz5qsOMtV51lyfwbRYd1S0BPz3uyZUhgnul_5X4kvrxkJzBTqiwrAOSb64VKhC43TkFZhnSdjac2DmfPvolkaVT5gs"),
  },
  {
    id: "c6", brand: "A.P.C.", name: "Denim Jacket", color: "Washed Indigo", category: "outer",
    seasons: ["spring"], tag: "SPRING", wearCount: 6, favorite: false,
    imageUrl: img("AB6AXuBOY3nKtl63y8ffyWxqaqcEAyocvb0ndUIwBIjedlq3FjXua-2eFIrVoEPGuqZvBbYgbVOnARtuI_rBvTe-Af8-YFubaha0ve9QlYq2hSXE-PrDVN4Y_VKTGLYs8c4jGbKaJ5o17pHU8Zl909LzuVkJ-pF4rChWpkG1edCSo06bwtRK4mFWdWCMB4FMWeg2n8AHMxop_vTf8wRzylgSzP-cJTePjWZrcsLVn0K98yQ"),
  },
];

export const closetTotal = 84;

export const categoryFilters: { key: "all" | Category; label: string; count: number }[] = [
  { key: "all", label: "すべて", count: 84 },
  { key: "tops", label: "トップス", count: 28 },
  { key: "bottoms", label: "ボトムス", count: 18 },
  { key: "outer", label: "アウター", count: 12 },
  { key: "shoes", label: "シューズ", count: 14 },
  { key: "accessories", label: "アクセサリー", count: 12 },
];

export const sortOptions = ["最近追加順", "着用頻度順", "シーズン: ALL", "カラー"];
