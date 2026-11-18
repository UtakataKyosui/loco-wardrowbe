# Stitch "Closet Coordinator App" (6831858495193214495) design tokens

Source: tailwind config embedded in the Stitch HTML (Tailwind CDN, `darkMode: "class"`). Brand wordmark "KINFOLK" (Bodoni Moda) with a small uppercase sub-label per screen (Closet / Builder / Setups / Calendar).
Screens read: closet-light, closet-dark, item-light, builder-light, lookbook-light, calendar-dark. NOT read: item-dark, builder-dark, lookbook-dark (same dark palette as closet-dark/calendar-dark is assumed; layout mirrors the light counterpart).

## Fonts
- Light: headings/display `Bodoni Moda` (serif, 400-500); body/labels `Geist` (300-600).
- Dark: headings `Bodoni Moda`; body/labels `Hanken Grotesk` (300-600/700).
- Icons: Material Symbols Outlined (variable; filled via `font-variation-settings: 'FILL' 1`), sizes 13-22px.
- Type scale light: display-lg 36/44 -0.02em; display-sm 28/36; headline-lg 24/32 w500; headline-md 20/28 w500; body-lg 16/24; body-md 14/20; label-lg 13/18 .02em w500; label-md 11/16 .08em w600; label-sm 10/14 .1em w600 (uppercase, tracking-widest used a lot).
- Type scale dark: headline-xl 48/56; headline-xl-mobile 34/42; headline-lg 36/44; headline-lg-mobile 28/36; headline-md 24/32 w400; title-lg 20/28 w500; title-md 16/24 w500; body-lg 16/26; body-md 14/22 .01em; body-sm 12/18; label-lg 13/18 .08em w600; label-md 11/16 .12em w600; label-sm 10/14 .14em w500.

## Radii
- Light: DEFAULT .25rem, lg .5rem, xl .75rem, full 9999px (cards rounded-xl/2xl, pills/FAB/nav rounded-full, bottom nav rounded-[28px]).
- Dark: DEFAULT .125rem, lg .25rem, xl .5rem, **full = .75rem** (not a true pill!). Dark uses `border border-surface-container-highest` hairlines on cards and heavier shadows instead of flat tonal fills.

## Spacing
- Light: space-xs .25rem, space-sm .5rem, space-md 1rem, space-lg 1.5rem, space-xl 2.25rem, margin 1.25rem, gutter 1rem.
- Dark: space-xs .25, space-sm .5, space-md 1, space-lg 1.5, space-xl 2.5, space-2xl 4rem, margin 1rem, gutter 1.25rem, margin-tablet 2rem, margin-desktop 3.5rem, gutter-desktop 2rem.

## Light palette (Material 3 roles)
primary #000000, on-primary #ffffff, primary-container #1c1b1b, on-primary-container #858383, primary-fixed #e5e2e1, primary-fixed-dim #c8c6c5, on-primary-fixed #1c1b1b, on-primary-fixed-variant #474746, inverse-primary #c8c6c5, surface-tint #5f5e5e
secondary (terracotta accent) #944929, on-secondary #ffffff, secondary-container #fe9e77, on-secondary-container #773315, secondary-fixed #ffdbce, secondary-fixed-dim #ffb599, on-secondary-fixed #370e00, on-secondary-fixed-variant #763214
tertiary #000000, on-tertiary #ffffff, tertiary-container #191c1a, on-tertiary-container #818581, tertiary-fixed #e0e3df, tertiary-fixed-dim #c4c7c3, on-tertiary-fixed #191c1a, on-tertiary-fixed-variant #444844
error #ba1a1a, on-error #ffffff, error-container #ffdad6, on-error-container #93000a
background/surface/surface-bright #f9f9f8, on-background/on-surface #1a1c1c, surface-dim #dadad9, surface-container-lowest #ffffff, -low #f3f4f3, surface-container #eeeeed, -high #e8e8e7, -highest #e2e2e2, surface-variant #e2e2e2, on-surface-variant #444748, outline #747878, outline-variant #c4c7c7, inverse-surface #2f3130, inverse-on-surface #f1f1f0

## Dark palette (warm sand accent)
primary #e2c0a3, on-primary #412c17, primary-container #bfa084, on-primary-container #4d3721, primary-fixed #ffdcbe, primary-fixed-dim #e2c0a3, on-primary-fixed #291805, on-primary-fixed-variant #59422c, inverse-primary #735a41, surface-tint #e2c0a3
secondary #d0c4bb, on-secondary #362f29, secondary-container #504841, on-secondary-container #c2b6ad, secondary-fixed #ede0d7, secondary-fixed-dim #d0c4bb, on-secondary-fixed #201a15, on-secondary-fixed-variant #4d453f
tertiary #cec5bd, on-tertiary #34302a, tertiary-container #aca49d, on-tertiary-container #3f3a35, tertiary-fixed #eae1d9, tertiary-fixed-dim #cec5bd, on-tertiary-fixed #1f1b16, on-tertiary-fixed-variant #4b4640
error #ffb4ab, on-error #690005, error-container #93000a, on-error-container #ffdad6
background/surface/surface-dim #131313, on-background/on-surface #e5e2e1, surface-bright #393939, surface-container-lowest #0e0e0e, -low #1c1b1b, surface-container #201f1f, -high #2a2a2a, -highest #353535, surface-variant #353535, on-surface-variant #d2c4ba, outline #9b8e85, outline-variant #4e453d, inverse-surface #e5e2e1, inverse-on-surface #313030

Note: accent swaps role between modes. Light: black primary + terracotta `secondary` for accents (dots, wear-count, favorite). Dark: sand `primary` is the accent (active chip, nav dot, FAB, favorite).

## Shared shell (all screens, mobile 780px-wide exports, `shell-type=mobile_tab`)
- Fixed top app bar h-16, bg-surface/80-85 + backdrop-blur: logo img + "KINFOLK" (headline-md) over uppercase sub-label; right: `tune` icon button (44px) + 32px round profile avatar.
- Floating bottom nav pill (max-w-md, h-16, rounded-[28px], blurred bg, 4 items w-16 h-12, label text-[9px] uppercase tracking-wider, active = text-primary font-semibold + 4px dot below):
  1. `checkroom` クローゼット (data-path closet)
  2. `styler` セットアップ (setups)
  3. `auto_fix_high` コーデ作成 (builder; icon sits in a 32px filled primary circle)
  4. `calendar_today` カレンダー (calendar)
- main: pt-16 pb-28 px-margin. Material "chip" patterns: active chip bg-primary text-on-primary h-8 rounded-full; inactive bg-surface-container-low.

## Per-screen outlines
**closet-light / closet-dark (クローゼット)** — Search input "ブランド・アイテム・素材を検索..." + count pill "84 アイテム"; category chips: すべて84 / トップス28 / ボトムス18 / アウター12 / シューズ14 / アクセサリー12; sort row: 最近追加順(expand_more) / 着用頻度順 / シーズン: ALL(tune) / カラー; 2-col grid of item cards (aspect 4/5 image on tinted well, favorite heart top-right, season/occasion badge bottom-left e.g. A/W, ALL, DINNER, DAILY, BASIC, SPRING; brand uppercase, name, color, "N回着用" chip); footer note "アーカイブ同期完了・今季84点登録中"; FAB "アイテム追加" (add_a_photo). Active nav: クローゼット. closet-dark uses same content (6 cards).
**closet-dark width 1024**: the export frame is 1024 wide, but the HTML is identical in structure to the mobile one (same `shell-type=mobile_tab`, fixed `max-w-md` bottom nav, `grid-cols-2`, no md:/lg: breakpoints, dark config only adds margin-tablet/desktop tokens that are unused). So it is NOT a distinct tablet/desktop layout; it is the mobile layout rendered on a wider canvas (page height 5580 suggests a longer scroll). Confirm visually from the PNG if needed.
**item-light (アイテム詳細 登録・編集)** — Sub-bar: back "クローゼット", share, favorite. Image well (4/5) with badge "背景透過・補正済", camera/zoom buttons, "1 / 3" pill, thumbnails + 追加 slot. Heading: "Capsule Staple" / "ARCHIVE ID: #AT-0924", "ATON TOKYO" + 変更(edit), "OVERSIZED CASHMERE KNIT", attribute pills (Charcoal Melange, Size 02 (M), トップス / ニット, カシミヤ 100%). 着用パフォーマンス card (3 stats: 総着用回数 14回 / 着用単価(CPW) ¥3,535 (定価 ¥49,500) / 活用効率 82% ring). アイテム仕様 & 保管状態 form rows: カテゴリー, カラー表記, サイズ区分, 素材構成 & ケアガイド (石油系ドライ / 低温・当て布 / 水洗い不可), 購入時期 2024 Autumn, 購入金額 ¥49,500(税込), toggle 現在クリーニング預け中, 着用推奨シーズン 春/夏/秋/冬 segmented. 「このアイテムを使ったルック (3)」 horizontal cards (LOOK #01, #04) + CTA card 「この服でコーデを作る」. Primary button 変更内容を保存する; links アイテム情報を複製 / 手放す・アーカイブ (error color). Toast. Nav: none active.
**builder-light (コーデビルダー)** — Title "コーデを組み立てる" + "Vol. 14 / Spring Archival"; buttons クリア / 保存する(bookmark_add). Context chips: 天候: 晴れ / くもり (16℃), シーン: 休日・カフェ, スマート絞り込み. Canvas (dotted bg): AI banner "Match 96% モノトーン × エクリュ"; Zone 01 Tops & Outer (レイヤード, prev/next chevrons), Zone 02 Bottoms (2タックワイド), 2-col Footwear / Acc & Bag with swap_horiz. Drawer "クローゼットから選ぶ / タップして差替え": tabs トップス(14) ボトムス(8) アウター(6) シューズ(5) 小物・バッグ(11); horizontal item cards (selected = ring-secondary + check) + dashed アイテム追加 card. Active nav: コーデ作成.
**lookbook-light (セットアップ・コーデ保存)** — "Archival Lookbook" / 保存済みコーデ (24); sort chip 着用頻度順; segment SPRING / SUMMER | AUTUMN / WINTER; occasion pills: すべて(24) オフィス・仕事(8) 休日カジュアル(9) デート・外食(5) 旅行・リゾート(2). Vertical list of 4 look cards (No. 01 · Work Capsule, 02 Leisure, 03 Evening, 04 Weather Adaptive) with magazine-collage image grid, 相性度 N% badges, title (Autumn Minimal Urban / Weekend Cafe Walk / Dinner & Gallery / Rainy Day Smart Layer), tags, stacked item thumbnails "アイテム N点", buttons 「このコーデを着る (ログ)」 + 編集, bookmark toggle. Footer "Kinfolk Archive 全24件...". Active nav: セットアップ.
**calendar-dark (着用カレンダー)** — Header "2025年 10月" with prev/今月/next pill; マンスリー・アナリティクス card (donut 74% クローゼット稼働率, 着用コーデ数 22日/31日, 最多着用アイテム カシミヤニット 8回); 着用カレンダー month grid (日月火水木金土, Sunday red, Saturday primary, dots = recorded, today 24 filled; legend 記録済/選択中); selected date "10月24日 (金) TODAY" with weather chip 18℃ / 晴れ, outfit card (thumb, SELECTED LOOK "Autumn Minimal Urban", NOTE) + button 今日のコーデを変更・編集 + share; WARDROBE DIAGNOSIS 「出番が少ないアイテム」 (30日以上未着用) horizontal cards with 再提案 / 手放す buttons. Active nav: カレンダー.
**item-dark, builder-dark, lookbook-dark** — not read; expect the light layouts above in the dark palette.
