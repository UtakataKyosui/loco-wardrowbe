---
name: react-port
description: >-
  Port an existing UI to idiomatic React 19 + TypeScript with the same behavior:
  Vue, Svelte, Angular, jQuery, vanilla JavaScript, or React class components.
  Use this skill whenever the user asks to migrate, convert, rewrite, or port a
  component, page, or app to React, or to modernize class components and legacy
  patterns. Trigger on port, migrate, convert, rewrite in React, "turn this Vue
  component into React", "modernize this class component", or a pasted template
  from another framework. Port the original tests first, keep behavior identical,
  and write a PORTING.md that lists every deliberate difference.
---

# React port

A port preserves behavior while changing the implementation. The output is not
"React that looks like Vue"; it is React that a React developer would have
written, with the same observable behavior and the same tests proving it.

## 1. The order of work

1. **Read the source and its tests.** The tests are the specification. If
   there are none, write characterization tests against the current behavior
   before touching the code.
2. **Port the tests first.** Same cases, same assertions, expressed in React
   Testing Library or Vitest. Run them against the source (where possible) or
   record the expected behavior in the PORTING.md. A port without a failing
   test is a rewrite with hope.
3. **Map the state and data flow.** List every piece of state, every input,
   every output, and every side effect. Decide where each lives in React:
   local state, lifted state, URL, ViewModel, or SDK.
4. **Port the markup and behavior.** Small components, hooks, semantic HTML.
5. **Run the gates.** `tsc --noEmit`, `eslint .`, the test suite. Compare the
   rendered output and the network calls, not just the unit tests.
6. **Write `PORTING.md`.** Every deliberate difference, every source quirk
   not reproduced, every dependency dropped, and why.

## 2. Mapping table

| Source | React 19 |
|---|---|
| Template interpolation `{{ user.name }}` | `{user.name}` — JSX escapes text by default |
| `v-if` / `{#if}` / `*ngIf` | `{condition && <View />}` or an early return |
| `v-for` / `{#each}` / `*ngFor` | `items.map(item => <Row key={item.id} ... />)` |
| `v-model` / two-way binding | `value={value} onChange={e => setValue(e.target.value)}` |
| Computed / derived property | compute during render; `useMemo` only for a measured cost |
| Watcher on a prop | derive the value, or `useEffect` only to synchronize an external system |
| Lifecycle `mounted` | `useEffect` with an empty dependency array (and a cleanup) |
| Lifecycle `updated` | usually derived state; an effect only for an external system |
| Lifecycle `unmounted` | the cleanup returned from `useEffect` |
| Slot / `<ng-content>` | `children` or a named prop (`header={<Header />}`) |
| Event bus / `$emit` | a callback prop up to the owner; never a global bus |
| Service / injectable | the ViewModel hook or a context-provided port |
| Class `this.state` / `this.setState` | `useState` / `useReducer` |
| Class `componentDidCatch` | an error boundary component |
| `ref` to a DOM node | `useRef` + the `ref` prop (React 19: ref-as-prop, no `forwardRef`) |
| jQuery DOM mutation | React state + declarative rendering; a ref only for a non-React widget |
| Global store singleton | a query layer for server state; context for dependency injection |

## 3. Framework-specific traps

### Vue

- `reactive`/`ref` deep mutation becomes explicit immutable updates. A Vue
  component that mutates a prop is a React bug; lift the state or copy it.
- `watch` with `immediate: true` is usually a derived value, not an effect.
- `provide/inject` maps to context, but context is for dependency injection
  (session, ports, ViewModel factory) — not for every shared value.
- Vue's `v-html` becomes `dangerouslySetInnerHTML` only with a sanitizer; port
  it as a reviewed trust boundary, not a mechanical translation.

### Svelte

- `$:` reactive statements become derived values or effects. Classify each
  one: pure computation (derive), external synchronization (effect).
- Stores become context or a query layer; avoid a module-level writable that
  every screen mutates.
- Svelte's transitions become CSS or a library; do not reimplement a
  transition in a `useEffect` with timers.

### Angular

- Services with RxJS become the ViewModel hook plus the SDK; keep the
  Observable at the boundary or convert with `useSyncExternalStore`.
- `ngOnChanges` is usually derived state; `ngOnDestroy` is an effect cleanup.
- Route guards become route-level loaders or a ViewModel check; the server
  still authorizes.
- Dependency injection becomes context or explicit arguments; do not build a
  service locator to imitate Angular.

### jQuery / vanilla JS

- Every direct DOM mutation becomes state that render derives. A ref is for
  focus, scroll, measurement, or a third-party widget.
- Event delegation becomes a React handler on the owning element.
- AJAX calls move to the ViewModel/SDK; no `fetch` in a component.
- Global mutable variables become module state or context, with a test.

### React class components

- `this.state` becomes one `useState` per independent value, or a
  `useReducer` for coupled transitions.
- Lifecycle methods split into effects by concern; one `componentDidMount`
  with five jobs becomes five effects (or, better, fewer).
- `this.props` in a callback becomes a dependency or a ref; stale closures
  are the class-to-hooks bug.
- `forwardRef` is unnecessary in React 19: `ref` is a normal prop.
- Error boundaries stay class components (React has no hook equivalent), or
  use a library.

## 4. Behavior parity checklist

- [ ] Every input, output and callback has the same effect.
- [ ] Every screen state is rendered: loading, empty, error, forbidden,
      ready.
- [ ] Every form validates, submits, and shows the same errors.
- [ ] Every route and deep link resolves to the same screen.
- [ ] Every network call has the same method, path, payload and headers.
- [ ] Keyboard and screen-reader behavior is the same or better.
- [ ] The original tests pass, ported; new tests cover the React-specific
      behavior (effects, cleanup, races).
- [ ] No `// @ts-ignore`, no `any` at the boundary, no silenced lint.
- [ ] `PORTING.md` lists every deliberate difference.

## 5. What not to do

- **Do not keep the source framework's shape.** A React component with
  `useEffect` for every Vue watcher, a `useState` per Angular service, or a
  jQuery plugin wrapped in a div is a port that will be rewritten again.
- **Do not port dead code.** If a branch is unreachable in the source, leave
  it out and say so in `PORTING.md`.
- **Do not skip the tests.** A port validated only by "it looks right" ships
  the source's bugs plus new ones.
- **Do not silently change behavior.** If the source has a bug, reproduce it
  in the port, pin it with a test, and list the fix as a follow-up — or fix
  it deliberately, with the test that proves the new behavior, and say so.
- **Do not drop accessibility.** If the source was a clickable `div`, the
  port is a `<button>`, not a mechanical copy of the markup.

## 6. Cross-skill contract

- `react-best-practices` is the target style; every ported component follows
  it.
- `react-review` reviews the port before merge and ranks a broken
  architecture contract above every other finding.
- The `lints/` config is the machine-checkable half; a port that needs a lint
  exception is a port that has not finished.
