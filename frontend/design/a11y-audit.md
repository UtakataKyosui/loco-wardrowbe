# WCAG 2.2 AA audit: frontend/src (read-only, nothing modified)

Base: /Users/taikiamo/ghq/github.com/UtakataKyosui/loco-wardrowbe/frontend/src. Paths below are relative to it.
Ratios were computed from theme.css hex values (WCAG relative luminance). Severity: H = blocks or seriously degrades AT/keyboard use or fails contrast. M = real but workable. L = polish.

## 0. Cross-cutting findings (global)

**G1. No skip link, and the page shell is not consistent (H, 2.4.1 Bypass Blocks).**

- `routes/__root.tsx:50-60` has no skip link.
- AppShell uses `<main>` (AppShell/index.tsx:20), `<header>` (TopBar.tsx:6) and `<nav>` (BottomNav.tsx:10), so landmarks exist there.
- Fix: add `<a class="skip" href="#main">` as the first child of `<body>`. Give `<main id="main" tabIndex={-1}>` to AppShell and AuthCard, and to Home, which has no `<main>` at all (App.tsx:29 renders only a Container).
- Visually hide the link until `:focus`.

**G2. No focus management and no title change on route change (H, 2.4.2 Page Titled, 2.4.3 Focus Order, 4.1.3 Status Messages).**

- `routes/__root.tsx:20` hardcodes `title: "Wardrowbe"`. None of the 10 `routes/*.tsx` files define `head()`.
- Fix: add `head: () => ({ meta: [{ title: "ログイン | Wardrowbe" }] })` per route, for example クローゼット, セットアップ, コーデ作成, カレンダー, アイテム詳細, ログイン, 新規登録, メール確認, マジックリンク.
- Add a `RouteAnnouncer`. In App.tsx, use `useRouterState` on `location.pathname` to focus the page `<h1>` or `<main tabIndex={-1}>` after navigation. Alternatively render a visually hidden `role="status"` element with the new title.
- `router.tsx:11` has `scrollRestoration` but no focus handling.

**G3. Heading structure is broken on every page (H, 1.3.1, 2.4.6).**

| Page       | Problem                                                                                                                                                                                             |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Closet     | No heading at all.                                                                                                                                                                                  |
| Builder    | Pages/Builder.tsx:115 uses `Heading level="2"` as the first heading, so there is no h1.                                                                                                             |
| Lookbook   | h1 at Lookbook.tsx:26 is fine, then h2 per card (LookCard.tsx:133), which is OK.                                                                                                                    |
| Calendar   | h1 is the "2026年 11月" date (MonthHeader.tsx:13, with `aria-live` on a heading, see calendar section). Then h2, h2, h2 (MonthGrid:17, SelectedDay:17, LowRotation:12), and an h3 (SelectedDay:42). |
| ItemDetail | h1 is the brand name (ItemSummary.tsx:21) instead of the item name. Then h2 (ItemSpecs:30, ItemLooks:8).                                                                                            |
| Home       | h1 = "KINFOLK".                                                                                                                                                                                     |
| Auth pages | h1 per page is fine.                                                                                                                                                                                |

- Closet: add a visually hidden `<h1>クローゼット</h1>`. Card titles are h3 (ItemCard.tsx:27), so the h2 level is skipped.
- Builder: change line 115 to h1.
- Calendar: change MonthGrid:17 and the others so each card has a sensible h2.
- ItemDetail: make the item name the h1, with the brand as a `<p>` or span.
- In AppShell, TopBar shows "KINFOLK" as a `<Text>` (a `<p>`) and the subLabel is also a `<p>`, so the page h1 is only in the page. This is fine.

**G4. Contrast token failures (H/M, 1.4.3, 1.4.11). Full table in section 11.**

**G5. Text sizes of 8-11px are used everywhere (M, 1.4.4 Resize Text, 1.4.12 Text Spacing).**

- Examples: nav labels 9px (theme.css:146), `.c--bld-label` and `.c--bld-chip` 9px, `.c--cal-overlay` 9px, `.c--itemThumbAdd` 8px, many inline `fontSize: 9/10`.
- This is not a strict fail on its own, but together with the low-contrast tokens it is fragile. Use rem units and a floor of about 11-12px for content text.

**G6. `prefers-reduced-motion` is handled only in lookbook.css:372 (M, 2.3.3, 2.2.2).**

- Un-guarded motion:
  - theme.css:131 nav blur and transform
  - builder.css:17 and :44 `:active` transform
  - builder.css:147 toast `transition: all .3s`
  - item.css:295 and :304 switch
  - calendar.css:75
  - auth.css:79 and :110
  - lookbook.css:339
- Fix: add a global `@media (prefers-reduced-motion: reduce) { *,*::before,*::after { animation-duration:.01ms!important; transition-duration:.01ms!important; scroll-behavior:auto!important } }` in theme.css.

**G7. Global focus-visible style is missing (H, 2.4.7 Focus Visible, 2.4.11 Focus Not Obscured).**

- The only generic rule is item.css:443, scoped to `.c--item`.
- There is no `:focus-visible` anywhere for any of the following:
  - `.c--navItem`, `.c--iconBtn`, `.c--bld-*`, `.c--cal-*`, `.lb-*`, `.c--chip`, `.c--sortBtn`, `.c--favBtn`, `.c--closetFab`
  - closet search input: closet.css:6 `outline:none` with only a bg/border change at :9 (the border is `--outline-variant`, 1.6:1, so no visible indicator)
  - auth link and plain `<a>`
- Fix: put this in theme.css (unlayered or in the lism-custom layer):

```css
:where(a, button, input, select, textarea, [tabindex]):focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

- In dark, accent is #e2c0a3 on #131313 (10.9:1). In light, accent is #944929 on #f9f9f8 (6.1:1). Both are fine.
- On the primary/accent filled buttons use `outline-color: var(--on-primary)` plus an offset, or a double ring, so the ring does not vanish against a same-colour button background.

**G8. Fixed elements cover content (M, 2.4.11 Focus Not Obscured (Min), 1.4.10 Reflow).**

- BottomNav is fixed: `bottom:12px; height:64px`. The main content padding is `pb="70"`; confirm that value is about 70px or more, as the page can otherwise be covered by the nav.
- Closet FAB (closet.css:29): `fixed; right:20px; bottom:96px` overlays the last card row and has no `max-width: 28rem` alignment. On a wide viewport it sits at the screen edge, outside the 28rem column.
- Builder toast (builder.css:140): `fixed; top:80px`.
- ItemDetail toast (item.css:426): `fixed; bottom:96px; pointer-events:none`.
- Fix: `scroll-padding-bottom: 96px` on html, plus `padding-bottom` on `<main>` of at least nav height + FAB height + margin. Align the FAB to the column. At 400% zoom the TopBar (sticky, 64px) and nav leave little viewport, so verify.

**G9. Language (L).** `<html lang="ja">` is set (`__root.tsx:52`), good. Mixed English UI text on auth pages ("Log in", "Sign up") sits inside lang="ja". Either translate or add `lang="en"` on those subtrees (3.1.1/3.1.2).

**G10. Colour-only state (M, 1.4.1).** See calendar (Sun/Sat colour, worn dot) and the closet favourite button (colour change only on the heart; see the closet section).

## 1. src/App.tsx

- **L28-39 (H, 1.3.1, 2.4.1):** the non-shell branch has no `<main>`. The Home page, and any auth page except AuthCard, have no main landmark. AuthCard has its own `<main>`, but Home does not.
  - Fix: wrap `<Outlet/>` in a `<main id="main">` here, or in Home.
- **L30-36 (M, 4.1.2):** the Logout `<nav>` contains only a button and has no label.
  - Fix: use a `<header>` with a button, or `<nav aria-label="アカウント">`. Also unstyled and English; localise.
- **L13-16 (M, 2.4.3):** navigation after logout has no focus management (G2).
- The shell branch re-mounts the AppShell on route change inside shell paths only if pathname changes; no problem.

## 2. src/routes/__root.tsx (G1, G2)

- L20: static title (H).
- L50-60: add a skip link (H).
- L26-33: Google Fonts stylesheet with `display=swap`. The Material Symbols font needs `display=block` or a `font-display` fallback so the icon ligature names (e.g. "checkroom") are not shown as text. Icons are `aria-hidden`, so AT is safe, but sighted users see raw ligature text before the font loads (L).
- Viewport: `width=device-width, initial-scale=1` with no `maximum-scale`, which is good.

## 3. src/auth/*

**AuthCard.tsx**

- **L11-12 (M, 1.3.1):** `<main>` > `<section>` with no accessible name. Use `<section aria-labelledby="authTitle">` with an id on the h1, or drop the section.
- **L14 (L):** "Kinfolk" brand text is a `<p>`; fine.
- **L41-52 AuthField (H, 3.3.1, 3.3.3, 4.1.2):**
  - There is no `aria-invalid`, no `aria-describedby`, no per-field error, and no hint text. Errors are form-wide (see Login).
  - `required` is set at L48, but there is no visual required indicator and `noValidate` is not set, so browser-native bubbles are used.
  - The `type="email"` field gets the native validation bubble, which is not a consistent accessible message.
  - Fix: add a `required` indicator (asterisk plus a "必須" hint, `aria-hidden` on the asterisk). Accept `error?: string` and `hint?: string` props, render `<p id={id+"-err"}>`, and set `aria-invalid` and `aria-describedby`. Add `autoCapitalize="none" spellCheck={false}` for email.
  - The password field has no show/hide toggle (3.3.8 Accessible Authentication is satisfied because paste and password managers are allowed, as long as you do not block paste; you do not).
- The `id` values "email" and "password" are static, so they would collide if two forms ever render at once. Use `useId`.
- Label is uppercase 11px (auth.css:61-66) at 8.9:1 contrast, fine.

**Login.tsx**

- **L65-69 (M, 4.1.3):** the error `<p role="alert">` is rendered after the `<form>` and is conditionally mounted. `role=alert` works best when the container already exists in the DOM; some screen readers miss alerts injected as the node itself. Keep a persistent empty `<div role="alert">` and fill it.
- Also place the alert before the submit button and link it with `aria-describedby` on the form, and move focus to the first invalid field or the alert on failure (3.3.1).
- **L61-63 (M, 4.1.3):** the pending state only swaps the button text and sets `disabled`. A disabled button loses focus, which can strand keyboard users. Use `aria-disabled` or `aria-busy`, and keep focus.
- **L43 (L):** all text is English inside `lang="ja"` (G9).
- **L71 (L):** footer link relies on underline plus colour; OK (underlined, auth.css:154).
- On successful login `navigate({to:"/"})` goes to Home, which then redirects to /closet; focus is not managed (G2).

**Register.tsx**

- Same error, pending and focus issues as Login (L80-84).
- **L35-47 (M, 4.1.3, 2.4.3):** the success state swaps the whole view without announcing it. The h1 changes to "Check your email". Move focus to the h1 (`tabIndex={-1}`) or put `role="status"` on the text.
- **L68-75:** no password rules or hint (3.3.2 Labels or Instructions). Add a hint with `aria-describedby` (e.g. minimum length).

**MagicLink.tsx / Verify.tsx**

- **MagicLink L42 and Verify L46 (H, 4.1.3):** the "One moment…" and "Verifying…" status text has no `role="status"` or `aria-live`. Fix: `<p role="status">` or `aria-busy` on the card.
- Verify L47-54: the success message is not in a live region either, and neither is MagicLink's error alert (L45), which is conditionally mounted.
- Verify L55-59: the failure state has no recovery link (no "back to login"). Not strictly WCAG, but helpful.

**RequireAuth.tsx**

- L7-9: returns `null` while auth is unknown, which gives a blank page with no status. Render a status message or spinner (`role="status"`). Not currently used in any route (rg found no importer), so this is low.

**auth.css**

- **L92-96 (H, 2.4.7, 1.4.11):** input `:focus-visible { outline:none; border-color: var(--primary); box-shadow: 0 0 0 3px color-mix(primary 20%) }`. The border change (primary vs outline-variant) is a good indicator in light (black), and dark (#e2c0a3) is OK. The 20% ring is not needed for compliance, but the border colour change from #c4c7c7 to #000 gives about 19:1, which passes. Keep it, but also keep a real outline (`outline: 2px solid transparent` for forced-colors / Windows High Contrast). `outline:none` plus box-shadow disappears in forced-colors mode; use `outline: 2px solid transparent`.
- L84-86 (M, 1.4.3): placeholder colour `--outline` is 4.05:1 on `--surface-low` in light (#747878 on #f3f4f3) and 4.24 on base. It fails 4.5:1. No placeholders are used in the auth inputs, so this is currently unused; but closet.css:8 uses on-surface-variant, which is fine.
- L77 input border `--outline-variant` #c4c7c7 on `--surface-low` is about 1.5:1, which fails 1.4.11 (3:1) for input boundaries in light (H/M). The field is bordered only by this colour, so the input boundary is not perceivable by low-vision users. In dark, #4e453d on #1c1b1b is about 1.7:1, which also fails. Fix: use `--outline` for the input border in light (#747878 is about 4.0-4.2:1 on the card, fine) and `--outline` (#9b8e85) in dark (5.4:1 on low).
- L123-126 button focus ring uses `var(--primary)` and the button is `var(--primary)`; in light the ring is black on a black button with a 2px offset, which is acceptable because of the offset gap. OK.
- L128-131: disabled opacity .5, exempt from contrast, but the loading state is invisible. Fine.
- L133-141: alert is `on-error-container` on `error-container`, 7.2:1 in both modes, good. Add an icon and visible prefix so the error is not colour-only (1.4.1): it is text, so fine.

## 4. src/components/AppShell

**TopBar.tsx**

- **L16 (M, 2.5.8 / 2.5.5):** icon button "絞り込み" is 44x44 (`.c--iconBtn`), good, and has `aria-label`, but it does nothing (no handler, no expanded state). If it will open a filter panel, add `aria-expanded` and `aria-controls`; if not, remove it, or `disabled`.
- **L19-30 (H, 1.1.1, 4.1.2):** the profile `Flex` is a `<div>` with `aria-label="プロフィール"` and no role. `aria-label` on a generic div is not announced reliably and is a WAI-ARIA violation (naming prohibited on generic). It is also not interactive. Fix: make it a `<button>` or `<Link>` with an aria-label (and make it 44x44), or use `role="img"` with `aria-label`. If decorative, hide it. The 32x32 size also fails 2.5.8 if it is made interactive: needs a 24px target minimum for AA (2.5.8) and 44px by your own standard.
  - Use `@utakata-ui/react` Avatar inside a Button, or `Avatar.Root` with `Avatar.Fallback`.
- **L6 (M, 1.3.1):** `<header>` inside `<Container>` (not inside body-level) is fine as banner only when it is not nested in sectioning content; it is a direct child of the div, which is a div, so banner role applies. OK.
- **L8-13:** "KINFOLK" and subLabel are English. The `subLabel` "Closet" is not conveyed as a page heading. Not a fail.

**BottomNav.tsx**

- L13: `aria-label="メインナビゲーション"` is good.
- **L25-26 (M, 1.4.1/4.1.2):** `aria-current={active ? "page": undefined}` is correct. TanStack `<Link>` also sets `aria-current` automatically for the active link via `activeProps`, so this is redundant but harmless. Note the `data-active` styling only changes font-weight and colour plus a dot; active-ness is shown by weight/colour only, plus a 4px dot (G: dot is `--accent` on nav bg, 5.6-6.5:1, fine). Make the dot at least 6px and add `font-weight`; fine.
- **L18-37 (M, 2.5.8, 2.5.5):** `.c--navItem` is 64x48, passes 44px.
- **L28-31 (M, 1.4.11):** the FAB icon (`c--navFab`) is a 32px circle in a 48px target. OK. Its label "コーデ作成" is visible.
- **theme.css:146 (M, 1.4.4):** 9px uppercase labels; on 4 items "クローゼット" (6 chars at 9px) is tiny. Increase to at least 11px.
- **L10-17 (M, 2.4.11):** the nav is `position:fixed` at the bottom with a blurred background at 85% alpha, so text underneath may reduce effective contrast (nav labels on a translucent bg). The measured contrast of 8.9:1 (on-surface-variant over `--nav-bg`) assumes opaque; with content scrolling beneath, the worst case drops but stays high. OK.
- **theme.css:155-163:** the active dot is `::after` at `bottom:-4px` and is positioned against the item (`position:relative`), which gets clipped? Not a WCAG issue.
- **L21 (L):** no `focus-visible` style (G7).

**AppShell/index.tsx**

- L12-18 `Container isContainer` with `minHeight:100dvh`, `max-w 28rem`. At 320px and 400% zoom, content reflows; OK (1.4.10) as long as horizontal scrollers are inside their own containers (they are, `overflow-x:auto`).
- L20: `<Group as="main">`: fine, but needs `id="main"` and `tabIndex={-1}` (G1).
- The TopBar is rendered before `<main>`, so the landmark order is banner, main, nav. Fine.

## 5. src/components/MaterialIcon.tsx

- L14: `aria-hidden="true"` is applied by default, so icons are decorative. Good. The risk is callers that place a MaterialIcon inside an icon-only control without a label. All current icon-only buttons do have `aria-label`, except the issues noted per file.
- **L19 (M, 1.1.1, 1.4.5):** the glyph name text (e.g. "chevron_left") is in the DOM; with `aria-hidden` it is not read, but with the font blocked, or in user stylesheets/forced fonts, the raw text appears. Add `translate="no"`, which prevents machine translation from mangling the ligature names, and `font-display: block`.
- Add an optional `label` prop: when given, set `role="img" aria-label` and drop `aria-hidden`.

## 6. src/pages/Closet.tsx and components/closet/*

**Closet.tsx**

- **L45-52, L54-62 (M, 4.1.2, 1.3.1):** category chips and sort buttons are `aria-pressed` toggle buttons in `role="group"`.
  - Categories are mutually exclusive, so this is a single-select. Toggle buttons are semantically OK but do not communicate exclusivity. Prefer a RadioGroup or ToggleGroup (single) or Tabs if it filters a panel.
  - Sort buttons: also single choice. Use a `<select>`/NativeSelect or RadioGroup. The icons `expand_more` (i===0) and `tune` (i===2) are arbitrary decoration: i===0 implies a dropdown that is not there. Remove.
  - Neither group announces the result count change. Add a live region: `<p role="status" aria-live="polite" class="sr-only">{items.length}件</p>`. (4.1.3)
- **L29-43 (M, 3.3.2, 1.3.1):** search has `aria-label` and placeholder; fine. It is not inside a `role="search"`/`<form role="search">`. Add `role="search"` on the wrapper. Also `type="search"` with `autoComplete="off"`; add `enterKeyHint="search"`.
- **L40-42:** `<div class="c--closetCount"><b>…</b>アイテム</div>`: `<b>` for number is fine. Visual 10px.
- **L64-68 (M, 1.3.1):** items are in a `Grid` of `<article>`s, with no list semantics. Use `<ul>/<li>`, so AT announces "list, N items". Empty state when `items.length===0` is missing (no feedback when search matches nothing).
- **L70-73:** decorative dot span, fine, but the status text "アーカイブ同期完了" is not live.
- **L75-78 (H, 2.4.11, 1.4.10, 2.5.8):** `.c--closetFab` has no `onClick` (does nothing) and is `position:fixed` at `bottom:96px; right:20px`; it covers the last grid row's content and, on wide viewports, floats outside the 28rem column. Height 48px is fine. Contrast `--on-primary` on `--primary`: light 21:1, dark 7.7:1, fine. Add focus-visible (G7).
- **L47:** the chip contains `<small>` count; the accessible name is "すべて 24"; fine, but consider `aria-label` with "24件".

**ItemCard.tsx**

- **L9 (M):** `<article>` has no link to the detail page. The card is not clickable or focusable, so keyboard users cannot reach the ItemDetail route (`/closet/$itemId`) from the closet at all. This is a functional a11y gap (2.1.1). Fix: wrap the title in `<Link to="/closet/$itemId">` and give the card a stretched link, with the favourite button positioned above (`z-index`).
- **L11 (M, 1.1.1):** alt is `${item.brand} ${item.name}`, fine; the heading also repeats the same text, so the image is redundant, and since image and heading are adjacent, use `alt=""` if the card has a text title. Minor.
- **L12-20 (H, 2.5.8, 2.5.5):** favourite button `.c--favBtn` is 28x28 (closet.css:23) which is below 44px (your standard) but meets the 24px minimum of 2.5.8. Increase to 44px (use a 28px visual with a pseudo-element hit area).
  - It has `aria-pressed` and `aria-label="${name}をお気に入り"` which is fine; the name stays constant when pressed, which is correct for a toggle.
  - Unpressed colour is `--outline-variant` on `--surface-lowest`: 1.70:1 light, 2.06:1 dark. Fails 1.4.11 (3:1) for the icon (H). Fix: use `--outline` (4.47:1 light, 6.07 dark) for the unpressed state. Pressed colour `--accent` is fine; the state is also conveyed by the filled icon (`is-fill`), good.
- **L21 (M):** `.c--itemTag` 10px; fine.
- **L24-29 (L, 1.4.4):** brand and title use `white-space:nowrap; text-overflow:ellipsis` and truncate, so users at larger text sizes lose information (1.4.4 / 1.4.10). Allow wrapping (`line-clamp`) and expose the full text via the title or detail.
- `.c--wear.is-hot` colour `--accent` on `--surface-low`: 5.87 light, 10.07 dark: ok.
- **closet.css:9 (H, 2.4.7):** `.c--closetSearch input` has `outline:none` and only a background change on `:focus` (surface-container vs surface-low) plus a `--outline-variant` border (1.5:1). No sufficient focus indicator. Fix: remove `outline:none`, add `:focus-visible` ring (G7).
- closet.css:12-13: horizontal scroller with hidden scrollbar. Chips are focusable buttons so the keyboard can reach all of them, and the browser scrolls the focused chip into view. This is OK. Add `tabindex=0` is not needed. The hidden scrollbar hurts discoverability for mouse users; fine for mobile.
- closet.css:10: 10px; `.c--closetCount` is fine.
- closet.css:5 height 44px, good.
- closet.css:14 chip height 32px and sort button 28px (L17): fails the 44px goal and passes the 24px AA minimum only (2.5.8). Spacing between chips is 4px, so 2.5.8 spacing exception holds. Raise to 44px hit area (M).

## 7. src/pages/Builder.tsx and components/builder/builder.css

- **L115 (H):** h2 first on the page; make it h1 (G3).
- **L141-149 (H, 4.1.2):** `builderFilters` buttons (`c--bld-pill`) have no `onClick`, no `aria-pressed`, and `f.active` is shown only via background. They look like toggle chips but do nothing. Either implement them as ToggleGroup items with `aria-pressed`, or remove. `chevron` ones imply a dropdown; add `aria-haspopup`/`aria-expanded` when implemented.
- **L198-211 (H, 4.1.2, 2.1.1):** `role="tablist"` + `role="tab"` + `aria-selected` is declared, but:
  - there is no `role="tabpanel"`, no `aria-controls`, no `id`s, and no roving tabindex (`tabIndex={-1}` for unselected) or arrow-key handling (the tab pattern requires Left/Right/Home/End).
  - There is no `aria-label` on the tablist.
  - Fix: use `Tabs` from `@utakata-ui/react` (Tabs.Root/List/Tab/Panel), which gives roving focus and arrow keys, wrapping the drawer items in `Tabs.Panel`. Do not use `role=tab` on plain buttons otherwise.
  - Tab label shows "(count)". Counts include "outer" (`drawerSlot===null`) with a "no items yet" message that is not announced.
- **L212-259 (M, 4.1.2):** drawer item buttons (`c--bld-wcard`): selected state is only an outline plus the "選択中" text. Convert to `aria-pressed={on}` (or radio semantics, since one per slot). The `<img alt={it.name}>` plus a visible `shortName` text duplicates the name (the accessible name is "{name} {shortName} {color}"); use `alt=""` for the thumbnail since the text names the item.
  - Selected check badge (L228-232) is decorative; fine.
  - `.c--bld-wcard.is-selected { outline: 2px solid var(--accent) }` (builder.css:128): this is the selected outline, which will collide with the focus outline (a focus ring is not defined here, G7).
  - Horizontal scroller (`.c--bld-scroll`): keyboard reachable because items are buttons; OK. The last "アイテム追加" has no handler.
- **L56, L82, L95, L171 (M, 2.5.8, 2.5.5):** carousel arrows and swap buttons are `.c--bld-round` 32x32 (`is-sm` 24x24, and line 171 overrides to 28x28), below 44px. 24px meets only the 2.5.8 minimum with no spacing exception margin. Raise to at least 44px hit area.
  - Their `aria-label`s are good ("前のトップス" etc.).
  - **Missing: the carousel result is not announced.** When cycling, the item changes but nothing announces the new item; add `aria-live="polite"` to the card's text region or call `notify`. Currently only the cycle's toast is not shown for `cycle`. Fix: put `aria-live="polite" aria-atomic="true"` on the item name block (4.1.3).
  - Wrapping `div.c--bld-card` with no role; make them `<section aria-label="トップス">` or a `role="group"` with `aria-roledescription="carousel"`; use the `Carousel` component only if it fits.
- **L60-62, L99-101 (M, 1.1.1):** `<img alt={item.name}>` next to a text title duplicates the name; use `alt=""` (L61, L100, L227).
- **L154:** badge uses `--on-accent-container` on `--accent-soft`: 7.17:1 in light but **1.19:1 in dark** (#4d3721 on #59422c) (H, 1.4.3/1.4.11). The icon is decorative (aria-hidden) but the visual contrast failure applies to non-text icon (1.4.11) only when the icon conveys information; it is decorative, so L. More important are the text uses in G4/section 11.
- **L46 and L48 chips (builder.css:72):** `.c--bld-chip.is-accent` `on-accent-container` on `accent-soft` is **1.19:1 in dark** for "レイヤード" text (H, 1.4.3). Fix the token (section 11).
- **L64, L159 (M, 1.4.3):** label text colour `var(--accent)` on `--surface-lowest` (c--bld-card): 6.47 light, 11.3 dark; fine. The font size is 9px (G5).
- **L65-70 and L237:** `c="accent"`/`c="text-2"` Lism colour keys; `text-2` = on-surface-variant: fine.
- **L262-265 toast (M, 4.1.3, 2.2.1):**
  - `role="status" aria-live="polite"` is on a persistent container (good, since the node is always mounted).
  - The node is always rendered, and is hidden using `opacity:0; pointer-events:none` only. It is **not** `display:none`/`aria-hidden`/`visibility:hidden`, so it stays in the accessibility tree, and the verified icon `<MaterialIcon aria-hidden>` is fine, but the empty span means no issue. OK for SR, but while hidden it will be read in browse mode as an empty status; minor (L).
  - **Auto-dismiss at 2200ms (M, 2.2.1 Timing Adjustable)**: the toast carries information (saved/reset). Four seconds minimum is recommended and it cannot be paused. Since the toast is informational with no actions, it passes if the content is also available otherwise, but "保存しました" has no persistent record. Increase to 5-6s and pause on hover/focus, or use `Toast` which supports timeout and a close button.
  - **builder.css:140-158 (M, 1.4.4/1.4.10):** `white-space:nowrap` with 11px text will overflow on narrow screens/zoomed text; the toast is `position:fixed; top:80px` and overlaps the page; with `left:50%` and no max-width, long messages ("Lookbook #44 にセットアップを保存しました") exceed 320px at 400% zoom. Add `max-width: calc(100vw - 32px); white-space: normal`.
  - **builder.css:147 transition all .3s:** no reduced-motion guard (G6).
- **L123-137 (M, 2.5.8):** "クリア" and "保存する" are 36px high (inline style). Raise to 44px. "クリア" is destructive (resets canvas) with no confirmation; add an undo through the toast or confirmation (3.3.4 applies to legal/financial only; so L).
- **L152-175 (M):** the analysis block `Match 96%` is text, fine. `aria-label="診断の詳細"` 28x28 button (2.5.8 ok, 44px no).
- builder.css:96: `.c--bld-stage::before` dot pattern is decorative with `pointer-events:none`; fine.
- builder.css:98: `.c--bld-analysis` is translucent glass (90% surface-lowest with blur); the text contrast assumes the underlying pattern does not interfere. OK.
- builder.css:20-22 `.c--bld-pill.is-active`/`.is-plain`/`.is-primary` contrast: `on-surface-variant` on `surface-container` is 8.07 light; fine. Dark `is-primary` (on-primary #412c17 on #e2c0a3) 7.7:1, fine.
- builder.css:23-29, 140-158: the pill rows and toast have no focus ring (G7).

## 8. src/pages/Lookbook.tsx and components/lookbook/*

**Lookbook.tsx**

- **L39-48 season segment (H, 4.1.2):** two `aria-pressed` buttons in `role="group"` acting as a two-way segmented control. Replace with `ToggleGroup` (type single) or `RadioGroup`. Currently also does nothing: `scope` state is not used to filter `visible`. Also hidden text "SPRING / SUMMER" is fine.
- **L50-62 occasion pills (M, 4.1.2):** same single-select issue. `aria-pressed` plus a group; fine functionally, but a filter with live-result announce is missing: add `role="status"` count (4.1.3).
- **L33-36:** `lb-sortChip` is a `<span>` styled like a chip with text "着用頻度順" (looks interactive, is not). Either make it a real control or restyle as static text (3.2.4 consistent identification).
- **L26-31 (M, 1.3.1):** "(24)" count is inside the h1; the accessible heading name is "保存済みコーデ (24)". Acceptable.
- **L18-37, L20:** the `lb-label` is a `<span>` with letter-spacing 0.12em uppercase; fine.
- **L64-73:** results are `Stack` > `article`s. Add list semantics (L). Empty state is a `Text` (`<p>`) and not live (M).
- **L77:** `o="60"` (opacity .6) on "Kinfolk Archive", colour text-2 ×0.6 over base: effective contrast is about 3.5:1 in light (8.9 blended at 60% towards the background). Compute: roughly `#444748` at 60% over `#f9f9f8` -> approximately #868887, which is about 3.4:1 (M, 1.4.3, fails for large text under 24px; this is 20px "xl" so also fails unless bold). Decorative footer text, but still text. Fix: remove the opacity, use `--outline` (4.2-4.5).

**LookCard.tsx**

- **L99 (L):** `<article>` per card with `<h2>` title; good (2.4.6). Headings in `Heading level="2"` after an `h1`: ok.
- **L140-154 (M, 4.1.2):** the first card (`look-01`) gets a "その他のオプション" button (`more_horiz`) with no menu or `aria-haspopup`, and other cards get a bookmark toggle labelled "お気に入りに保存" with `aria-pressed`. The label stays constant, which is correct for toggle buttons. The special-casing by `entry.id === "look-01"` is mock logic. Both are 36x36 (lookbook.css:250), below 44px (M, 2.5.5; passes 2.5.8). For `more_horiz` use `DropdownMenu` (`aria-haspopup="menu"`).
- **L166-180 (M):** `lb-items` button: `aria-label="アイテム N点を見る"` overrides the visible text "アイテム N点" (label-in-name 2.5.3: visible text "アイテム 3点" is contained within "アイテム 3点を見る", so it passes, fine). Inner `<img alt={it.alt}>` is irrelevant, because `aria-label` overrides the content. Set `alt=""` for thumbnails inside a labelled button; they are redundant.
- **L183-207 (H, 4.1.3, 4.1.2):** the wear CTA has `aria-live="polite"` **on the button itself**. A live region on a button whose content swaps is unreliable. Also the button is not disabled during busy (a guard in JS only). The accessible name changes from "このコーデを着る (ログ)" to "着用ログ登録中..." to "本日のコーデに設定済", and the busy state has no `aria-busy`. Fix: keep the button's label stable, add a sibling `<span role="status" class="sr-only">{message}</span>`, and set `aria-busy={wear==="busy"}` plus `aria-disabled`.
  - After 2.4s the button resets to "idle", so the "done" confirmation vanishes in 2.4s (M, 2.2.1). Prefer a toast with a longer duration or persistent state.
- **L197:** spinner `<MaterialIcon className="lb-spin">` is aria-hidden; the rotating animation is guarded by reduced motion in lookbook.css:372 (good). Under reduced motion the "refresh" icon is static; the label text still reports the state.
- **L12, L31, L171 (M, 1.1.1):** collage images have `alt` from data, decorative collage duplicates; fine if the data is descriptive. Items thumbnails inside the labelled button are redundant.
- **L33-44 overlay text:** `.lb-overlay` is white (#fff) over `lb-scrim` (rgb 0 0 0 / .4 gradient, 60% fade). Over a light photo the effective contrast can be as low as about 1.5-3:1 near the 40% scrim area; no solid guarantee (M, 1.4.3, 1.4.11). In dark mode the overlay text is `--on-surface` over a .7 scrim (6.6:1 worst case, fine). Fix: raise the light-mode scrim to at least .55 and make the gradient taller, or put the text on a solid chip.
- **L102 `lb-chip lb-label` no**: `{entry.no}`: 10px uppercase chip, `on-surface-variant` over `lb-chip-bg`: about 8:1 light; fine.
- **L61:** favourite badge label is `--primary` text on `lb-chip.is-accent` (colour is accent; the label overrides to `--primary`): fine.
- **L159-163 tags:** `lb-tag.is-accent` in dark is `--primary` on `accent-soft` at 60% over card: 7.2:1, so lookbook handles dark correctly. In light, `on-accent-container` on `accent-soft`: 7.17, fine.
- **`.c--lb .lb-tag.is-history`** etc.: fine.

**lookbook.css**

- L19-24 `.c--lb button { border:0; ... }` **no focus style** and removes nothing else; the default focus ring still shows (browser default), because outline is not removed. OK but low-visibility against the primary-coloured buttons (G7).
- L57-81 segment buttons: height = 16px line + 16px padding = 32px; below 44px (M).
- L94-107 pills: 32px height (M).
- L141 / L250 iconBtn 36px (M).
- L132-148, L271-296: chips and tags are plain spans with `text-transform`; fine. The 10px `lb-label` is small (G5).
- L329 `lb-cta` 48px, good.

## 9. src/pages/Calendar.tsx and components/calendar/*

**MonthHeader.tsx**

- **L13 (H, 4.1.3, 1.3.1):** `aria-live="polite"` is on the **`<h1>`** that contains "2026年 11月". It works as a month-change announcement, but the h1 is also the page title; each month change re-announces the whole heading text (fine), but with no `aria-atomic`, the announcement can be fragmented across the inline `<Inline>` nodes ("2026", "年", "11", "月"). Add `aria-atomic="true"` or move the live region to a separate `sr-only` `role="status"` element announcing "2026年11月を表示". Also, the page `<h1>` should describe the page ("カレンダー"), with the month as an h2.
- **L20-22, L31-33 (M, 2.5.8):** previous/next month buttons are `.c--cal-iconbtn` 2rem (32px), below 44px but above 24px. They have `aria-label` ("先月", "来月"), good.
- **L23-30 (M):** the "今月" button has `aria-label="今月へ戻る"` that differs from the visible "今月". Label-in-name (2.5.3): the visible text "今月" is contained in "今月へ戻る", so this passes. It has inline styles, with `padding: 0 4px` and no explicit height, so it is about 16px high: fails 2.5.8 (24px min) unless it is within the spacing exception; the pillbar buttons are spaced at 4px gaps, so the target (about 30x16px) is below 24px in height. Fix: `min-height:44px; min-width:44px`.
- calendar.css:33-46 `.c--cal-iconbtn` has no focus style (G7), and colour `on-surface-variant` on `surface-high` 7.6:1, fine.

**MonthGrid.tsx**

- **L40-56 (H, 4.1.2, 1.3.1, 2.1.1):** the day grid is a CSS grid of `<button aria-pressed>` with `aria-label={iso + " 記録あり"}` (e.g. "2026-11-19 記録あり", a raw ISO string). Problems:
  - The label is read as "2026 dash 11 dash 19", poor for SR users, which fails 2.4.6/1.3.1-intent; use a localised date: "11月19日 木曜日、記録あり". It also drops the visible day number from the name only partially (label-in-name 2.5.3: the visible text is "19", and the label "2026-11-19" contains "19" only as a substring of the string, so a speech-control user saying "click 19" may not match). Prefer "19日…".
  - It is a calendar date picker pattern. It is neither a `role="grid"` nor a table, so there is no week/weekday header association: the weekday header row is `aria-hidden` (L32), so the day names are not conveyed per cell (1.3.1). Fix: use the library `Calendar` component from `@utakata-ui/react` (CalendarProps, CalendarLabels), or implement `role="grid"` with `role="columnheader"` and arrow-key navigation. Minimum: include the weekday in each button label.
  - `aria-pressed` on a date button signals toggle semantic; for single selection of a date use `aria-current="date"` for today and `aria-selected` in a grid, or a RadioGroup. Currently "today" is only a visual ring (calendar.css:86-88) and not exposed (1.3.1/4.1.2).
  - All 28-31 buttons are in the tab order (Tab stops: 30+). The roving-tabindex grid pattern is not applied; keyboard users must tab through every day (2.1.1 passes technically, but poor).
  - Hit area: `padding:.25rem 0; font 13px` with a 6px dot gives about 4+16+4+6+4 = ~34px height, width about 14% of 352px = ~48px. Height under 44 (M).
- **L19, L28 (M):** "選択中" legend dot has `border: 1px solid primary` and `--surface-high` fill, and "記録済" dot is `--primary`. The legend and the in-grid dot indicators are the only ways to see recorded days: the worn dot is `--primary` (6px) vs unworn `--surface-highest` (1.17:1 on base): fine because unworn is deliberately subtle. The recorded state is conveyed by a 6px dot of colour only for sighted users, though the label has "記録あり" for AT. Dot vs background for the worn state is black/ #e2c0a3 (high), so OK. The "is-today" state is only a 1px inset ring (L86-88) that is `--primary` (contrast OK, but 1px and non-text ring is only just a visible marker); add a "今日" text or `aria-current="date"`.
- **L34 (M, 1.4.1, 1.4.3):** Sunday header `--error` red and Saturday `--primary`; with the header `aria-hidden`, the colour is not the only signal for AT, but visually colour alone distinguishes weekend (1.4.1 passes because the text "日"/"土" itself identifies it). Sunday cell numbers use `--error` #ba1a1a on `--surface-low`: 5.86:1 (OK), dark #ffb4ab: 10.1.
- **L58 / calendar.css:99-103 (M, 1.4.3):** out-of-month fill days `--outline-variant` on `--surface-low`: **1.54:1 light, 1.84:1 dark**. These are `aria-hidden` and intentionally disabled-looking (inactive UI components are exempt from 1.4.3), so acceptable as decoration; make sure they are not focusable (they are spans). Low.
- **L17-22 (L):** Heading h2 includes a month badge `monthEnglish` as a span: "着用カレンダー NOVEMBER". In `lang="ja"` the English month is read with a Japanese voice. Add `lang="en"` or drop (3.1.2).
- **L19 badge colours:** `on-accent-container` on `accent-soft`: **1.19:1 in dark** (H, 1.4.3). See token fix (section 11).

**AnalyticsCard.tsx**

- **L8 (M):** `<section aria-label=...>` is OK.
- **L19-33 (H, 1.1.1, 1.4.1/1.3.1):** the progress ring: the `<svg>` is `aria-hidden="true"`, and the percentage appears as visible text "62%" inside the div, followed by the "クローゼット稼働率" text. So the information is available to AT as separate text nodes ("62" "%" then the label, read in the wrong order: value then label, with no association). It is not exposed as a progress or meter. Fix: use `<div role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={utilization} aria-valuetext={`${utilization}%`} aria-labelledby="util-label">` or `Progress` from `@utakata-ui/react` (Progress.Root/Track/Indicator/Value/Label with `ProgressAccessibilityProps`). Group the "N / M 日" values into a `<dl>`.
  - `strokeDasharray` with circumference `2π·15.9155 = 100`, so it is a correct percent ring.
  - Ring colours: `--primary` on `--surface-highest` track: very high; fine. Track vs background non-text: the unfilled track is deliberately subtle (1.3:1) but the filled arc and the number carry the information (OK).
- **L11-16 (M, 1.4.3):** 10px `c--cal-muted` texts, on `--surface-low` (8.5:1 light, 10.1:1 dark): fine, small only.
- **L38-39 (L):** the number split across spans: "{wornDays}" "日 / {totalDays}日" read as "5" "日 / 30日"; okay.
- **L41, L51:** decorative `c--cal-chip` icon badges, aria-hidden icons, fine. `c--cal-chip` with `accent-container` + `on-accent-container` is 4.57:1 light and **4.55:1 dark**: pass (barely) for 16px icons; fine.
- **L18:** the `div.c--cal-well` uses surface-lowest vs surface-low: container boundaries are not essential.

**SelectedDay.tsx**

- **L13-14 (M, 4.1.3):** when the user selects a day, the section updates but is not announced (no live region). Add `aria-live="polite"` on the h2 or an `sr-only` status ("11月20日を選択、記録なし").
- **L17-19 (L):** h2 "11月19日 (木)". Fine; weekday in parentheses read OK.
- **L20:** "TODAY" label is text; fine (but English in a ja page).
- **L34 (M, 1.1.1):** `<img alt={outfit.title}>` next to the h3 with the same title: redundant; alt could be a description or empty.
- **L42:** `Heading level="3"` with `white-space:nowrap; text-overflow:ellipsis`: truncation of a heading (1.4.4/1.4.10).
- **L56-63 (M, 2.5.8/2.5.5):** CTA buttons 48px, good. The share button has `aria-label="シェア"`, 48x48. Good.
- **L35 `c--cal-overlay` "N ITEMS" at 9px**, `--primary` on `surface-lowest`@85%: contrast fine; tiny text (G5).
- **L66-70:** empty state OK; text is a `<p>`; fine.
- **L24 (L):** weather text "℃" read OK.
- No `role="status"` on the empty/updated state (M).

**LowRotation.tsx**

- **L21-44 (M, 2.1.1, 1.3.1):** a horizontal scroller (`.c--cal-scroller`, overflow-x:auto) of `div.c--cal-card` containing buttons. A scroll container with focusable content inside is OK (the browser scrolls focused elements into view). It lacks a name and list semantics. Fix: `<ul role="list" aria-label="出番が少ないアイテム">` with `<li>` children; or use `Carousel` (`CarouselLabels`, `CarouselSlide`). Chrome 130+ exposes keyboard-focusable scrollers, but older browsers need `tabIndex={0}` on a scroll container with no focusable children; here there are children, so not required.
  - Scrollbar hidden (`scrollbar-width:none`) so mouse-only desktop users cannot see there is more content (L, 1.3.1/1.4.10).
- **L35-40 (M):** two small buttons "再提案" and "手放す": `padding: .375rem 0; font 10px` → about 13+12 = 25px high: fails 44px target, borderline 2.5.8 (24px). The "手放す" button has inline colour `--outline` (4.05:1 on `surface-high`?? Compute: outline #747878 on #e8e8e7 is about 3.6:1, fails 4.5:1 for 10px text; H/M, 1.4.3). In dark #9b8e85 on #2a2a2a is about 4.6:1 (ok). Fix: use `--on-surface-variant`.
  - Each button repeats identical text for every card; the accessible name lacks the item name ("再提案 ホワイトシャツ"). Add `aria-label={`${it.name}を再提案`}` (2.4.6 / 2.5.3 note).
- **L14-16 (M, 1.4.3):** badge text `--error` on a `color-mix(error-container 70%)` background: light 5.24:1; dark err #ffb4ab on mix of #93000a at 70% over #1c1b1b: high. OK. Its 30% error border is decorative.
- **L26 (M):** overlay `未着用 N日`: 9px text over a translucent chip; fine but tiny.
- **L25 `alt={it.name}`** fine; `h3` under an `h2`: ok.
- **L18 (L):** `<p style fontSize 14>` is fine.

**calendar.css**

- L63-76: day buttons: `transition: transform` and `:active scale` without reduced-motion (G6).
- L104-114 `.c--cal-btn` border `outline-variant @60%` and bg `surface-high`: the secondary button boundary is invisible (non-text contrast, 1.4.11): the button's text conveys the control, so OK.
- L142 `.is-accent` colour primary: fine.
- L175-182 `.c--cal-overlay` 9px, fine.
- L38-46: the hover style only; no focus (G7).

## 10. src/pages/ItemDetail.tsx and components/item/*

**ItemDetail.tsx**

- **L25-30 (M, 2.4.1, 4.1.2):** the back link has text "クローゼット" with an icon; OK. It should be inside a breadcrumb or `<nav aria-label="パンくず">`, optional. `c--itemBack` is 44px high, good.
- **L32-34 (M, 2.5.8):** share button `c--itemRoundBtn` is 40x40, close to 44; `aria-label="共有"`, no handler. Fine.
- **L35-46 (M, 4.1.2, 4.1.3):** the favourite toggle has `aria-pressed` and a static label; good. The toast fires on toggle.
- **L72-77 (H, 4.1.3, 2.2.1):** `{toast && <div role="status">}` is **conditionally mounted**, so `role=status` often does not announce because the live region did not exist before content was inserted (the node is created together with its content). In Builder, the region is persistent (OK), but here it is not. Fix: always render `<div role="status" class="c--itemToast">` and toggle its content/visibility.
  - Auto-dismiss at 2.2s is too short (2.2.1) and it is fixed at `bottom:96px` with `pointer-events:none`.
  - Colour `inverse-on-surface` on `inverse-surface`: 11.6 light, 10.2 dark, fine.
- **L56-59, L61-68 (M, 2.5.8):** "変更内容を保存する" is 52px, and the text buttons 44px, good. They have no `type=submit`/form; the item fields are in no `<form>`, so Enter does not save (3.2.2 / 3.3.2). Wrap in a `<form onSubmit>`.
- No `<h1>` for the item name (G3).

**ItemGallery.tsx**

- **L9, L11 (M, 1.1.1):** the main image `alt={current.alt}` is dynamic; good. When the thumb changes, the change is not announced: add `aria-live="polite"` on a status `Image N / M` or make the counter (`c--itemCounter`, L24-26) `aria-live` (4.1.3). Currently the counter is visual only.
- **L28-45 (H, 4.1.2):** the thumbnail list: buttons with `aria-label` and **`aria-current={i === index}`**. `aria-current={false}` renders `aria-current="false"` (OK valid), but the semantics are wrong for a selection: `aria-current` is for a current item in a set, and is acceptable, but `aria-pressed` or `role=tab`/`radio` is clearer. Use `RadioGroup` or `Tabs`/`ToggleGroup`. The `<div class="c--itemThumbs">` has no role or label (M).
  - Thumb size 48x56 and a scroll container (`overflow-x:auto`), fine, 44px passes.
  - The thumbnail's `aria-current` marker is shown only via opacity (.7 → 1) and a 1px `--outline` outline (item.css:147-150): the selected state indicator is subtle: 1px outline `--outline` vs `surface-lowest` has 4.5:1 in light, but the selected vs unselected difference is opacity only (1.4.11 / 1.4.1). Fix: use a 2px accent ring.
  - `item.css:138 opacity:.7` on unselected thumbs reduces contrast of the image but the images are not text.
- **L17-22 (M, 2.5.8):** stage action buttons "撮り直す" and "拡大" are 32x32 (`c--itemStageBtn`), below 44px; `aria-label` present. Glass bg `surface-lowest @90%` over an image: icon contrast fine.
- **L12-15 (L):** badge "背景透過・補正済" 9px `on-surface-variant`; contrast ok, small.
- **L41-44:** `追加` 8px text in 48x56 button (item.css:163 font-size 8px) (M, 1.4.4): too small.

**ItemLooks.tsx**

- **L12 (M, 1.3.1, 2.1.1):** `<a href="/lookbook">` full page reload instead of TanStack `<Link to="/lookbook">` (breaks SPA navigation and loses state; also bypasses router focus handling). Use `Link`. The style is `.c--itemLinkBtn` (min-height 32px; M for 44px).
- **L16-42 (M, 2.1.1):** the horizontal scroller `.c--itemLooks` holds `div.c--itemLook` cards that are **not focusable and not links**, so keyboard users cannot activate or open a look; the cards look like content cards with no action, fine, but the scroller itself has no focusable content except the CTA, so keyboard users cannot scroll it (2.1.1). In Chromium 130+, scrollers without focusable children are focusable by default, but it is not universal. Fix: `tabIndex={0}` with `role="region" aria-label="このアイテムを使ったルック"`, or make cards links.
  - Looks images `alt={l.title}` with the title also shown as text: redundant.
  - `l.no` colour `--accent` at 9px on `--surface-lowest`: 6.47:1 light, 11.3:1 dark, size 9px.
- **L8-11 (M):** the heading count `({looks.length + 1})` is off-by-one relative to the visible cards (the "+1" is the CTA card). The AT user hears "(3)" with 2 looks and a CTA. Content bug; fix to `looks.length`.
- **L43-51 (M, 2.5.3):** CTA button text is split with `<br/>` into "この服で" "コーデを作る" "キャンバスへ移動": the accessible name is a concatenation, fine; the `<br>` renders with no space: "この服で コーデを作る"; fine in Japanese. No handler yet.

**ItemSpecs.tsx**

- **L43-47, 53-58, 63-66, 87-98 (H, 1.3.1, 3.3.2, 4.1.2):** inputs are wrapped in `<label htmlFor>` and are labelled, good. Problems:
  - Inputs have `outline-offset: 4px` and rely on the global `.c--item :focus-visible` (item.css:443). OK: the ring appears (2px accent).
  - The "カテゴリー", "カラー表記", "サイズ区分" fields have decorative `chevron_right`/`expand_more` icons implying a dropdown, but are free text inputs (`appearance:none`; item.css:244-246 lists `select` too). They should be `NativeSelect` or `Select` for category/size. The affordance mismatch is a 3.2.4 problem (L/M).
  - **Autocomplete/inputs:** no `autocomplete`. Not applicable (not user-personal data) except price: `inputMode="numeric"` with `type=text`; add `pattern="[0-9]*"` and a unit hint. The price filter silently strips non-digits (L).
  - **No `<form>`, no visible text indicating "tap to edit"** other than a hint `タップして編集` (OK).
  - The fields are visually borderless (transparent background, border 0) inside a tile; nothing (other than the label) tells sighted users these are inputs, a 1.4.11 (non-text contrast) issue because the input boundary is not identifiable (M). Add an underline or a visible border at 3:1.
- **L40, 104 (L):** decorative icons aria-hidden: good.
- **L106-124 (H, 4.1.2):** switch: `<button role="switch" aria-checked aria-labelledby={uid-clean}>` is correct. Only the first of two text lines is the name; the description "コーデ生成候補から一時的に除外されます" should be `aria-describedby`. Missing `aria-describedby`. Fine otherwise.
  - Size 44x24 (item.css:284-287): below 44px height (M); add `::after` hit area or a 44px wrapper; the whole tile row could be the label.
  - **Contrast of the switch (H, 1.4.11):** off-state track `--surface-highest` #e2e2e2 on the tile `--surface-lowest` #fff is **1.30:1** (light) and the knob (#fff) on the track is 1.3:1 as well, so the "off" state boundary is nearly invisible. Dark: surface-highest #353535 vs lowest #0e0e0e about 1.5:1. Fix: track border `1px solid var(--outline)` (4.47/6.07:1) in the off state. On state `--accent` (6.47:1 vs white) passes.
  - State is conveyed by position and colour; add visible "ON/OFF" text or an icon (1.4.1) (L).
  - Replace with `Switch` from `@utakata-ui/react` (Switch.Root/Thumb).
- **L127-141 (M, 4.1.2):** season buttons `aria-pressed` in a `div.c--itemSeasons` **with no group role or label** (the label "着用推奨シーズン" is a `<span>`, not associated). Fix: `<div role="group" aria-labelledby>` and use `ToggleGroup` (multiple). `.is-off` (L333-337) style: `--outline-variant` on `--surface-low` with line-through (**1.54:1 light, 1.84:1 dark**); if `disabled` is meant, the button is not actually `disabled` (the `s.disabled` flag only changes the class), so it is clickable but looks disabled and has no `aria-disabled` (H/M, 4.1.2). Fix: set `disabled` or `aria-disabled`.
  - Height 32px: below 44 (M).
- **L77-82 care labels:** spans with icons; the care icons carry meaning ("洗濯機可" etc.) and the text label is next to them: fine.
- **L33 and L29-31 (L):** "タップして編集" instruction text is fine.

**ItemSummary.tsx**

- **L21 (H, 3.1, 2.4.6):** h1 = brand name (see G3). The item name is a `Text` (`<p>`).
- **L24-27 (M):** "変更" `c--itemLinkBtn` button has no handler and a 32px height; its accessible name "変更" is ambiguous out of context (2.4.6): add `aria-label="ブランドを変更"`.
- **L33-39 chips (L):** plain `span`s: fine. In dark, `c--itemChip.is-accent` uses `on-accent-container` on `accent-soft`: **1.19:1** (H, 1.4.3; item.css:465-468). The text is "コットン100%" style material text at 10px: unreadable in dark mode. See token fix.
- **L76-94 (H, 1.1.1, 1.3.1):** efficiency ring is `aria-hidden` and the "N%" is a text span; the label "活用効率" is a separate span; same fix as AnalyticsCard (meter/progress, with a `aria-labelledby`).
- L54-72: stats are `div`s; use a `<dl>` for term/value pairs (L, 1.3.1).
- L14-18 / L60-62: 9px text.
- **Math (L):** `item.price / item.wearCount` with a zero wearCount gives Infinity; not a11y.

**item.css**

- L16-27: back link 44px, good.
- L28-41: round button 40px; `aria-pressed` state colour `--accent` on `--surface-container`: 5.58:1 light (accent/cont), 9.6 dark: good; but the state change is a colour change plus the filled icon (`is-fill`), fine.
- L74-78 glass elements: backdrop-filter; check `prefers-reduced-transparency` (L).
- L109-120 `.c--itemCounter` 9px `on-primary` over `primary @70%`: contrast depends on the image behind; it uses a mix with transparency, effective background is the image blended with 70% black (light mode), so contrast is fine (>7:1) because 70% primary dominates. In dark, `primary` is #e2c0a3 at 70% with `on-primary` #412c17: dark text on a light blended chip, fine.
- L129-150 `.c--itemThumb[aria-current="true"]` styles key off the attribute; `aria-current="false"` does not match, fine.
- L237-257: borderless inputs (see above).
- L443-446: the only scoped focus style; extend globally.
- L449-469 dark overrides: `c--itemChip.is-accent` contrast failure; see token fix.

## 11. src/styles/theme.css: contrast table (computed)

Normal-text threshold is 4.5:1; non-text/UI is 3:1.

| Pair                                                           | Light                     | Dark                        | Result                                                  |
| -------------------------------------------------------------- | ------------------------- | --------------------------- | ------------------------------------------------------- |
| text on base                                                   | 16.25                     | 14.42                       | pass                                                    |
| on-surface-variant (text-2) on base                            | 8.90                      | 10.92                       | pass                                                    |
| on-surface-variant on surface-low / container / high / highest | 8.5 / 8.07 / 7.64 / 7.23  | 10.1 / 9.67 / 8.44 / 7.21   | pass                                                    |
| accent on base                                                 | 6.14                      | 10.88                       | pass                                                    |
| accent on surface-lowest / low / container / high              | 6.47 / 5.87 / 5.58 / 5.28 | 11.31 / 10.07 / 9.63 / 8.41 | pass                                                    |
| on-primary on primary                                          | 21.0                      | 7.70                        | pass                                                    |
| on-accent on accent                                            | 6.47                      | 7.70                        | pass                                                    |
| primary on surface-low / high                                  | 19.05 / 17.13             | 10.07 / 8.41                | pass                                                    |
| error on base / low / lowest                                   | 6.13 / 5.86 / 6.46        | 10.94 / 10.12 / 11.37       | pass                                                    |
| on-error-container on error-container                          | 7.24                      | 7.24                        | pass                                                    |
| inverse-on-surface on inverse-surface                          | 11.59                     | 10.21                       | pass                                                    |
| on-accent-container on accent-soft                             | 7.17                      | **1.19**                    | **FAIL in dark** (H)                                    |
| on-accent-container on accent-container                        | 4.57                      | 4.55                        | pass (marginal; fails for any tint)                     |
| accent on accent-soft                                          | 5.02                      | 5.49                        | pass                                                    |
| outline on base / low / lowest                                 | 4.24 / 4.05 / 4.47        | 5.84 / 5.40 / 6.07          | text on low in light fails 4.5; non-text passes 3:1     |
| outline-variant on base / low / lowest                         | 1.62 / 1.54 / 1.70        | 1.98 / 1.84 / 2.06          | **FAIL 1.4.11** if used for control boundaries or icons |
| surface-highest vs surface-lowest (switch off track)           | 1.30                      | about 1.5                   | **FAIL 1.4.11**                                         |
| unworn dot (surface-highest) vs surface-low                    | 1.17                      | n/a                         | decorative, ok                                          |

Findings:

1. **(H, 1.4.3) Dark `--on-accent-container` #4d3721 on `--accent-soft` #59422c = 1.19:1.**
   - Affected: `.c--bld-chip.is-accent` (builder.css:72), `.c--itemChip.is-accent` (item.css:186, :465), MonthGrid month badge (MonthGrid.tsx:19, inline), Builder badge (Builder.tsx:154), Builder analysis icon.
   - Lookbook already works around it with an override (lookbook.css:291-296).
   - Fix: in the dark block set `--accent-soft: #59422c` with `--on-accent-soft: #ffdbce` (or reuse `--primary` for text, as lookbook does), and use `--on-accent-soft` for text on accent-soft in both modes. Light on-accent-container is OK. Better: introduce a dedicated `--on-accent-soft` token.
2. **(H, 1.4.11) `--outline-variant` as the only boundary or icon colour:** auth input border (auth.css:77), unpressed fav icon (closet.css:23), `is-off` season (item.css:335), closet search border (closet.css:9). Use `--outline` (4.47 light / 6.07 dark on lowest).
3. **(M, 1.4.3) `--outline` text on `--surface-low`/`--surface-high`:** placeholder (auth.css:85, unused) and LowRotation "手放す" (LowRotation.tsx:38, `--outline` on `--surface-high` about 3.6:1). Use `--on-surface-variant`.
4. **(M, 1.4.3) Opacity-reduced text:** Lookbook.tsx:77 `o="60"`: about 3.4:1 in light.
5. **(M) `--on-primary-container` (#858383 light) is not used in this audit; the light on-primary-container on primary-container is 4.9? Not computed because unused: verify before use.**
6. Dark `--radius-pill: .75rem` is a visual quirk, not an a11y issue.
7. `color-scheme: light dark` plus `prefers-color-scheme` in CSS means there is no manual toggle: fine, but `forced-colors` support is missing: switches (`::before` knob), dots and the ring `svg` rely on `background`/`stroke` that disappear in forced-colors. Add `@media (forced-colors: active)` rules for `.c--itemSwitch` (border: 1px solid ButtonText), `.c--cal-day.is-selected`, etc. (M, 1.4.11).
8. **`.c--bottomNav` / `.c--topBar`:** `backdrop-filter` plus 85% opacity background; no `@supports not (backdrop-filter)` fallback needed (colour is already 85% opaque).
9. **theme.css:97-192 lism-custom layer:** because these rules are in `@layer lism-custom`, any unlayered global focus rule will beat them, which is what you want for G7. But note: layered rules lose to unlayered ones, so the global focus-visible rule must be unlayered or in a later layer.

## 12. Touch target summary (2.5.8 min 24px; the stated goal 44px)

| Control                              | Size                    | Location            |
| ------------------------------------ | ----------------------- | ------------------- |
| TopBar iconBtn                       | 44                      | ok                  |
| Nav items                            | 64x48                   | ok                  |
| Profile avatar (if made interactive) | 32                      | TopBar.tsx:19-30    |
| Closet chips                         | 32 high                 | closet.css:14       |
| Closet sort                          | 28                      | closet.css:17       |
| Fav button (card)                    | 28                      | closet.css:23       |
| Builder pills                        | about 28                | builder.css:2-18    |
| Builder round arrows                 | 32 (sm 24, line 171 28) | builder.css:30-43   |
| Builder save/clear                   | 36                      | Builder.tsx:126,134 |
| Calendar month nav                   | 32                      | calendar.css:33-43  |
| "今月"                               | about 16 high           | MonthHeader.tsx:27  |
| Calendar day                         | about 34 high           | calendar.css:63     |
| LowRotation buttons                  | about 25 high           | calendar.css:135    |
| Item round buttons                   | 40                      | item.css:28         |
| Stage buttons                        | 32                      | item.css:100        |
| Switch                               | 44x24                   | item.css:284        |
| Season                               | 32                      | item.css:317        |
| Lookbook seg / pill / iconBtn        | 32 / 32 / 36            | lookbook.css        |
| itemLinkBtn                          | 32                      | item.css:198        |

## 13. Mapping to @utakata-ui/react (exports checked in node_modules/@utakata-ui/react/dist/index.d.ts)

Available exports: Accordion, Alert, AlertDialog, Avatar, Badge, Breadcrumb, Button, ButtonGroup, Calendar, Card, Carousel, Chart, Checkbox, Collapsible, Combobox, Command, ContextMenu, DatePicker, Dialog, Drawer, DropdownMenu, Empty, Field, HoverCard, Input, InputGroup, InputOTP, Item, Kbd, Menubar, NativeSelect, NavigationMenu, Pagination, Popover, Progress, RadioGroup, Resizable, ScrollArea, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Spinner, Switch, Table, Tabs, Textarea, Toast (+`useToastManager`), Toggle, ToggleGroup, Tooltip.

| Hand-written part                                                                                                                               | Replace with                                                                                                                                                                                                                                                                                               | Fixes                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| auth `AuthField` (AuthCard.tsx:32-54), `c--authField`                                                                                           | `Field` + `Input` (`InputProps`, `InputSize`)                                                                                                                                                                                                                                                              | label/description/error association, `aria-invalid`, `aria-describedby`; keep `autoComplete`, add required indicator |
| `c--authButton`, `c--bld-pill is-primary`, `c--cal-btn`, `c--itemSave`, `lb-cta`, `lb-edit`, `c--closetFab`, `c--itemTextBtn`, `c--itemLinkBtn` | `Button` (`ButtonVariant`/`ButtonSize`; `ButtonAccessibilityProps`)                                                                                                                                                                                                                                        | focus ring, 44px sizes, disabled/loading                                                                             |
| icon-only `c--iconBtn`, `c--bld-round`, `c--cal-iconbtn`, `c--itemRoundBtn`, `c--itemStageBtn`, `lb-iconBtn`, `c--favBtn`                       | `Button` (icon size) with a required accessible-name prop (`ButtonAccessibilityProps`)                                                                                                                                                                                                                     | enforces aria-label, 44px                                                                                            |
| Auth/inline error `<p role=alert>` (Login L65, Register L80, MagicLink L45, Verify L56)                                                         | `Alert` (`Alert.Root/Title/Description`, `AlertVariant`)                                                                                                                                                                                                                                                   | consistent role/live semantics, icon + text                                                                          |
| Auth success/info text                                                                                                                          | `Alert` (info/success variant) or `Empty`                                                                                                                                                                                                                                                                  | status semantics                                                                                                     |
| Builder toast (Builder.tsx:262) and ItemDetail toast (ItemDetail.tsx:72), `lb-cta` "done" state                                                 | `Toast` + `useToastManager` (`Toast.Root/Viewport/Action/Close`)                                                                                                                                                                                                                                           | persistent live region, timeout control, close button (`ToastCloseAccessibilityProps`)                               |
| `c--itemSwitch` (ItemSpecs.tsx:114)                                                                                                             | `Switch` (`Switch.Root/Thumb`)                                                                                                                                                                                                                                                                             | switch semantics, contrast tokens, 44px                                                                              |
| Season buttons (ItemSpecs.tsx:130), builder filter pills (if multi-select), Lookbook season segment (Lookbook.tsx:39)                           | `ToggleGroup` (`ToggleGroupItemProps`, `ToggleGroupOrientation`)                                                                                                                                                                                                                                           | grouping, roving focus, pressed/radio semantics                                                                      |
| Closet favourite, ItemDetail favourite, LookCard bookmark                                                                                       | `Toggle` (`ToggleProps`, `ToggleVariant/Size`)                                                                                                                                                                                                                                                             | `aria-pressed`, size                                                                                                 |
| Closet category chips, sort, Lookbook occasion pills                                                                                            | `ToggleGroup` (single) or `RadioGroup` (`RadioGroup.Root/Item/Indicator`)                                                                                                                                                                                                                                  | exclusive selection semantics                                                                                        |
| Builder drawer tabs (Builder.tsx:198)                                                                                                           | `Tabs` (`Tabs.Root/List/Tab/Panel/Indicator`)                                                                                                                                                                                                                                                              | role=tab with arrow keys, `aria-controls`, tabpanel                                                                  |
| ItemGallery thumbnails                                                                                                                          | `Tabs` (panels = images) or `ToggleGroup`/`RadioGroup`; main viewer optionally `Carousel` (`CarouselSlide`, `CarouselLabels`)                                                                                                                                                                              | selection semantics, keyboard                                                                                        |
| Builder item cycling (prev/next)                                                                                                                | `Carousel` (`CarouselProps`) or keep Buttons plus an `aria-live` region                                                                                                                                                                                                                                    | announce changes                                                                                                     |
| LowRotation and Lookbook horizontal scrollers; closet chip rows                                                                                 | `ScrollArea` (`ScrollAreaProps`) or `Carousel`                                                                                                                                                                                                                                                             | focusable scroll region, visible scrollbar                                                                           |
| Calendar `MonthGrid` + `MonthHeader`                                                                                                            | `Calendar` (`CalendarProps`, `CalendarLabels`, `CalendarDate`, `CalendarMonth`) (and `DatePicker` for entry)                                                                                                                                                                                               | real grid semantics, arrow-key nav, localised labels, `aria-current=date`                                            |
| `AnalyticsCard` / `ItemSummary` progress rings                                                                                                  | `Progress` (`Progress.Root/Track/Indicator/Label/Value`, `ProgressAccessibilityProps`) or `Chart`                                                                                                                                                                                                          | value/label exposed to AT (needs ring styling)                                                                       |
| Chips/tags/badges (`c--bld-chip`, `c--itemChip`, `lb-chip`, `lb-tag`, `c--cal-chip`, `c--itemTag`, month badge)                                 | `Badge` (`BadgeVariant`)                                                                                                                                                                                                                                                                                   | consistent contrast tokens                                                                                           |
| TopBar profile blob                                                                                                                             | `Avatar` (`Avatar.Root/Image/Fallback`, `AvatarSize`) inside `Button`                                                                                                                                                                                                                                      | accessible name, target size                                                                                         |
| BottomNav, Logout nav                                                                                                                           | `NavigationMenu` (`NavigationMenuLinkProps`) or keep a plain `<nav>`; note it is more of a top-level menu pattern. For a bottom tab bar a plain `<nav>` with `aria-current` is the correct pattern, and `Sidebar` is not mobile-bottom. Recommendation: keep BottomNav hand-written, just fix labels/focus | n/a                                                                                                                  |
| Closet search                                                                                                                                   | `InputGroup` (`InputGroup.Root/Addon/Button`) + `Input`                                                                                                                                                                                                                                                    | label, icon addon                                                                                                    |
| Closet / Lookbook empty states                                                                                                                  | `Empty` (`Empty.Root/Title/Description/Actions`, `EmptyTitleLevel`)                                                                                                                                                                                                                                        | structure and heading level                                                                                          |
| Item/Look cards                                                                                                                                 | `Card` (`Card.Root/Header/Title/Content/Footer`, `CardTitleLevel`)                                                                                                                                                                                                                                         | article/heading levels                                                                                               |
| Pending states (`Logging in…`, `Verifying…`, `One moment…`, wear "busy", RequireAuth null)                                                      | `Spinner` (`SpinnerAccessibilityProps`) with a label                                                                                                                                                                                                                                                       | `role=status` semantics                                                                                              |
| ItemSpecs free-text fields with chevrons (category/colour/size)                                                                                 | `NativeSelect` or `Select`; others `Input` inside `Field`                                                                                                                                                                                                                                                  | affordance + labelling                                                                                               |
| Item overflow "その他のオプション", "手放す・アーカイブ"                                                                                        | `DropdownMenu`, `AlertDialog` (confirm)                                                                                                                                                                                                                                                                    | menu semantics, confirmation                                                                                         |
| Item "アイテム N点を見る"                                                                                                                       | `Sheet`/`Drawer` when implemented                                                                                                                                                                                                                                                                          | focus trapping                                                                                                       |
| `c--bld-drawer` (a visual drawer, not an overlay)                                                                                               | stay a section; `Drawer` only if overlay                                                                                                                                                                                                                                                                   | n/a                                                                                                                  |
| Skip link, route announcer, focus-visible globals, reduced-motion                                                                               | no component; write in theme.css / `__root.tsx`                                                                                                                                                                                                                                                            | G1, G2, G6, G7                                                                                                       |

## 14. Suggested split for implementers

1. **Global/shell:** `routes/__root.tsx`, `routes/*.tsx` (titles), `App.tsx`, `AppShell/*`, `theme.css` (focus-visible, reduced-motion, contrast tokens, forced-colors, skip link, FAB/toast safe areas), `MaterialIcon.tsx`.
2. **Auth:** `auth/AuthCard.tsx`, `Login.tsx`, `Register.tsx`, `MagicLink.tsx`, `Verify.tsx`, `auth.css` (Field/Input/Alert/Spinner).
3. **Closet:** `pages/Closet.tsx`, `closet/ItemCard.tsx`, `closet.css` (headings, list semantics, ToggleGroup/RadioGroup, card links, 44px targets, focus).
4. **Builder:** `pages/Builder.tsx`, `builder.css` (Tabs, h1, live regions, toast, targets, dark chip contrast).
5. **Lookbook:** `pages/Lookbook.tsx`, `lookbook/LookCard.tsx`, `lookbook.css` (ToggleGroup, wear CTA live region, scrim, targets).
6. **Calendar:** `pages/Calendar.tsx`, `calendar/*` (Calendar component or grid semantics, Progress/meter, live region, h1/h2, targets, dark badge contrast).
7. **Item detail:** `pages/ItemDetail.tsx`, `item/*`, `item.css` (Switch, ToggleGroup, persistent status region, h1, gallery selection semantics, `<a>` to `Link`, switch off-state contrast, `is-off` disabled).
