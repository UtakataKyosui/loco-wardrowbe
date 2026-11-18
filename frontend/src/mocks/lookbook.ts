export type SeasonKey = "ss" | "aw";

export type OccasionKey = "all" | "office" | "casual" | "date" | "travel";

export type LookbookOccasion = { key: OccasionKey; label: string; count: number };

export type LookbookImage = { src: string; alt: string };

/** How the collage canvas of a card is laid out. */
export type CollageLayout = "spread" | "pair" | "hero" | "split";

export type LookbookBadge =
  | { kind: "favorite"; label: string }
  | { kind: "score"; label: string }
  | { kind: "icon"; icon: string; label: string };

export type LookbookEntry = {
  id: string;
  no: string; // "No. 01 · Work Capsule"
  occasion: Exclude<OccasionKey, "all">;
  /** Seasons the look suits (used by the season filter). */
  seasons: SeasonKey[];
  layout: CollageLayout;
  collage: LookbookImage[];
  /** Overlay caption on the primary image (spread layout). */
  primaryCaption?: string;
  /** Count chip on the last image (spread layout). */
  countChip?: string;
  /** Title overlay (hero layout). */
  overlay?: { eyebrow: string; title: string };
  badge: LookbookBadge;
  /** Footer line of the collage canvas. */
  footLeft: { text: string; dot?: boolean };
  footRight: { text: string; accent?: boolean };
  style: string; // "Formal & Tailored"
  title: string;
  subtitle: string;
  tags: { label: string; kind?: "plain" | "history" | "accent" | "muted" }[];
  items: LookbookImage[];
  saved: boolean;
};

export const LOOKBOOK_OCCASIONS: LookbookOccasion[] = [
  { key: "all", label: "すべて", count: 24 },
  { key: "office", label: "オフィス・仕事", count: 8 },
  { key: "casual", label: "休日カジュアル", count: 9 },
  { key: "date", label: "デート・外食", count: 5 },
  { key: "travel", label: "旅行・リゾート", count: 2 },
];

const G = "https://lh3.googleusercontent.com/aida-public/";

export const LOOKBOOK_ENTRIES: LookbookEntry[] = [
  {
    id: "look-01",
    no: "No. 01 · Work Capsule",
    occasion: "office",
    seasons: ["aw"],
    layout: "spread",
    collage: [
      {
        src: `${G}AB6AXuCOE7TLM7sUxmBKAYipv7qo7OHY1gcq9qhvUvKJ9HvEn4OZg2guBt40Lx9oYBR3DwNtGamKh8eyVLtpzvS4fiHKQXZ809LVSdWJ24khsWoUHqFiChOKTeKDiioUOwoTUr0Z9jxiSxnEpkDgZ3NMYtGILUVBwdqgSL8ewxrdZkHomxfV5EPZReoUXuACfbvwL4TgmZ3ELzZZBmhQxP5_VA83zPFjYdhmu4nAobGydr4`,
        alt: "ネイビーのウールブレザーとエクリュのメリノニットのフラットレイ",
      },
      {
        src: `${G}AB6AXuDmBOS9_z1wyEriUpV8cTVyyCgKJFEr6ZWF8xQDvBang8ffT6-4ZFtBXbdo_j8cBxFTAeISSNMMdZNLsoLCutdN3OxgbiwRGwShFRM9gxC0Ffo6DFHV90i_D051-Dt5Ct4tTL5ChqwC10n_7H8cjz1ibtCMtlCp_mEcdu25abvyJWIkwfgQFSYHbq_LnFrYa6P4xOEPA1CpwB0xu1JICkRYyThPTU2CvhG0LO5e7a8`,
        alt: "チャコールグレーのプリーツワイドパンツ",
      },
      {
        src: `${G}AB6AXuD0DvWsdByJy8Cp2_LVAQyuBOevmmB_ii_dMeVc-5Qy32sfuX2uPzhL_hjcH67b0FX1ikU7CvDNUOJjmTl9xjShB3TqbTP9G0Mlqc7XYCFN2i97h84ADyeD7492krq_4M4cVTEf-MbwnaT3vSdANmthLWxJXFpacBHXkynuP50HW53LbzPSuzF0QnG1H26Ucs48nHH-V-7_Jvns8FVygfCdYJc-h8J6ezi0Q8iLGeg`,
        alt: "エスプレッソ色のレザーチェルシーブーツ",
      },
    ],
    primaryCaption: "Primary Layer",
    countChip: "4点構成",
    badge: { kind: "favorite", label: "お気に入り" },
    footLeft: { text: "カラーバランス調和", dot: true },
    footRight: { text: "相性度 98%", accent: true },
    style: "Formal & Tailored",
    title: "Autumn Minimal Urban",
    subtitle: "秋のミニマル通勤スタイル · 寒暖差対応",
    tags: [
      { label: "オフィス" },
      { label: "きれいめ" },
      { label: "3回着用", kind: "history" },
      { label: "定番入り", kind: "accent" },
    ],
    items: [
      {
        src: `${G}AB6AXuBSRwHD4iMsyg4RwSA_MlsyRrTIQCXdQbHPenmcQUmPF9ZOIVrIpu9-vr-jDR0jVqLNFE5Ssv5WSmNWLlipIlWmsPJlUf7Y8El6_ihSUBO1hSxTyIfA_vMPEDrZwel8pvtQa6R8tm32ipBenCIcvSap88CtXH7ozPTowVWgekHsE7AQZ2Q3kJ5XLkTo_Ze17sH0n8QlTvWMF3mz5pJnIDmYalggTt-dEqzwOyS32tI`,
        alt: "ネイビーのテーラードブレザー",
      },
      {
        src: `${G}AB6AXuDUKr4KhO6qmCqQqweFwqunNZ5e9mFUI9UpvhIGMAF4GRgb_qOKfpwsp8npM2Y1Mx0TGdLqhvQmQm5a7Oz_HLgwZKNrE05T4fyY-jiTbvgawvzvuNvlh4slCMIueNSS0OvkvV4Bnt8n_9uf-O7JZdfp86CQKyUYwLasMculHBEkU5E0UZS9vD7TXnDzXLShW38I0n3rXNu7kAsylNc-EIF3e6tn2Huobu9Y64mNtNQ`,
        alt: "ベージュのリブタートルネック",
      },
      {
        src: `${G}AB6AXuDAZu9zSkQjGh8cqdqrz537FLgPRu4anS95Myx_9wlBZm95tmjcRlNhv3ZvgHdMdXWmGxj5xFdHXYQLt8N6PQXoUrJF7qDBCUM9cHHfJ_sjFsJwiJPcV54sHSTRk0qj9nua2-MMBHwgymIVkIjFiaYlOzvtA4FARuG_tMgWoTKE6GuCtyrM7umUZTL9tcK4djz5TFVZ-v2J_mwuCw3coTFtAT_GVSVC2YqmlhCnHk0`,
        alt: "チャコールのワイドパンツ",
      },
      {
        src: `${G}AB6AXuCthEwjyily8G3rIy8ZCMoaiiZjXYkbBawZ7H9x0mxR97nWo5yFcQGYuAin8MafS1LqHyDnLJWrClYWuRslF2Lr3q9wa8ki2x6zsPMy9hGqWWSnpENFzUxbBYJMoRJphthoAXmjlpcG5IrTj5iU90OanQUaW_mzxxVaHOyxnV8AiZGdMefUZP4bJwcyoSyslDUhG1Ap-oRRZ81u9bqUo1FmrJpAM3MpVetCBJrQjBM`,
        alt: "レザーのチェルシーブーツ",
      },
    ],
    saved: false,
  },
  {
    id: "look-02",
    no: "No. 02 · Leisure",
    occasion: "casual",
    seasons: ["ss", "aw"],
    layout: "pair",
    collage: [
      {
        src: `${G}AB6AXuAGQUdNKsAkFTH-M6FO_J1Vwp3mkPQIj6rtPKFsRCmnDzTGs4WQveNPSu05pXD_5Hf-5hrwagfCTYf7KoYkrBKXmGoxK8kvJXOtjdyNLfQVgTPX4qbQ1n9Hl2i-6O_gUV5xFsF97vVIbyLilbAaA61MhVhkONUqfiH40ar5MF7gUKU_sNCHLBi23nmil-cYUBvCCk5lejJQxdOf2QOadXB7ZHLLYFEWGsTJB7E0c9U`,
        alt: "白いポプリンシャツとインディゴのデニムジャケット",
      },
      {
        src: `${G}AB6AXuDmDnZ84J98FmBDVZtekwJBcxDnn8nkflFPTwUD2uuQn_AxvlPNc52ZfwZv_GSuuLpCz4qgUgwD65htfD5foqse44KIz-VlAp43UZwW6Um6uRjGw_wnq__00JCdx4CKV8TtJ9p6Ol780ISs33YB6qApS6QJrNtO-PvfqOpyBo9h3vz7Ek_ffFV9Xo7fcCWUmVb3hMFjAQOwzCg4EAjKsrtfRbvl2rKbro2juFrCw-U`,
        alt: "ベージュのバミューダショーツとキャンバストート",
      },
    ],
    badge: { kind: "score", label: "相性度 95%" },
    footLeft: { text: "想定気温: 18°C ~ 23°C (爽やか)" },
    footRight: { text: "最終着用: 10日前" },
    style: "Off-Duty Casual",
    title: "Weekend Cafe Walk",
    subtitle: "休日カフェテラス · リラックス＆端正",
    tags: [
      { label: "カジュアル" },
      { label: "休日" },
      { label: "春/秋" },
      { label: "5回着用", kind: "muted" },
    ],
    items: [
      {
        src: `${G}AB6AXuCzn_QFFA-9Yvh1ZaO6ie2bbVEPB0uHS7tg6R1bRAF3eMPbYixPYtpr3pslgrfJqYHhF8j5xcYqDTwpPrtoMxkbK25H3g_1-X9E1dzMEd6Ofh9zbbfwUdINGBga42_hGHY_g-iffwKFolqN-8iIDwTcWcXjFcjsEKD-o0tYXN4abqfzdWTN9d3fs2VOQ5U9GoZOFudh1cHO7p38ZZOQMXBMArVFDa2iXI0mMqS-KW8`,
        alt: "白いポプリンシャツ",
      },
      {
        src: `${G}AB6AXuD-A3SK5SBdYu89M_kPzHtEQXUYPWv9KLYApnJ7KgTe7rcJ4LN4bfn9TwZqv2O_JAYe_lygc0CMUIckoykB8pUoZxeuELu4uybHuoDr5wIP1LgOak66IE4YzQWN35hnE8ECYWMvlSWznTHT5mYvtlgEDz9d51cZ5V-I_6twht5K6Ggsp1M7gLN3fwIvV9epo3rzK_lu6_Ecg55MVS3OMD7k9HKeAWNuvCw5souH3JU`,
        alt: "インディゴのデニムジャケット",
      },
      {
        src: `${G}AB6AXuCyiKdMgOrbg00NCe3RVmzoH6EdZZ2baT_LUvGmRhQ-NjhWbYQXharCsaLmQEyIBlTUFaBC7Eml0Prtdqh_vs-Qnr2xn1Ha_v3myy5UG6G-ctUCtDBwdoYAkd4FT6A4T9rylL_GoRRA4dg2OlOqGCmDJ70nlIMg3CQN5Cg6mvZZuwlMDXNf4uq0zv86PiWAzwf7oRVTSyUzESFXDEJaeO811MxjG0rST4rlm7UUfFA`,
        alt: "カーキのトラウザーショーツ",
      },
      {
        src: `${G}AB6AXuBbuimegFXQczVPl_S_feKIVE5K_1NREf4dxZlBOAXMcydKOatb0a9dxZD51Gt0TfaKwXyRuAVlR3g444YFfMRSttOaSUTMtw7J5xSl7RcSrxm5CZAEtnEgdjagkcPzHd0Kip6JCUo_zy-EaylJ9hqOVXj3AVzrFrjQgT8uwUFFL1jJh1FFaVIMRvgQ490QslD3erfdgDvGLiSkVoh3IX5wWRuuS0-AsHn5HnGMDto`,
        alt: "ナチュラルのキャンバストート",
      },
    ],
    saved: false,
  },
  {
    id: "look-03",
    no: "No. 03 · Evening",
    occasion: "date",
    seasons: ["aw"],
    layout: "hero",
    collage: [
      {
        src: `${G}AB6AXuB9zFx5n8Slr2TVhqeY2rsXQHfKt67L1nfAvYevnpPMgU0MZDpq8DQ3Bq10Z_Fu6mSZGwkObNq0rNQ190NBUb90v_CfkkK7WwLAsjPMWgNQwZRi9HeisvW5Pc5vQ4IQv8wYdI-lF3jC-gV6jsXVWtMfV5avPXCJz-nqTUGVQDT7Z4gfovkz22_NI8RWF5otgtWGq5TzahjNhvrhdV6JdFZgTJx9jlHyEiD85okbBss`,
        alt: "シャンパン色のシルクスリップドレスと黒のウールブレザー",
      },
    ],
    overlay: { eyebrow: "Evening Statement", title: "Silk & Sharp Wool" },
    badge: { kind: "score", label: "相性度 99%" },
    footLeft: { text: "オケージョン: レストラン / アートフェア" },
    footRight: { text: "★ スペシャル", accent: true },
    style: "Sensual Modern",
    title: "Dinner & Gallery",
    subtitle: "ディナー＆展示会 · 上質な光沢と構築的フォルム",
    tags: [
      { label: "フォーマル" },
      { label: "ディナー" },
      { label: "特別枠", kind: "accent" },
      { label: "1回着用", kind: "muted" },
    ],
    items: [
      {
        src: `${G}AB6AXuCHsvUnKgHxcM-_i-WXGpcXDmNYgOfBSBDAdTK4dipu8zrdELEo6lf42ERr-bEmv89yt5at_2tVBsbG3poUq1usJKl3WKQMHGbJzsvoKxM487LPKFEZsIrBU4bev_la1wNrrGm9p3Ps_7Z-yPI7n0E_1NLJ6QzmF_TWZTF0FSFkm_7Ufj7en0EXuthdSWVRQO3FWfHzNAykkh9XSdH4S3PMsd55zgCms1xYkyhpIyk`,
        alt: "シャンパンサテンのシルクドレス",
      },
      {
        src: `${G}AB6AXuDCxzAO1n6_71Ny8Tx-hokDv-58XavWnvY0Wf1iBtmMBOJBhqmvhqt413tlpk-brSelk-Wy7o-T6-req720JjsMWNEqHMv4lYckJGKyyw5L4_6I2OJm1rIRMe3nI2_QChbQPEw2zNJJ8pC7e0SvaEuBebSBGgtEECPHWf1RermfTFMz4_5OwRGdOTxmXE22WVcjWd431VQBBOi14r8wciqeaa_XQcry6PDvGOk69-4`,
        alt: "黒のウールタキシードラペル",
      },
      {
        src: `${G}AB6AXuBpBTOHH91e7Iw9BGZCranHbRY0M8nY__ImVdUrTgMF8WipyWxQzVtnCB09ZcjEP_6JRjBBQC68iX7Q_3IPvZUymMUqkephRmYv3oIudE4qc8mHe_icpCvOUbyq8WdpWyHUCvrGqojCR3tarrqchwQviAAzpx3XMkcEclyl7sbijrmodPGa5znFbTFz0-qJ9tufwYr1n6rAa0Ip1Zy8N8GfzyPB8ZS-NsLvEXcOAuU`,
        alt: "ポインテッドトウのスリングバックヒール",
      },
      {
        src: `${G}AB6AXuALXTZUgKKVXw4hG_JFWhfeSUqW0ljHV1IoBrU5LWVrcxdyiEe06TlyHNsvM0ri-Sa-XBohsYQsYVfiw487t3yRUU-tKYuwurLpCIQjxNeuoqkpBOe93mGaFz8lU5-jiWX9bV7QvjZiTpPHoifBgnEr89O4IuQGNUCnOdSLX5YNDWy-4EtRbmywXRrGfqfmjeTPPBVqo_pPCnonVCDLJf3mteeFhsgHxuyegvRp3Hk`,
        alt: "シルバーのカフブレスレット",
      },
    ],
    saved: true,
  },
  {
    id: "look-04",
    no: "No. 04 · Weather Adaptive",
    occasion: "office",
    seasons: ["ss", "aw"],
    layout: "split",
    collage: [
      {
        src: `${G}AB6AXuA6XDoytGOlzqeQE1fYjsoJaYjnZkSxaMhG44Ougsfk5QIVMn0LJ5-puwFxE1uJ1fvouocKlHSDg7uJ2Szkgr7-obLHg6iJ_hsZvLwjVQ2r3_V1JcsiWZha0Gm3c-GKhKFknDC5xXPSvLWU7pS2ROPxCCEVcBE9zghUroEi7Q0RazeacurlLURN47Gyk2UwLJ6YGSDV-H70juMTubh0DB9Vmb-CEd2xoaZWiJrQyDA`,
        alt: "オリーブのトレンチコートと黒のタートルネック",
      },
      {
        src: `${G}AB6AXuCTnpV3gaBGY-pGcgE3jDbUnuvBhoHFI5cCsV4VpJjHUfWLza8O5HmXx2b1nwn9rfIi79uSz2lN_VXtO2en4ehh72JfTZz9w4K5dPgcptdRCgdsYgCMQikKgrVjNPu5wFJGkv06R2cT46lB7U52aNKrJ9kfZnXqUFsnXijmJ6mBHVG4hXCgRTFU72gkL8LzmD0C1hC1GLUSyVdjL05kH7GSLOZhPevTDMW7TRLwx8`,
        alt: "撥水テーパードパンツとレインローファー",
      },
    ],
    badge: { kind: "icon", icon: "water_drop", label: "撥水機能 92%" },
    footLeft: { text: "天候適性: 雨天 · 風防 · 撥水加工" },
    footRight: { text: "相性度 94%" },
    style: "Functional Minimal",
    title: "Rainy Day Smart Layer",
    subtitle: "雨の日のレイヤード · 撥水機能とスマートな黒タートル",
    tags: [
      { label: "雨の日" },
      { label: "通勤対応" },
      { label: "撥水テック" },
      { label: "2回着用", kind: "muted" },
    ],
    items: [
      {
        src: `${G}AB6AXuBz39d8X2kj9ZDOmFDOu5iquAPNz0b9C9ccK2EFzJk-o6_fkEF_hMqsx3ZhNMGP0uK_kA2fVEQ3N1KrAnLHE7WcA_5s7Qbn_QEXneO2hTpQHdEhuA72oe9l9EHmYNmQG-5bhMxOrIRmmYe5NTDGCSw2dJRniKP2L1Qneo6bC0onSDXQqg-JsUtcMaDsjTw050fnf6E5L6tbq6MKuseATQFFJmtq8Q1OHudwRkO52H4`,
        alt: "オリーブベージュのトレンチコートの襟",
      },
      {
        src: `${G}AB6AXuDCPdRxCFsiIw-LL7hbw9wGhPRByNh8k3Edkn3kPzaehay7B99PdLP13FhjsHWA6FGKZX3_qsUNYFSy62ttNbSCpKOKKQ1RZtqu81JeZ4i4TVb-lWu0-2XRLq0dQwNz0dzJF2O-177zk9K8jb4tdA5W6jenoeB_bR6lH0AsDXE-zDwRLz90X_vAf8_63D0MO45YiY20iTg3u-nDp5qRTaQ40dGKgPuzRrTyaRycd7E`,
        alt: "黒のメリノタートルネック",
      },
      {
        src: `${G}AB6AXuB3bF2W4KoHUqL6caZ2VJAu4JVi0KWt5WzYler20NypJ7Sf6y_WIxrng37CZhCe2Xclolao6Qv-eXwi7uN04J_bLPJ8c8em0jxTgVBMWiicOumn1E3dvOEOgvFK5ND4B76BUWdeqZ2t1s-0HPP805olOj6qFSWSMUoOe7YKPOsPipcm4VfsSoqQMebJ99LXFmjhgWqrQjaiF9mL2CXRHo0UrQXpPrsDfqZK-Dg-kMU`,
        alt: "テーパードパンツの生地",
      },
    ],
    saved: false,
  },
];
