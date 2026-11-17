# React 19 digest

The parts of the React 19 API that change how a component is written. The
full documentation is the source; this is the review checklist.

## 1. Actions and forms

An **Action** is an async function passed to a form's `action` prop or called
inside a transition. React tracks its pending state and errors.

```tsx
async function saveLead(formData: FormData) {
  "use server"; // only in a Server Components setup
  await sdk.app.funnels.leads.update(String(formData.get("id")), {
    name: String(formData.get("name")),
  });
}
```

- `<form action={saveLead}>` resets the form after a successful action and
  shows the pending state via `useFormStatus` in a child.
- `useActionState(action, initialState)` returns `[state, formAction,
  isPending]`; the action receives `(previousState, formData)`. Use it for
  validation messages and optimistic results.
- `useOptimistic(initial, update)` renders an optimistic value while an
  Action is pending; the value snaps back when the action settles. The
  rollback path is the point — do not use it for a mutation that cannot fail
  visibly.
- `useFormStatus()` must be called from a component **inside** the form, not
  from the component that renders the form.

## 2. `use`

`use(promise)` reads a promise during render; the component suspends until it
resolves. `use(context)` reads context conditionally (unlike `useContext`).

- A promise passed to `use` must be stable across renders; creating it in
  render re-suspends forever. Create it in the parent, a cache, or the
  ViewModel.
- `use` does not replace a query layer: no cancellation, no revalidation, no
  cache key. Use it at a Suspense boundary with a stable promise, or use a
  query library.

## 3. Ref as a prop

React 19 passes `ref` as a normal prop to function components; `forwardRef`
is no longer required (it still works for compatibility).

```tsx
function SearchInput({ ref, ...props }: React.ComponentProps<"input">) {
  return <input ref={ref} {...props} />;
}
```

- The ref callback can return a cleanup function; React calls it when the
  element detaches.
- `useRef` still requires an initial value in TypeScript: `useRef<HTMLInputElement>(null)`.

## 4. Context as provider

`<Context value={...}>` replaces `<Context.Provider value={...}>`. The old
form still works. The rules are unchanged: context is dependency injection,
not a global store; split unrelated values into separate contexts.

## 5. Document metadata and resources

React 19 hoists `<title>`, `<meta>`, `<link>` and `<script>` rendered in a
component into the document head.

- A route component can render its own `<title>`; the deepest render wins.
- `<link rel="stylesheet" precedence="...">` lets React deduplicate and order
  stylesheets; `<link rel="preload" as="image">` and `preinit`/`preload`
  APIs warm resources.
- Do not render a `<script>` with `dangerouslySetInnerHTML` unless the
  content is trusted; the same trust boundary as any HTML injection.

## 6. Error handling

- `createRoot(container, { onUncaughtError, onCaughtError })` centralizes
  reporting. An error boundary still catches render errors in its subtree.
- A rejected Action calls the nearest error boundary; the form's pending
  state clears. Design the boundary's fallback per route, not one global
  "Something went wrong".
- Errors thrown in an event handler are **not** caught by an error boundary;
  handle them in the handler or the ViewModel.

## 7. Suspense and transitions

- `useTransition` returns `[isPending, startTransition]`; the update inside
  is non-urgent and does not block typing.
- `useDeferredValue(value)` renders a stale value while the new one is
  prepared; use it for an expensive list, not for a network call.
- Suspense boundaries should match the user's mental model: a route, a
  widget, a sidebar — not a boundary around every component.

## 8. Removed or discouraged in 19

- `propTypes` and `defaultProps` on function components: use TypeScript and
  default parameters.
- String refs and legacy context: removed.
- `ReactDOM.render` / `ReactDOM.hydrate`: use `createRoot` / `hydrateRoot`.
- `findDOMNode`: use a ref.
- `forwardRef`: not needed for new code; keep it only where a library
  requires it.

## 9. Server Components

Server Components are a framework feature (Next.js App Router, React Router
RSC, or a custom bundler), not a browser-only React feature. When the project
uses them:

- A `"use client"` directive marks the boundary; a client component cannot
  import a server-only module.
- Data fetching on the server does not need an effect or a query hook.
- Secrets stay on the server; a client component must never receive them.
- The ViewModel still exists on the client for interaction; the server
  component is the data-loading layer.

## 10. The review questions

1. Is this state or derived data? If derived, compute it in render.
2. Is this effect synchronizing with an external system? If not, delete it.
3. Is the list key stable and tied to identity?
4. Is every state rendered, including error and empty?
5. Is the interactive element a real button/link with a name and keyboard
   behavior?
6. Does the layer boundary still hold: View → ViewModel → SDK?
7. Would this component survive a re-render with new props, a strict-mode
   double effect, and a slow network?
