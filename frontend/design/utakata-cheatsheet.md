# @utakata-ui/react 1.0.0 cheat sheet

Source of truth: `node_modules/@utakata-ui/react` (`dist/components/*.d.ts`, `@utakata-ui/react/manifest`, `src/styles/styles.css`). Built on `@base-ui/react` 1.9.0 + `lism-css` 1.1.
All TSX snippets below were type-checked with `tsc` (strict, `moduleResolution: bundler`, React 19 types), including the negative cases in section 0.4.

## 0. Global facts

### 0.1 Import / SSR
- `import { Button, Field, ... } from '@utakata-ui/react'`. Compound components are objects: `Field.Root`, `Tabs.Tab`, ...
- Every component file starts with `'use client'`. Safe under TanStack Start SSR (they render on the server, hydrate on the client).
- Only **Toast** needs a provider (`Toast.Provider`, one `Toast.Portal > Toast.Viewport`). `DirectionProvider` (re-exported from Base UI, exported next to Menubar) is only for RTL; not needed for ja. Not needed by any component on our list.
- Hydration traps: `Calendar` / `DatePicker` read "today" from the clock. **Pass `today="YYYY-MM-DD"`** when SSR-rendering (derive it from a loader value) or you get a hydration mismatch.
- Portals (Dialog/Sheet/Drawer/Toast/NavigationMenu popup) render into `document.body` only on the client after open (Toast.Portal always mounts, keep it inside the provider).
- Dev-only a11y diagnostics (`useAccessibilityRef`) console.warn for missing/dangling names. Types enforce the rest.

### 0.2 Lism props pass-through
- Every DOM-producing part accepts Lism props (`p`, `px`, `g`, `w`, `fz`, `bgc`, `layout`, `flow`, responsive `{ base: .., md: .. }`, ...). They are translated by `getLismProps` into Lism classes + inline `style`, no wrapper DOM. Types: `LismProps`, `LismStyleProps`, `WithLismProps<T>` re-exported.
- Component-specific props win over Lism props. A few native attrs that collide with Lism prop names are kept native (e.g. Textarea `rows`/`cols`).
- `className` must be a string (function className is only allowed on unwrapped Base UI parts, e.g. Toast/Drawer parts keep string-only: Drawer Backdrop/Popup/Title/Description, Sheet.Popup).
- `Box, Container, Flex, Frame, Grid, Heading, Stack, Text` are re-exported from `lism-css/react` for layout.
- Do not pass unsupported visual props. Use `variant`/`size`/`className`/CSS custom properties.
- `Button` etc. accept Base UI's `render={<Link ... />}` prop to render another element (see Drawer.Trigger example). For navigation prefer real anchors, not `Button variant="link"`.

### 0.3 CSS, layers, theming (IMPORTANT)
- `@utakata-ui/react/styles.css` = `@layer lism-base, utakata.tokens, utakata.components, lism-block, lism-trait, lism-primitive, lism-custom, lism-utility;` + `@import "lism-css/main.css"` + two layers `utakata.tokens` (the `--ui-*` variables) and `utakata.components` (all `.ui-*` classes). It already includes ALL of Lism CSS.
- **Current bug in `src/routes/__root.tsx`**: it imports `"lism-css/main.css"` BEFORE `@utakata-ui/react/styles.css`. Lism's own layer statement then fixes the order first (`lism-base, lism-block, lism-trait, lism-primitive, lism-custom, lism-utility`) and the `utakata.*` layers get appended AFTER `lism-utility`. Verified on a production build: layer blocks appear as `lism-base, lism-block, lism-trait, lism-primitive, lism-custom, lism-utility, utakata.tokens, utakata.components`. Consequence: `.ui-*` rules **beat** our `@layer lism-custom` classes (`.c--iconBtn`, `.c--navItem`, ...) and even Lism utility/prop classes (`w`, `p`, ... on a Utakata component) because a later layer wins regardless of specificity.
- **Fix**: delete the `import "lism-css/main.css";` line in `__root.tsx` (keep `@utakata-ui/react/styles.css`, then `../styles/theme.css`). Verified by building a scratch copy: order becomes `lism-base, utakata.tokens, utakata.components, lism-block, lism-trait, lism-primitive, lism-custom, lism-utility`, so our `lism-custom` classes and Lism props override Utakata, and Utakata overrides only `lism-base` (reset). Unlayered CSS always beats all layers.
- Theme tokens (`@layer utakata.tokens :root`, light defaults + `prefers-color-scheme: dark` overrides) are consumed by every component:

| Utakata token | Light default | Map to our theme var |
|---|---|---|
| `--ui-color-primary` | #2357c6 | `var(--primary)` |
| `--ui-color-on-primary` | #fff | `var(--on-primary)` |
| `--ui-color-surface` | #fff | `var(--surface-lowest)` (or `--surface`) |
| `--ui-color-text` | #1c2432 | `var(--on-surface)` |
| `--ui-color-muted` | #596579 | `var(--on-surface-variant)` |
| `--ui-color-border` | #8993a5 | `var(--outline)` (NOT `--outline-variant`: #c4c7c7 on #f9f9f8 is ~1.7:1, below the 3:1 non-text contrast Input/Switch/Toggle borders need) |
| `--ui-color-danger` / `--ui-color-on-danger` | #b42318 / #fff | `var(--error)` / `var(--on-error)` |
| `--ui-radius-control` | .375rem | e.g. `0.75rem` |
| `--ui-shadow-popup` | 0 .5rem 1.5rem rgb(0 0 0/.2) | `var(--shadow-card)` |
| `--ui-focus-ring` | 3px ring of primary 35% | keep, or `0 0 0 3px color-mix(in srgb, var(--accent) 45%, transparent)` |
| `--ui-chart-series-1..6`, `--ui-chart-dash-*`, `--ui-chart-duration` | | only for Chart |

  Put the mapping in `theme.css` as **unlayered** `:root { --ui-color-primary: var(--primary); ... }`. Unlayered beats the layered Utakata `:root`, including the dark-mode media block, and because values are `var()` references, our existing dark `--primary` swap flows through automatically (no need to repeat inside the media query).
- Per-component custom properties (set on the element via `style`/className or a wrapper): `--ui-alert-background`, `--ui-alert-border`, `--ui-avatar-size`, `--ui-avatar-radius`, `--ui-avatar-background`, `--ui-badge-background/-color/-border`, `--ui-button-square-size`, `--ui-card-padding/-gap/-border/-background`, `--ui-drawer-size`, `--ui-sheet-size`, `--ui-empty-padding/-gap`, `--ui-item-gap/-padding/-border/-background/-hover-background`, `--ui-item-group-gap`, `--ui-progress-color/-size`, `--ui-separator-size/-color`, `--ui-skeleton-width/-height/-color`, `--ui-spinner-size`, `--ui-toggle-group-gap`, `--ui-z-floating`, `--ui-tooltip-*`, `--ui-hover-card-*`, `--ui-kbd-background`, `--ui-carousel-slide-padding`, `--ui-sidebar-width`, `--ui-resizable-*`.
- Class hooks (all BEM, `ui-` prefix): `.ui-button--{variant} .ui-button--{size} .ui-button--square`, `.ui-field .ui-field__label/__control/__description/__error`, `.ui-alert(--destructive)`, `.ui-switch .ui-switch__thumb[data-checked]`, `.ui-toggle(--outline|--sm|--md|--lg)[data-pressed]`, `.ui-tabs .ui-tabs__list/__tab[data-active]/__indicator/__panel`, `.ui-navigation-menu__list/__link[data-active]/__trigger`, `.ui-progress__track/__indicator`. State styling is by Base UI data attributes (`data-checked`, `data-pressed`, `data-disabled`, `data-invalid`, `data-active`, `data-popup-open`).
- Lism reset (`lism-base`) sets `button,input,select,textarea{font-size:max(16px,1em)}`, `:not(dialog){margin:0}`; fine with Utakata.
- Overrides: use `className` + CSS in `@layer lism-custom` (wins once the import bug above is fixed) rather than `!important`.
- Focus is styled via `box-shadow` focus ring (`--ui-focus-ring`), with forced-colors fallbacks; do not remove it.

### 0.4 Type-level enforcement (verified by `@ts-expect-error`)
These are compile errors: `<Button iconOnly>` without `aria-label`/`aria-labelledby`; `<Button square>` without `iconOnly`; `<Progress.Root value>` with no `label`/`aria-label`/`aria-labelledby`; `<Avatar.Image>` without `alt` (use `alt=""` when decorative); `<ToggleGroup.Root>` without `aria-label(ledby)`; `<Calendar>` without `aria-label(ledby)`. Not enforced by types (runtime dev warning only): empty strings, dangling ids.

## 1. Form controls

### Field (Base UI Field parts)
Parts: `Field.Root`, `Field.Label`, `Field.Control`, `Field.Description`, `Field.Error`. Props = Base UI Field props: Root `name`, `disabled`, `invalid`, `dirty`, `touched`, `validate(value, formValues)`, `validationMode` (default `'onSubmit'`; also `onBlur|onChange`), `validationDebounceTime`; Error `match` (`boolean` or a `ValidityState` key like `valueMissing`, `typeMismatch`) - omit `match` to always show when the field is invalid (use this for server/zod errors together with `invalid`).
Wiring (automatic): Label -> `<label for>`/`aria-labelledby` to the control id; Description id and Error id are added to the control's `aria-describedby` (Error only while shown); invalid state sets `aria-invalid` and `data-invalid` on Root/Label/Control/Description. Do not hand-write `htmlFor`/`id`/`aria-describedby` in a Field.
Rules: always a visible `Field.Label`; never placeholder-only. `Field.Control` is the generic control, but for text fields use **`Input`** / `Textarea` / `NativeSelect` *instead of* `Field.Control` (never nest both). Switch/Checkbox/Radio go inside Field.Root with a `Field.Label` sibling.
Default CSS: `.ui-field` is `display:grid; gap:.375rem`.

```tsx
<Field.Root name="email" invalid={false}>
  <Field.Label>メールアドレス</Field.Label>
  <Input type="email" required autoComplete="email" />
  <Field.Description>ログインに使います。</Field.Description>
  <Field.Error match="valueMissing">入力してください。</Field.Error>
</Field.Root>
```
With TanStack Form: pass `invalid={field.state.meta.isTouched && !field.state.meta.isValid}` on `Field.Root`, put `<Field.Error>{message}</Field.Error>` (no `match`) and wire `value`/`onValueChange`/`onBlur` on the Input.

### Input
`<Input />` = Base UI Input (is the Field control) + `size?: 'sm'|'md'|'lg'` (default md; native `size` attr unsupported, use CSS width). `onValueChange(value, eventDetails)` plus normal `onChange`. All native input attrs (`type`, `autoComplete`, `inputMode`, `required`, `readOnly`, `disabled`, `name`, `value`/`defaultValue`). Outside Field you must provide your own `<label>` / `aria-label`. Don't mask/coerce values.
```tsx
<Field.Root name="q"><Field.Label>検索</Field.Label><Input type="search" size="md" onValueChange={(v) => void v} /></Field.Root>
```
(Snippet type-checked in `FieldInput` form; the search variant only changes `type`.)

### Textarea
`<Textarea rows? size? />`; rows default 3; `size` is padding/font only; vertical resize only. Use inside Field.Root instead of Field.Control. State length limits in `Field.Description`.
```tsx
<Field.Root name="notes"><Field.Label>メモ</Field.Label><Textarea rows={4} maxLength={500} /><Field.Description>500文字まで。</Field.Description></Field.Root>
```

### NativeSelect
`<NativeSelect size? disabled? required? defaultValue|value onChange>` with `<option>`/`<optgroup>` children; `className`/`ref` target the `<select>`; wrapper + decorative chevron are rendered (`.ui-native-select`, `__control`, `__icon`). `multiple` and native `size` unsupported. Needs Field.Label. No placeholder-as-label.
```tsx
<Field.Root name="season"><Field.Label>季節</Field.Label>
  <NativeSelect defaultValue="ss" size="md"><option value="ss">春夏</option><option value="aw">秋冬</option></NativeSelect>
</Field.Root>
```

### Switch
`Switch.Root` (+ `Switch.Thumb` child) props: `checked`, `defaultChecked`, `onCheckedChange(checked, details)`, `disabled`, `readOnly`, `required`, `name`, `value`. role=switch, aria-checked, Space toggles; submits via its own hidden input. Name it with `Field.Label` in `Field.Root` (sibling) or a wrapping `<label>`. Label text must NOT change with state ("On/Off" forbidden). Use for immediately-applied settings; Checkbox for submit-confirmed. No mixed state.
```tsx
<Field.Root name="notify"><Switch.Root defaultChecked onCheckedChange={(c) => void c}><Switch.Thumb /></Switch.Root><Field.Label>通知を受け取る</Field.Label></Field.Root>
```
Colors: off = `--ui-color-muted`, on = `--ui-color-primary`, thumb = `--ui-color-surface` (thumb position is the non-color cue).

## 2. Actions & toggles

### Button
- `variant`: `solid | secondary | outline | ghost | destructive | link` (default `solid`). `size`: `sm | md | lg` (default `md`; min-height 2rem/2.5rem/3rem; no `xs`).
- `iconOnly: true` REQUIRES `aria-label` or `aria-labelledby` (type error otherwise). `square` (equal-width, 32/40/48px via `--ui-button-square-size`) is allowed ONLY with `iconOnly`. Icon inside must be `aria-hidden="true"`.
- Base UI Button: native `<button>`, `type` defaults to `button` per Base UI (set `type="submit"` explicitly for forms), `disabled` (native, not focusable, 0.55 opacity, `cursor:not-allowed`), `focusableWhenDisabled` (Base UI) if it must stay focusable, `render={<a .../>}` to change element, `nativeButton`.
- **No `loading` prop.** Pattern: `disabled={busy}` + `<Spinner size="sm" decorative />` + visible text like "保存中" (state in text; never a non-decorative Spinner inside a Button).
- Do not use `variant="link"` for navigation (use `<a>`/router Link). `destructive` must state the consequence in text; confirm with AlertDialog yourself.
- Lism props work (`w="100%"`, `px`, etc.).
```tsx
<Button type="submit" variant="solid" size="lg" w="100%" disabled={busy}>{busy && <Spinner size="sm" decorative />}{busy ? '保存中' : '保存'}</Button>
<Button iconOnly square aria-label="削除" variant="ghost"><svg aria-hidden="true" width="16" height="16" /></Button>
```

### Toggle
Two-state button (`aria-pressed`). Props: `pressed`/`defaultPressed`/`onPressedChange(pressed, details)`, `disabled`, `value` (used by ToggleGroup), `variant: 'outline' | 'ghost'` (default `ghost`), `size: sm|md|lg`, `iconOnly` (requires `aria-label(ledby)`). `type="button"`. Label must not change when pressed. Not for one-off actions (Button) nor immediate settings (Switch).
```tsx
<Toggle variant="outline" defaultPressed>お気に入り</Toggle>
<Toggle iconOnly aria-label="太字"><svg aria-hidden="true" /></Toggle>
```

### ToggleGroup
`ToggleGroup.Root` REQUIRES `aria-label` or `aria-labelledby`. Props: `value: string[]` (controlled, ALWAYS an array), `defaultValue: string[]`, `onValueChange(value: string[], details)`, `multiple` (default false), `orientation` (`horizontal|vertical`), `disabled`, `loopFocus` (true). `ToggleGroup.Item` requires a unique `value: string`, takes Toggle props (`variant`, `size`, `iconOnly`, `disabled`); do NOT set `pressed`/`defaultPressed` on items. Single mode may have zero selected (use RadioGroup for required choice). Items are not form-submitted.
```tsx
<ToggleGroup.Root aria-label="カテゴリ" defaultValue={['all']} onValueChange={(v) => void v}>
  <ToggleGroup.Item value="all" variant="outline">すべて</ToggleGroup.Item>
  <ToggleGroup.Item value="tops" variant="outline">トップス</ToggleGroup.Item>
</ToggleGroup.Root>
```
Good fit for our hand-written chips (filter chips); for a nav-like tab bar use Tabs.

### Tabs
`Tabs.Root` needs `value` (controlled) or `defaultValue` (types demand an initial value; no implicit first tab), `onValueChange(value, details)` (value type is broader than string; wrap with `String(...)` or narrow), `orientation`. `Tabs.List` (give `aria-label`; `activateOnFocus` default false = Enter/Space/click to activate; `loopFocus` true) > `Tabs.Tab value` (renders `<button>`, `disabled`) ; `Tabs.Panel value` (`keepMounted` false by default); optional `Tabs.Indicator` inside `Tabs.List`. Not for page navigation (use links / NavigationMenu).
```tsx
const [v, setV] = useState('a');
<Tabs.Root value={v} onValueChange={(n) => setV(String(n))}>
  <Tabs.List aria-label="表示切替"><Tabs.Tab value="a">一覧</Tabs.Tab><Tabs.Tab value="b">カレンダー</Tabs.Tab><Tabs.Indicator /></Tabs.List>
  <Tabs.Panel value="a">A</Tabs.Panel><Tabs.Panel value="b">B</Tabs.Panel>
</Tabs.Root>
```

## 3. Feedback

### Alert
`Alert.Root` (div) `variant: 'default' | 'destructive'`, `role?: 'alert' | 'status'` (NO role by default: static content is read in order). Use `role="alert"` (assertive) for errors inserted dynamically, `role="status"` (polite) for info; never on content present at page load. Optional leading `<svg aria-hidden="true">` becomes a grid column. `Alert.Title`, `Alert.Description` are divs (put a Heading inside Title if you need one). No dismiss/auto-hide (that is Toast). State errors in text, not colour only. CSS vars: `--ui-alert-background`, `--ui-alert-border`.
```tsx
<Alert.Root variant="destructive" role="alert"><Alert.Title>保存できませんでした</Alert.Title><Alert.Description>時間をおいて再試行してください。</Alert.Description></Alert.Root>
```

### Toast / useToastManager
Needs `Toast.Provider` (props `timeout` default 5000, `limit` default 3) wrapping everything that calls `useToastManager()` (in `App`, inside QueryClientProvider is fine) and exactly ONE `Toast.Portal > Toast.Viewport` (default `aria-label="Notifications"`; pass a Japanese one). `useToastManager()` returns `{ toasts, add, update, close, promise }`; `add({ title, description, priority: 'low'|'high', timeout, type, actionProps, ... })` returns the id. `Toast.Root` requires `toast={toast}`; `Toast.Title`/`Toast.Description` default to the toast's title/description (self-closing is fine); `Toast.Action` renders only with children or `toast.actionProps`; **`Toast.Close` requires children or `aria-label(ledby)`**. Polite live region; `priority: 'high'` -> role=alert (don't use for routine success). `timeout: 0` = persistent; don't put the only path to an action in an auto-dismissing toast. Update an existing toast by id (`update(id, ...)`) instead of spamming. F6 jumps into the viewport.
```tsx
function Toasts() {
  const { toasts } = useToastManager();
  return toasts.map((toast) => (
    <Toast.Root key={toast.id} toast={toast}><Toast.Content><Toast.Title /><Toast.Description /><Toast.Close>閉じる</Toast.Close></Toast.Content></Toast.Root>
  ));
}
function Notify() {
  const manager = useToastManager();
  return <Button onClick={() => manager.add({ title: '保存しました', description: '反映済み', priority: 'low', timeout: 5000 })}>保存</Button>;
}
export function ToastApp() {
  return (
    <Toast.Provider timeout={5000} limit={3}>
      <Notify />
      <Toast.Portal><Toast.Viewport aria-label="通知"><Toasts /></Toast.Viewport></Toast.Portal>
    </Toast.Provider>
  );
}
```

### Progress
`Progress.Root` props: `value: number | null` (**required**; `null`/NaN = indeterminate; do not use 0 for unknown), `min` 0, `max` 100, and **one of `label` (string|ReactElement, rendered as Progress.Label), `aria-label`, `aria-labelledby`** (type error otherwise). Children: optional `Progress.Value` (aria-hidden visual text, formatted %), `Progress.Track > Progress.Indicator`, optional manual `Progress.Label` (give it an `id` and set the same as Root `aria-labelledby`). role=progressbar with aria-valuenow/valuetext. Indeterminate animation stops under reduced motion. Colors `--ui-progress-color`, size `--ui-progress-size`. It is a linear bar; a ring needs custom SVG (keep `role="progressbar"` + name + values) or style Track/Indicator.
```tsx
<Progress.Root value={45} label="コーデ完成度"><Progress.Value /><Progress.Track><Progress.Indicator /></Progress.Track></Progress.Root>
```

### Spinner
`<Spinner size? label? decorative? />`: size `sm|md|lg` (default md, `--ui-spinner-size`), `label` default "読み込み中" (role=status + visually hidden text; **not allowed together with `decorative`**), `decorative` hides it (use inside Button/with text beside). Don't pass an empty label.
```tsx
<Spinner size="md" label="読み込み中" />
```

### Skeleton
`<Skeleton shape?: 'rect'|'circle' />` always `aria-hidden`; size by `style`/`--ui-skeleton-width/-height`. No role/name/tabindex allowed. Pair with a single visible `role="status"` text and `aria-busy="true"` on the loading region.
```tsx
<div aria-busy="true"><p role="status">読み込み中</p><Skeleton shape="circle" style={{ width: 40, height: 40 }} /></div>
```

### Badge
`<Badge variant?: 'solid'|'outline'|'subtle'|'destructive' />` (default `subtle`), children required visible text, plain `<span>`; decorative icons `aria-hidden`. Not a button/link/counter. State the status in text. Vars `--ui-badge-background/-color/-border`.
```tsx
<Badge variant="outline">下書き</Badge>
```

### Avatar
`Avatar.Root size?: 'sm'|'md'|'lg'` (`--ui-avatar-size`, `--ui-avatar-radius`, `--ui-avatar-background`) > `Avatar.Image` (**`alt` required**, `""` if decorative; rendered only after load) + `Avatar.Fallback` (children = initials; `delay` ms). If the name is visible next to it use `alt=""` and `aria-hidden="true"` on Fallback. Not a button (wrap in Button/link).
```tsx
<Avatar.Root size="md"><Avatar.Image src="/u.jpg" alt="綾" /><Avatar.Fallback>綾</Avatar.Fallback></Avatar.Root>
```

## 4. Layout / content

### Card
`Card.Root` > `Card.Header` (`Card.Title` `level: '1'..'6'` as a STRING, default `'3'`, children required; `Card.Description` is `<p>`) , `Card.Content`, `Card.Footer`. Static; never make the whole card clickable (put Button/link inside). Vars `--ui-card-padding/-gap/-border/-background`.
```tsx
<Card.Root><Card.Header><Card.Title level="2">タイトル</Card.Title><Card.Description>説明</Card.Description></Card.Header><Card.Content>内容</Card.Content><Card.Footer><Button>保存</Button></Card.Footer></Card.Root>
```

### Empty
`Empty.Root` > `Empty.Title` (`level` string `'1'..'6'`, default `'3'`, children required), `Empty.Description` (`<p>`), `Empty.Actions` (only if there is a next step; Button for actions, `<a>` for navigation). No live-region role. Vars `--ui-empty-padding/-gap`.
```tsx
<Empty.Root><Empty.Title level="2">アイテムがありません</Empty.Title><Empty.Description>追加してください。</Empty.Description><Empty.Actions><Button>追加</Button></Empty.Actions></Empty.Root>
```

### Separator
`<Separator orientation?: 'horizontal'|'vertical' decorative?: boolean />` (decorative default **true** = aria-hidden; `decorative={false}` exposes `role="separator"`). Plain HTML, not Base UI. Vars `--ui-separator-size/-color`. Vertical stretches in a Flex parent.
```tsx
<Separator orientation="vertical" />
```

### Item
`Item.Group` (ul) > `Item.Root` (li; `onClick`/`tabIndex`/`role` are TYPE ERRORS) > `Item.Icon` (always aria-hidden; no aria-*/role props), `Item.Body` > (`Item.Title` | **exactly one** `Item.Link` (needs `href` or `render`, children as name) | **exactly one** `Item.Button` (type="button", children as name)) + `Item.Description`; `Item.Meta` (static text); `Item.Actions` (siblings: Buttons/links; icon-only Buttons need `aria-label`). Link/Button makes the whole row clickable via a CSS stretched pseudo-element. Never nest controls inside Link/Button/Meta/Icon. Vars `--ui-item-gap/-padding/-border/-background/-hover-background`, `--ui-item-group-gap`.
```tsx
<Item.Group><Item.Root><Item.Icon><svg /></Item.Icon>
  <Item.Body><Item.Link href="/r">レポート</Item.Link><Item.Description>説明</Item.Description></Item.Body>
  <Item.Meta>11月1日</Item.Meta>
  <Item.Actions><Button iconOnly aria-label="削除" variant="ghost"><svg aria-hidden="true" /></Button></Item.Actions>
</Item.Root></Item.Group>
```

### ScrollArea
`<ScrollArea aria-label|aria-labelledby ...>`: a named `<section>` with native overflow scrolling, always in the Tab order (keyboard scrollable). Constrain block size via `style`/Lism props. Not for data tables (use `Table.Container`). No custom scrollbars.
```tsx
<ScrollArea aria-label="更新履歴" style={{ maxBlockSize: '12rem' }}>…</ScrollArea>
```

## 5. Navigation

### NavigationMenu
For site navigation (links + hover/click panels) via Base UI. Root REQUIRES `aria-label` or `aria-labelledby`. Parts: `Root`, `List` (ul), `Item` (li, `value` if it has a Trigger), `Link` (**needs `href` or `render`**; `active` -> `aria-current="page"` + `data-active`; `closeOnClick`), `Trigger` (button, aria-expanded) + `Icon` (decorative chevron) + `Content` (panel of Links), and ONE `Portal > Positioner (side, align, sideOffset) > Popup (nav) > Viewport` as sibling of the List inside Root when any Item has a Trigger/Content. Props: `delay` 50, `closeDelay` 50, `orientation`. At most ONE `active` link. Router integration: `render={<RouterLink to="/closet" />}` where the element renders an `<a href>` (TanStack `Link` does). Don't use role=menu; not for app commands (DropdownMenu). For a plain bottom nav of 4-5 links no Trigger/Portal parts are needed.
```tsx
<NavigationMenu.Root aria-label="メイン">
  <NavigationMenu.List>
    <NavigationMenu.Item><NavigationMenu.Link href="/closet" active>クローゼット</NavigationMenu.Link></NavigationMenu.Item>
  </NavigationMenu.List>
</NavigationMenu.Root>
```
TanStack: `<NavigationMenu.Link render={<Link to="/closet" />} active={isActive}>...` (Link passed via `render`; verify `href` is emitted). Our `.c--navItem` / `.c--bottomNav` classes can be added via `className` (they win only after the layer-order fix in 0.3).

### Breadcrumb
`Breadcrumb.Root` (nav; `aria-label` defaults to "パンくずリスト" unless `aria-labelledby`) > `List` (ol) > `Item` (li) containing `Link` (needs `href` or `render`) or `Page` (span, always `aria-current="page"`; exactly one); `Breadcrumb.Separator` is a sibling `li` (aria-hidden, default "/"), `Breadcrumb.Ellipsis` decorative. Unique landmark label per page if several.
```tsx
<Breadcrumb.Root><Breadcrumb.List>
  <Breadcrumb.Item><Breadcrumb.Link href="/closet">クローゼット</Breadcrumb.Link></Breadcrumb.Item>
  <Breadcrumb.Separator />
  <Breadcrumb.Item><Breadcrumb.Page>詳細</Breadcrumb.Page></Breadcrumb.Item>
</Breadcrumb.List></Breadcrumb.Root>
```

## 6. Overlays (Dialog / Sheet / Drawer)
Common rules: always a `Title`, a useful `Description`, and a visible `Close`; do not reimplement open state, focus trap, scroll lock, Escape (all handled by Base UI). Controlled: `open`/`onOpenChange`; uncontrolled: `defaultOpen`. Triggers/Close accept `render={<Button />}` to reuse Button styling (`Trigger` is otherwise a bare button). Structure: `Root > Trigger + Portal > Backdrop + Popup > Title/Description/Close`.
- **Dialog**: centered modal. Use `AlertDialog` for confirmations (e.g. destructive delete).
- **Sheet**: edge panel built on Dialog. `Sheet.Popup side?: 'top'|'right'|'bottom'|'left'` (default `right`). `modal` prop rejected. Size via `--ui-sheet-size` (width for left/right, max-height for top/bottom).
- **Drawer**: swipe-to-dismiss edge panel. `Drawer.Root side?` (default `bottom`) (NOT on Popup). `modal`, `swipeDirection`, snap points rejected by types. Size via `--ui-drawer-size`. Never run irreversible actions on pointer-down. Good for mobile filter/menus.
- Sides are physical (not RTL-flipped).
```tsx
<Drawer.Root side="bottom">
  <Drawer.Trigger render={<Button />}>フィルター</Drawer.Trigger>
  <Drawer.Portal><Drawer.Backdrop /><Drawer.Popup>
    <Drawer.Title>フィルター</Drawer.Title><Drawer.Description>絞り込み</Drawer.Description>
    <Drawer.Close render={<Button variant="outline" />}>閉じる</Drawer.Close>
  </Drawer.Popup></Drawer.Portal>
</Drawer.Root>

<Sheet.Root><Sheet.Trigger render={<Button />}>開く</Sheet.Trigger>
  <Sheet.Portal><Sheet.Backdrop /><Sheet.Popup side="right">
    <Sheet.Title>設定</Sheet.Title><Sheet.Description>説明</Sheet.Description>
    <Sheet.Close render={<Button variant="outline" />}>閉じる</Sheet.Close>
  </Sheet.Popup></Sheet.Portal>
</Sheet.Root>

<Dialog.Root><Dialog.Trigger render={<Button />}>詳細</Dialog.Trigger>
  <Dialog.Portal><Dialog.Backdrop /><Dialog.Popup>
    <Dialog.Title>詳細</Dialog.Title><Dialog.Description>説明</Dialog.Description>
    <Dialog.Close render={<Button variant="outline" />}>閉じる</Dialog.Close>
  </Dialog.Popup></Dialog.Portal>
</Dialog.Root>
```
Dialog CSS is fixed-center (`.ui-dialog__popup`, max 36rem/90vw, `--ui-color-surface` bg); z-index of floating layers via `--ui-z-floating`. Our fixed bottom nav is z-index 50 / top bar 40 - check Backdrop stacks above them (raise `--ui-z-floating` if needed).

## 7. Dates

### Calendar
`<Calendar aria-label|aria-labelledby />` REQUIRED name. All dates are plain strings `"YYYY-MM-DD"` (no Date objects, no time). Props: `mode: 'single'|'range'` (default single), `value`/`defaultValue` (single: `string|null`; range: `{from, to?}|null`), `onValueChange`, `month`/`defaultMonth` (`"YYYY-MM"`), `onMonthChange`, `minDate`, `maxDate`, `isDateDisabled(date)`, `locale` (default `ja-JP`), `weekStartsOn` (0=Sun ... 6), `today` (pass it for SSR), `labels: { previousMonth?, nextMonth?, selected? }`. Disabled days stay focusable (aria-disabled). Selected days get non-colour cues; a hidden status region announces selection. No multi-month, month/year dropdowns, RTL, outside-month days, form submission. No per-day content slot (our calendar with outfit dots/badges needs custom rendering: keep the hand-written grid, or use Calendar only as a date picker).
```tsx
<Calendar aria-label="着用日" defaultMonth="2026-11" today="2026-11-19" weekStartsOn={1} onValueChange={(v) => void v} />
```

### DatePicker
`<DatePicker label="日付" name="wornOn" ... />`: text input (ISO format) + calendar popover trigger + native validation; props `label` (visible), `name`, `id`, `form`, `value`/`defaultValue`/`onValueChange(value | null)`, `disabled`, `required`, `minDate`, `maxDate`, `isDateDisabled`, `locale`, `weekStartsOn`, `today`, `labels` (`DatePickerLabels`), `calendarLabels` (`CalendarLabels`). Single day only. Provide translated labels; pass `today` on SSR; validate on the server.
```tsx
<DatePicker label="日付" name="wornOn" today="2026-11-19" onValueChange={(v) => void v} />
```

## 8. Mapping our hand-written UI to Utakata
| Ours | Use |
|---|---|
| auth forms (login/register/magic-link) | `Field.Root/Label/Description/Error` + `Input` (`type`, `autoComplete`, `required`), submit `Button type="submit"` (+ decorative Spinner), form-level failure `Alert.Root role="alert" variant="destructive"` |
| icon buttons (`.c--iconBtn`) | `Button iconOnly square aria-label=".." variant="ghost"` (44px: use `size="lg"` = 48px or override `--ui-button-square-size: 44px`) |
| filter chips / tabs | chips with multi/single select: `ToggleGroup`; view switch: `Tabs` |
| settings toggles | `Switch` in `Field` |
| status labels | `Badge` (text states the status) |
| toast / inline errors | `Toast` / `Alert` |
| season/category pickers | `NativeSelect` |
| bottom nav / top nav | `NavigationMenu` (plain links; set `active`) |
| progress ring | `Progress` (bar) or custom SVG with `role="progressbar"` + name |
| user avatar | `Avatar` |
| item row lists | `Item` |
| side filter panel | `Drawer` (mobile) / `Sheet` / `Dialog` |
| empty / loading | `Empty` / `Skeleton` + status text / `Spinner` |
