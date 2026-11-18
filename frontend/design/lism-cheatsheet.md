# Lism CSS cheat sheet (lism-css 1.1.0 / @lism-css/plugin 0.5.1)

Source of truth: `node_modules/lism-css/dist` (`components/index.d.ts`, `config/defaults/props.js`, `tokens.js`).

## Components (`lism-css/react`)
Lism, Box, Flex, Stack, Grid, Center, Cluster, Columns(`cols`), AutoColumns(`cols`=min width), SwitchColumns, WithSide(`sideW`,`isSide`), Flow, Frame(+`ar`), TileGrid, Container, Wrapper(`contentSize`), Layer, BoxLink, Group (div/section/article/figure/nav/aside/header/footer/main/fieldset), Text (p/div/blockquote/...), Inline (span/em/strong/small/code/time/label...), Heading (`level="1".."6"` string; NOT `tag`), Link, List/ListItem, Media (img/video), Icon, Decorator, Divider, Spacer.
All accept `as`, `className`, `style` (camelCase or `--custom` only), `exProps`, `set`, `util`, `hov`, `css`.

## Style props
- Value becomes class if a token/preset, else inline style. `true` = bare class (`bd`, `bd-b`).
- Space tokens: 5,10,15,20,25,30,35,40,45,50,60,70 (10≈8px, 20≈16px, 30≈24px, 40≈40px). Props: p, px, py, pt, pb, pl, pr, m*, g, cg, rg; `0` ok; `auto` on margins. Space lists ok (`p="10 20"`).
- Color: `c` (base,text,text-2,brand,accent,keycolor,inherit), `bgc` (base,base-2,text,brand,accent,keycolor,transparent), mixes `bgc="brand:20%"`, any other value (hex/oklch/var(--x)) passes through. `bdc`.
- Border: `bd`, `bd-x|y|t|b|l|r`, `bds`, `bdc`, `bdw`.
- Radius `bdrs`: 10=.25rem 20=.375 30=.625 40=1rem 50=1.5rem 99=pill, 0. Corners `bdrs-tl` etc.
- Shadow `bxsh`: 10..50, 0.
- Type: `fz` 2xs,xs,s,m,base,l,xl,2xl,3xl,4xl,5xl; `fw` light/normal/bold/100-900; `ff` base/accent/mono; `lh` xs,s,m,l,xl,1; `lts` xs,s,base,l,xl; `ta`, `tt`, `fs`, `o` (opacity).
- Size: `w`,`h`,`min-w`,`max-w`,`max-h`... tokens xs=400px s=640 m=880 l=1200 xl=1600, `100%`, `fit`; arbitrary values ok. `ar` presets 16/9,3/2,1/1.
- Layout: `d`, `fxd`, `fxw`, `fx`, `fxg`, `fxsh`, `ai`, `jc`, `ji`, `ac`, `pi`, `pc`(`jc="center"`/`"c"`/`"between"`), `gt`, `gtc`, `gc`, `cols`, `pos`, `z`, `t/l/r/b/i`, `ov`, `ov-x`, `ov-y`.
- `hov="c bgc"`, `set` (plain, revert, hov, bxsh, bdrsInner, bleed, s), `util` (cbox, trim, trimAll, srOnly, clipText), `css={{...}}` for raw styles.
- Responsive (only props marked bp: fz, d, w, h, p*, m*, g, cols, jc, ai, bdrs, bxsh, pos...). Array `[base, sm, md, lg]` or `{base, md}`; breakpoints sm 480 / md 800 / lg 1120. Uses container queries → needs a `<Container>`/`isContainer` ancestor.
  Not responsive: c, bgc, bd*, ta, fw, ff, z.

## Theme / tokens
- Config file `frontend/lism.config.ts` (`import type { LismConfig } from 'lism-css/config-types'`), deep-merged over defaults. `tokens.color`, `tokens.ff`, `tokens.fz`, `tokens.bdrs`, `tokens.space`, ... Colors become `--name`, others `--{group}--{name}`.
- Semantic color vars: `--base --base-2 --text --text-2 --divider --link --brand --accent --neutral --shadow`; palette `--red ...`.
- No built-in dark mode. Override variables in CSS: `@media (prefers-color-scheme: dark){ :root{ --base:...; --text:... } }`.
- Config changes may generate `lism-env.d.ts` (must be included by tsconfig).
- Possible SSR mismatch with custom config: `ssr.noExternal: ['lism-css']` in vite.config.ts.

## Custom CSS
Layers (weak→strong): lism-base, lism-block, lism-trait, lism-primitive, lism-custom, lism-utility. Put your own classes in `@layer lism-custom { .c--name {...} }` (convention `c--name`). Unlayered CSS beats all layers. `@utakata-ui/react/styles.css` is imported after lism main.css in `__root.tsx`.

## Existing usage
`src/pages/Home.tsx` already uses `Group as="header" bd-b`, `Flex jc="center"`, `Heading level="2"` (all valid).
