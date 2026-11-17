---
name: react-best-practices
description: >-
  Write idiomatic, robust, maintainable React 19 + TypeScript. Use this skill whenever
  you write, review, refactor, debug, or explain a React component, hook, view, or SPA
  feature: JSX/TSX, state, effects, forms, routing, data fetching, the MVVM ViewModel
  layer, the shared SDK, accessibility, performance, tests, eslint or tsconfig. Trigger
  on any mention of React, React DOM, JSX, TSX, hooks, useState, useEffect, useReducer,
  context, TanStack Query, react-router, Vite, Next.js, or "fix this component" even
  when the user never says "best practices" or "idiomatic". Synthesized from the React
  19 documentation, the React handbook patterns, the TypeScript strict handbook, and the
  facta frontend handbook.
---

# React best practices

Distilled from the React 19 documentation, the patterns the React team and the
community converged on, and the facta frontend architecture contract. The
digests live in `references/`; where sources disagree, this file says which to
follow and why.

## 1. Mindset

- **Write React-shaped code.** Components are functions that return JSX and
  receive props; composition is the extension mechanism. Don't write Angular
  services, Vue options objects, or jQuery DOM mutation in JSX. A component
  that reaches into the DOM to change what React renders is a bug waiting for
  a re-render.
- **Make invalid states unrepresentable.** A discriminated union
  (`status: "idle" | "loading" | "empty" | "ready" | "error"`) cannot hold two
  states at once; three booleans can. Model the screen as one status plus its
  data, not as a pile of flags.
- **Derive, don't duplicate.** If a value can be computed from props or state,
  compute it during render. `useEffect` + `setState` to mirror a prop is the
  most common React bug: it renders twice, lags one frame, and loses updates.
- **Effects synchronize with the outside world.** Fetching, subscriptions,
  timers, and DOM APIs belong in an effect or, better, in the ViewModel/SDK
  layer. An effect that only transforms state is derived state in disguise.
- **Let the tools do the work.** TypeScript strict owns types, ESLint owns
  hooks, layers and accessibility, Prettier owns formatting. Spend your
  attention on state design and component boundaries.

## 2. Before you hand back code

Run these and fix everything they report:

```bash
npx tsc --noEmit
npx eslint .
npx vitest run
```

- Fix a lint rather than silencing it. When one is genuinely wrong for one
  line, put `@ts-expect-error` (for a type error) on the narrowest line with a
  reason: `// @ts-expect-error the vendor types omit the field they added in
  3.4`. Never write `@ts-ignore`, `@ts-nocheck`, or a blanket
  `eslint-disable` without a description — an expect-error that stops being
  needed becomes a compile error; a described disable is reviewable.
- Lint config lives once, in `eslint.config.mjs`, and type config in
  `tsconfig.json` — not in per-line suppressions. If a project has none,
  suggest the BeautifulReact drop-in at `lints/eslint.config.mjs` of
  https://github.com/Facta-Dev/beautifulreact; it carries the layer walls of
  §6 as `no-restricted-imports` overrides.
- Group the three commands in CI so a regression fails the build, not code
  review.

## 3. Components

- **One component, one job.** Split when a component renders two independent
  concerns or its props grow into an option bag. Extract a child, not a
  helper that returns JSX from inside the parent: React DevTools, keys and
  hooks all work better with real components.
- **Props are a public API.** Name them for the caller (`onSave`, `isSaving`,
  `initialValue`), not for the implementation. Pass data down and callbacks
  up; never pass a setter from a grandparent through two layers — lift the
  state to the nearest common owner or put it in the ViewModel.
- **`children` over configuration.** A `renderHeader`/`renderFooter` pair is
  usually just `children` or two named slots (`header={<Header />}`). Compound
  components (`Tabs`, `Tabs.List`, `Tabs.Panel`) beat a `variant` enum when
  the caller composes structure.
- **Keys are identity, not index.** A stable id from the data. An index key
  on a reorderable list makes React reuse the wrong DOM node and the wrong
  input value.
- **Controlled by default.** A form field takes `value` + `onChange`; an
  uncontrolled field is an explicit `defaultValue` optimization, not the
  default. Mixing both in one component is a bug.
- **No side effects during render.** No `document.title =`, no
  `localStorage.setItem`, no `fetch`, no `console.log`. Render is pure; use an
  effect or an event handler.
- **Conditional rendering, not conditional hooks.** Early-return the empty /
  loading / error screen *after* all hooks have run. A hook behind an `if`
  changes the hook order and React throws.

## 4. Hooks

- **Rules of Hooks.** Call hooks at the top level of a function component or
  custom hook, in the same order every render. Never in loops, conditions, or
  nested functions. `react-hooks/rules-of-hooks` is non-negotiable.
- **`useEffect` is a synchronization primitive.** Ask "what external system
  am I synchronizing with?" If the answer is "nothing", delete the effect.
  Fetching data in an effect without cancellation, deduplication and error
  handling is the classic race; put it in the query layer or the ViewModel.
- **Dependencies are the contract.** Every reactive value the effect reads
  belongs in the dependency array. Do not lie to satisfy the linter; if the
  array is unstable, make the value stable (`useCallback`, a ref, or move the
  function out). `react-hooks/exhaustive-deps` is non-negotiable.
- **StrictMode remounts effects in development on purpose.** A ref-guarded
  one-shot effect (boot refresh, one-shot subscription) whose only in-flight
  request is discarded by a cleanup `cancelled` flag loses that result: the
  simulated unmount flips the flag before the promise settles and the second
  run exits on the guard, so the app stays on its signed-out or loading state
  in development. Declare the flag inside the effect so each run owns one, or
  drop it and let the ref guard the single request; keep the abort/cleanup §7
  asks for on effects that re-run.
- **Custom hooks extract behavior, not markup.** `useLeadDetail(id)` returns
  `{ status, lead, retry }`; it does not return JSX. A custom hook that calls
  another custom hook is fine; one that hides a component boundary is not.
- **Refs are for imperative escape hatches.** Focus, scroll, measuring, and
  integrating a non-React widget. A ref that stores derived data or mirrors
  state is a sign the state belongs in React.
- **`useMemo`/`useCallback` only after a measured cost.** They are not
  correctness tools and they add dependency arrays to maintain. Reach for
  them when a child is memoized and the identity matters, or a computation is
  provably expensive. React Compiler (when enabled) makes most manual
  memoization redundant.
- **Concurrent features are opt-in, not decoration.** `useTransition` for a
  non-urgent update that must not block typing; `useDeferredValue` for a
  expensive list render; `Suspense` around a boundary that can stream. Do not
  wrap everything in transitions "for performance".

## 5. State

- **Keep state as local as possible.** A modal's open flag belongs in the
  modal's parent, not in a global store. Lift only when two siblings need the
  same value.
- **One owner per piece of state.** If two components can set it, it is
  shared state: lift it or put it in the ViewModel. Never let two copies
  drift.
- **URL is state.** Filters, tabs, pagination and selected ids belong in the
  URL when the screen should survive a refresh, a back button, or a shared
  link. Read with the router's typed params, not `window.location`.
- **Server state is not client state.** Cache, revalidation, deduplication,
  retries and background refresh belong to a query layer (TanStack Query or
  the SDK's cache), not to a `useEffect` per component. The query key is the
  cache identity; make it stable and serializable.
- **Context is dependency injection, not a global store.** Put a session,
  theme, router or a feature's ViewModel factory in context. A context with a
  growing object of unrelated values re-renders every consumer; split it.
- **Reducers for transitions, not for every field.** `useReducer` pays off
  when one event changes several values together or the next state depends on
  the previous one. A reducer with one `set` action is `useState` with extra
  ceremony.
- **Reset state with `key`, not with an effect.** Render `<Form key={id} />`
  to reset a form when the selected id changes; an effect that calls
  `setState` on every id change is a render race.

## 6. Architecture contract: View → ViewModel → SDK

The frontend is layered; the layers are enforced by lint, not by convention.

| Layer | Responsibility | May import | Must not import |
|---|---|---|---|
| **View** | Render JSX, forward events, layout, styling, a11y | Its feature's ViewModel hook, the UI kit, platform APIs for rendering | The SDK, HTTP, tokens, business rules, router internals, other features' internals |
| **ViewModel** | Presentation state, derived values, form state, commands, orchestration of SDK calls, loading/error states | The SDK, ports (`Navigator`, `Notifier`, `TokenStore`), shared domain types, React hooks | JSX, `react-dom`, `react-native`, `chrome.*`, router libraries, views |
| **SDK** | Typed API client, DTOs, error normalization, auth/tenant headers, pagination, retries | `core` ports and types | React, any UI, any platform API |

The contracts below are **unbreakable and non-waivable**: they are the
reason the codebase survives its second year. Projects can restyle anything;
developers cannot opt out, and neither can you.

1. **The View never talks to the network.** No `fetch`, no `@/sdk` import,
   no token read in a view. The View calls a ViewModel command and renders
   its state.
2. **The ViewModel never imports a platform rendering module.** `react-dom`,
   `react-native`, `chrome.*` and router internals stay out. Platform
   differences enter through ports.
3. **The SDK never imports React.** It is a plain TypeScript client; it can be
   tested, reused by a CLI, and moved to another renderer.
4. **One feature = one backend slice.** The feature folder, the route module,
   the SDK module and the permission prefix share the same name.
5. **Authorization is server-side.** The UI uses permissions to hide actions;
   it never decides access. A hidden button is not a security control.

When a change would cross a layer, **re-cut the layout**: move the logic to
the layer that owns it. The rule is never to weaken or delete the lints to
make a change pass; a config exception is a contract change.
Review treats a broken contract as an automatic Must fix; `react-review`
ranks it above every other finding.

## 7. Data fetching and errors

- **One SDK per app, typed from the contract.** Methods mirror the URL
  contract: `sdk.app.funnels.leads.get(id)`, `sdk.admin.tenants.users.list(
  tenantId, { cursor, limit })`. The viewmodel calls the method; nobody
  hand-writes a URL string.
- **Every async surface has four states.** `loading`, `empty`, `error`,
  `ready` — plus `forbidden` when the server says 403. Render them
  explicitly; an empty array is not an error and a spinner is not a state
  machine.
- **Errors are values.** Normalize the backend's error envelope
  (`{ error: { code, message, requiredPermission?, correlationId } }`) into a
  typed union. Never throw a string; never show a raw server message. The
  correlation id is copyable so support can find the request.
- **Cancel and deduplicate.** A query layer owns abort signals, cache keys and
  retries. A manual `useEffect` fetch needs an `AbortController`, a cleanup,
  and a guard against setting state after unmount.
- **Mutations are optimistic only when the rollback is designed.** Add the row
  locally, send the request, reconcile the server's answer; on failure,
  remove the row and show why. An optimistic update without a rollback path
  is data loss with a spinner.
- **401 and 403 are different.** 401 means sign in again (refresh, then
  redirect); 403 means the session is valid and lacks the permission. The
  ViewModel maps each to its own state.

## 8. Forms

- **One form state object, one validator, one submit path.** React Hook Form,
  TanStack Form, or a reducer — pick one per feature; don't mix three.
- **Validate at the edge and on submit.** The browser's `required`/`pattern`
  is a UX hint, not validation. The server is the authority; the client
  duplicates the cheap rules for speed.
- **Show errors next to the field and in a summary.** `aria-describedby`
  links the input to its message; `role="alert"` announces a submit failure;
  focus moves to the first invalid field.
- **Disable the submit button only while submitting**, not as validation.
  A disabled button with no explanation is a dead end; validate and show why.
- **Never lose user input on a failed submit.** Keep the values, show the
  error, keep the focus.

## 9. Performance

- **Measure before optimizing.** React DevTools Profiler first; a `memo`
  without a measured render cost is noise.
- **Code-split at routes and heavy widgets.** `React.lazy` + `Suspense` at the
  route boundary; a chart or editor can be its own chunk. Do not split every
  component — each chunk has a network cost.
- **Virtualize long lists.** A table of 10k rows renders a window, not 10k
  DOM nodes. Prefer a proven virtualizer over a hand-rolled scroll math.
- **Keep renders small.** A state change re-renders the component that owns
  it and its subtree. Move state down, split context, and pass primitives
  rather than freshly-created objects when a memoized child depends on them.
- **Images and fonts are the biggest wins.** Correct dimensions, `loading=
  "lazy"` below the fold, modern formats, `font-display: swap`. A React
  optimization that ignores a 4 MB hero image is rounding error.
- **`startTransition` for expensive non-urgent updates.** Typing stays
  responsive; the filtered list catches up. Do not hide a slow network behind
  a transition.

## 10. Accessibility and i18n

- **Semantic HTML first.** A `<button>` for an action, an `<a>` for
  navigation, a `<label>` for every input, a heading hierarchy that does not
  skip levels. A `div` with `onClick` is not a button: it has no keyboard
  behavior, no role, and no focus.
- **Keyboard is a first-class path.** Everything reachable by mouse is
  reachable by Tab/Enter/Space/Escape; focus is visible; a modal traps focus
  and restores it on close.
- **Name every control.** Icon-only buttons need `aria-label`; images need
  `alt` (or `alt=""` when decorative); form errors are linked with
  `aria-describedby`; a live region announces async results.
- **No color-only meaning.** Error/success also carry text or an icon; focus
  rings meet contrast; respect `prefers-reduced-motion` for animation.
- **Strings are keys, not literals.** `t("leads.empty")` with `Intl` for
  numbers, dates and plurals. Never concatenate translated fragments; a
  sentence assembled from pieces cannot be translated.
- **Direction and width.** Layouts survive `dir="rtl"` and long translations;
  don't hard-code pixel widths around text.

## 11. Security

- **Never ship a secret to the browser.** An API key in a bundle is public.
  Tokens live in memory or an httpOnly cookie; the backend authorizes every
  request.
- **Escape by default.** React escapes text children; `dangerouslySetInnerHTML`
  is a reviewed exception with a sanitizer (DOMPurify) and a comment naming
  the trust boundary.
- **Validate URLs before rendering them.** A `javascript:` or `data:` URL in
  an `href`/`src` is script execution. Allowlist schemes (`https:`, `mailto:`,
  relative) at the boundary.
- **CSP is the second lock.** No `unsafe-inline`/`unsafe-eval` in production;
  a nonce or hash for the scripts that need it. A CSP that only exists in
  report-only mode is documentation, not a control.
- **Treat server data as untrusted.** It can contain markup, a hostile file
  name, or a redirect. Sanitize at the boundary, not at every render site.
- **Authorization is server-side.** Hiding a route or a button is UX; the API
  must reject the request regardless of what the client renders.

## 12. Testing

- **Test behavior, not implementation.** React Testing Library queries by
  role, label and text — the way a user finds the control. A test that
  asserts a hook's internal call count breaks on a refactor that changed
  nothing for the user.
- **The pyramid:** unit tests for pure ViewModel logic and the SDK; component
  tests for a screen's states and interactions; a thin E2E suite (Playwright)
  for the journeys that cross pages. Don't E2E what a component test can
  prove.
- **Mock the network at the boundary.** MSW intercepts `fetch`; the component
  sees a real response shape. Mocking the SDK module hides the contract drift
  the test exists to catch.
- **Every screen state has a test.** loading, empty, error, forbidden, ready;
  every form has a validation and a submit-failure test.
- **No `act()` warnings, no arbitrary sleeps.** `findBy*` waits for the
  element; `waitFor` waits for the assertion. A `setTimeout` in a test is a
  flaky test with a delay.
- **Golden files for generated output.** A snapshot is reviewed like code;
  an unreviewed snapshot update is how a regression ships.

## 13. Cross-skill contract

- `react-review` reviews existing code and ranks a broken architecture
  contract above every other finding. Run it before a large refactor and
  after a port.
- `react-port` ports Vue, Svelte, Angular, jQuery, or class components to
  React 19 with the same behavior and ports the original tests first.
- The `lints/` config is the machine-checkable half of this skill. When this
  skill and the config disagree, the config wins and this file is fixed.

## Sources

- `references/react-19.md` — the React 19 API digest: Actions,
  `useActionState`, `useOptimistic`, `use`, ref-as-prop, document metadata,
  and what changed from 18.
- `references/react-patterns.md` — composition, custom hooks, state machines,
  controlled components, and the patterns that survived.
- `references/frontend-architecture.md` — the View → ViewModel → SDK layer
  contract, feature folders, route and permission mirroring.
- `references/typescript-strict.md` — the strict tsconfig set, discriminated
  unions, branded ids, and the type patterns React code needs.
