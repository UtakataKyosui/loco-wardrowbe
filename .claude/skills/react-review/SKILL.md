---
name: react-review
description: >-
  Review React 19 + TypeScript code — a component, a hook, a feature folder, a
  pull request, or a diff — and produce a prioritized report where every finding
  cites the file and line, the rule it breaks, and the smallest fix. Use this
  skill whenever the user asks to review, audit, critique, or "find problems in"
  a React screen, component, hook, viewmodel, SDK client, route, form, or test.
  Trigger on review, audit, code review, PR review, "what is wrong with this
  component", "improve this screen", "check this refactor", or a pasted JSX/TSX
  file. The architecture contract always ranks first; a11y, correctness, hooks,
  performance, security and tests follow.
---

# React review

A review is a prioritized list of findings, not a rewrite. Read the whole
change first, then report. Every finding has four parts: **location** (file
and line), **severity**, **the rule it breaks** (named or quoted), and **the
smallest fix**. If you cannot cite a rule or a user-visible consequence, it is
not a finding — it is a preference, and preferences go in a short "Notes"
section at the end, if at all.

## 1. Report shape

```text
## Verdict
<one paragraph: what this change does, whether it is safe to merge, and the
single most important thing to fix>

## Must fix
1. <file>:<line> — <finding>. Rule: <rule or contract>. Fix: <smallest fix>.

## Should fix
...

## Notes
...

## Waived gates
...
```

- **Must fix** blocks merge: a broken architecture contract, a data-loss or
  security bug, an accessibility failure that makes a control unusable, a
  missing state that shows a blank screen, a test that cannot fail.
- **Should fix** is worth doing in this change or the next: duplication,
  a confusing name, an avoidable re-render, a missing empty state.
- **Notes** is optional: style, naming, and questions. Do not pad the report
  to look thorough; a short accurate report beats a long speculative one.

## 2. Categories, in ranking order

### Architecture contracts (always Must fix, ranked first)

A broken architecture contract (ranked above everything) is a Must fix even
when the code works. Check:

- A **View** imports the SDK, calls `fetch`, reads a token, or imports
  another feature's internals. The View must call its ViewModel.
- A **ViewModel** imports `react-dom`, `react-native`, `chrome.*`, a router
  library, or JSX. Platform differences enter through ports.
- The **SDK** imports React, a UI package, or a platform global. It must stay
  a plain TypeScript client.
- A feature folder, route module, SDK module or permission prefix no longer
  share the same name. One feature = one backend slice.
- A **permission decision** is made in the client as a security control. The
  UI may hide an action; the server authorizes it.

Name the violated rule and quote it. "This works, but it breaks the layer
contract" is the finding; the fix is to move the logic to the layer that owns
it.

### Correctness and state

- State mirrored from props with an effect; two copies of the same value.
- A derived value stored in state and updated by hand.
- A list keyed by array index on a reorderable list.
- A fetch race: no abort, no cleanup, `setState` after unmount, a stale
  response overwriting a newer one.
- A missing state: loading, empty, error, forbidden, or a mutation in flight.
- A form that loses input on a failed submit, or disables submit instead of
  explaining the error.
- A status modeled as booleans instead of one discriminated union.
- `key` missing on an array of elements, or a key that changes every render.
- A guard that re-fires its redirect on every render — typically while the
  target route's chunk is still loading — so the pending navigation restarts
  each time; the redirect must run once per mount.
- Two queries sharing one key with different shapes or fetch arguments
  (single page vs infinite, different page size); one poisons the other's
  cache.

### Hooks

- A hook behind a condition, loop, or nested function (rules of hooks).
- A dependency array that omits a reactive value, or lies to silence
  `exhaustive-deps`.
- An effect that synchronizes with nothing (derived state, event handler
  logic, or a render-time calculation in disguise).
- A custom hook that returns JSX or hides a component boundary.
- `useMemo`/`useCallback` with no measured cost, or memoizing a value whose
  identity already changes every render.
- A ref used to store state or mirror props.
- A ref-guarded one-shot effect that discards its async result on a cleanup
  flag: the StrictMode remount flips the flag before the promise settles and
  the second run exits on the guard, so the screen never leaves its loading or
  signed-out state in development.

### Accessibility

- An interactive `div`/`span` with `onClick` and no role, tabIndex, or
  keyboard handler.
- An icon-only button without an accessible name; an image without `alt`.
- A form field without a label, or an error not linked with
  `aria-describedby`.
- A modal without focus trapping and focus restoration.
- Error/success conveyed by color alone; a focus ring removed without a
  replacement; motion that ignores `prefers-reduced-motion`.
- A heading hierarchy that skips levels, or ARIA that contradicts native
  semantics.

### Performance

- A measured hotspot? Only then: a list rendered without virtualization, a
  route or heavy widget not code-split, a context whose value changes every
  render, a state update that re-renders a large subtree.
- An unoptimized image (no dimensions, no lazy loading, a multi-MB hero).
- A transition wrapping urgent work, or `useDeferredValue` used to hide a
  slow network instead of a slow render.
- A `memo` that does not help because the props are new objects every render.

### Security

- A secret, private key, or service token in client code or a bundled env
  var.
- `dangerouslySetInnerHTML` without a sanitizer and a named trust boundary.
- An `href`/`src` built from server data without a scheme allowlist
  (`javascript:`, `data:`, `vbscript:`).
- A CSP with `unsafe-inline`/`unsafe-eval`, or only in report-only mode.
- A client-side route guard presented as access control.
- A token in `localStorage` where an httpOnly cookie is available; a token
  logged or put in a URL.

### Tests

- A test that asserts implementation (call counts, internal state) instead of
  user-visible behavior.
- A mock of the SDK module where MSW would catch contract drift.
- A screen state with no test; a form with no validation or submit-failure
  test.
- `act()` warnings, arbitrary sleeps, or a snapshot updated without review.
- A test that cannot fail: no assertion, a tautology, or an `expect` on a
  value the test itself just set.

## 3. Waived gates

If the diff deletes or weakens a lint, a test, a type, or an accessibility
check, flag the deletion itself, loudly — even when the new code looks fine.
Look for:

- A removed `eslint-disable` **or a new one without a description**; a
  `@ts-expect-error` that suppresses a real error; `@ts-ignore` or
  `@ts-nocheck`.
- A lint rule turned off in `eslint.config.mjs`, a path removed from the
  layer overrides, or a `no-restricted-imports` exception added for one file.
- A banned-import matcher narrowed to the bare package name (`^pkg$` in a
  custom gate), which still passes its own fixture but lets `pkg/subpath`
  through silently.
- A skipped test (`.skip`, `.todo`, `xit`) without an owner and an expiry.
- A `tsconfig` strictness flag turned off; `any` introduced at a boundary.
- A snapshot regenerated without reading the diff; a coverage threshold
  lowered.

State the deletion, the reason it claims, and what it would take to keep the
gate. "Temporarily" is not a reason; an expiring waiver with an owner is.

## 4. How to review

1. **Read the change twice.** First for intent: what problem does it solve?
   Then for the diff: what did it actually change?
2. **Run the gates if you can.** `npx tsc --noEmit`, `npx eslint .`,
   `npx vitest run`. A green local run is evidence; a review that only reads
   is a guess.
3. **Check the architecture first.** Layer violations are the expensive
   findings; style is cheap.
4. **Cite evidence.** File and line for every Must fix; a rule name or a
   quoted contract for every finding. No line, no finding.
5. **Propose the smallest fix.** "Rewrite the component" is not a fix;
   "move the fetch to `useLeadDetail` and return `{ status, lead }`" is.
6. **Stop when the change is safe.** Do not manufacture findings to fill the
   template. An empty Should-fix section is a valid review.

## 5. Worked example

`examples/review-inventory.md` is a full review of a small inventory screen:
the buggy module, the findings in ranking order, and the fixed module. Read
it when you need the report's tone and depth. The short version: the screen
fetched inside the component, stored derived state, rendered a clickable
`div`, and swallowed the error; the review ranks the layer violation first,
then the a11y failure, then the state bug, and shows the ViewModel that
replaces all three.

## 6. Cross-skill contract

- `react-best-practices` defines the rules this review cites. When a finding
  and the skill disagree, the skill is the source and the finding is wrong.
- `react-port` produces the change; this review checks it before merge.
- The `lints/` config is the machine-checkable subset. A finding that the
  config can catch should be a config rule, not a review comment — open a
  rule proposal instead of repeating the comment.
