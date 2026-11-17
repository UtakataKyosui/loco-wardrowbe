# React patterns that survived

Patterns the React community converged on, with the failure mode each one
prevents. None of them is mandatory; each is a tool for a specific shape of
problem.

## 1. Composition over configuration

A component with `renderHeader`, `renderFooter`, `headerIcon`, `headerColor`
and `headerAlign` is a component that should accept `header={<Header />}` or
`children`.

```tsx
<Card>
  <Card.Header><h2>Leads</h2></Card.Header>
  <Card.Body>{rows}</Card.Body>
</Card>
```

Compound components (`Tabs`, `Tabs.List`, `Tabs.Panel`) share state through
context; the caller composes the structure. The failure mode: an option bag
that grows one boolean per caller.

## 2. Controlled and uncontrolled components

- **Controlled:** the owner holds the value (`value` + `onChange`). The
  source of truth is one place; validation and reset are explicit.
- **Uncontrolled:** the DOM holds the value (`defaultValue`); read it with a
  ref or a form action. Use it for a large form where every keystroke does
  not need a render.
- Never mix: a `value` that sometimes comes from props and sometimes from
  local state produces a field the user cannot type in.

## 3. Custom hooks extract behavior

A custom hook returns data and commands, not JSX.

```tsx
function useLeadDetail(id: LeadId) {
  const query = useQuery({
    queryKey: ["leads", id],
    queryFn: ({ signal }) => sdk.app.funnels.leads.get(id, { signal }),
  });
  return {
    status: query.isPending ? "loading" : query.isError ? "error" : "ready",
    lead: query.data ?? null,
    retry: query.refetch,
  };
}
```

The hook is the ViewModel when the feature is small; when it grows, move the
logic to a plain TypeScript ViewModel and keep the hook as the adapter that
binds it to React.

## 4. State machines for screens

A screen is a state machine. Model it as one discriminated union, not as
independent booleans.

```tsx
type ScreenState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "ready"; rows: Row[] }
  | { status: "forbidden"; requiredPermission?: string }
  | { status: "error"; correlationId?: string };
```

A `switch` over `status` is exhaustive; adding a state is a compile error
until every renderer handles it. The failure mode: `isLoading && !error &&
rows.length > 0` combinations nobody can enumerate.

## 5. URL as state

Filters, tabs, sort, page and selected id belong in the URL when the screen
should survive refresh, back/forward, and sharing.

- Read typed params from the router, not `window.location`.
- Serialize with a schema (zod) at the route boundary; an invalid query string
  falls back to defaults and is corrected in the URL.
- A local UI toggle (a dropdown open) is not URL state.
- A route guard's redirect is routing behavior, not URL state; the one-shot
  rule and its failure mode live in `references/frontend-architecture.md` §5
  (Routes and permissions).

## 6. Query keys are cache identity

A query key must be stable, serializable, and contain every input the query
depends on.

```tsx
queryKey: ["leads", tenantId, { cursor, search }]
```

- An object with a new identity every render is not a new key if it
  serializes the same; a key that omits `search` serves the wrong cache entry.
- **One key, one shape, one argument set.** Never share a key between a
  single-page query and an infinite query, or between two fetches that differ
  in page size, scope or limit: the entry written by one is read as the data
  of the other. The infinite observer receives a plain page where it expects
  `{ pages, pageParams }`, so the view that reads `data.pages` throws; the
  single-page observer receives `InfiniteData` and renders the wrong rows.
  Give each read its own key and keep a shared prefix for invalidation, e.g.
  `["leads"]`, `["leads", "list"]`, `["leads", "dashboard"]`.
- Invalidate by prefix (`["leads"]`) after a mutation; do not refetch the
  world.
- Server state belongs in the query cache, not in `useState` copied from it.

## 7. Optimistic updates with a rollback

1. Cancel the in-flight query for the affected key.
2. Snapshot the previous cache value.
3. Write the optimistic value.
4. Send the mutation.
5. On success, write the server's answer; on failure, restore the snapshot
   and show the error.

Without step 2 and 5 it is not optimistic, it is data loss with a spinner.

## 8. Error boundaries per route

An error boundary catches render errors in its subtree and renders a
fallback. Place one at each route (and around a risky widget); a single global
boundary turns one broken widget into a blank app.

- The fallback offers a retry and a way back.
- Report the error with its `correlationId`; never show a stack trace.
- An event-handler error is not caught; handle it where it happens.

## 9. Portals for overlays

A modal, tooltip or toast renders through a portal to keep stacking contexts
and overflow hidden from breaking it. Focus management is still the
component's job: trap focus, restore it on close, close on Escape, and label
the dialog.

## 10. Performance patterns

- **Split at routes.** `React.lazy` + `Suspense` per route; a heavy editor is
  its own chunk.
- **Virtualize long lists.** Render a window, not 10k rows.
- **Keep state close.** A state change re-renders its owner and subtree;
  moving state down is the cheapest optimization.
- **Memoize after measuring.** `memo`/`useMemo`/`useCallback` are for
  measured costs and stable identities, not for every function.
- **Batch and transition.** `startTransition` for a non-urgent update;
  `useDeferredValue` for an expensive render; never to hide a slow network.
- **Avoid layout thrash.** Read layout once, write once; use CSS transforms
  for animation.

## 11. Testing patterns

- Query by role, label and text; assert what the user sees.
- Mock the network with MSW, not the SDK module.
- One test per screen state; one per form failure; one per critical journey.
- Test the redirect boot path: land on the guarded URL with the real router
  and assert the role home renders. A redirect that only works when the target
  is already cached passes manual clicks and freezes the first load.
- `findBy*` for async; no arbitrary sleeps; no `act()` warnings.
- A golden snapshot is reviewed like code.

## 12. The failure modes to recognize

| Smell | The pattern that replaces it |
|---|---|
| `useEffect` + `setState` mirroring a prop | derived value during render |
| Three booleans for one screen | one discriminated union |
| `useEffect` fetch with no abort | query layer or `AbortController` + cleanup |
| A clickable `div` | `<button>` with a name and keyboard behavior |
| Prop drilling five levels | lift state or context for dependency injection |
| A global store for one modal | local state |
| `memo` everywhere | measure, then memoize the hot subtree |
| `key={index}` on a reorderable list | stable id |
| A form that disables submit instead of validating | field errors + summary |
| A test asserting a hook call count | a test asserting user-visible behavior |
