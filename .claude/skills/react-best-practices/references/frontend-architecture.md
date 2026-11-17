# Frontend architecture contract

The layer contract from the facta frontend handbook, reduced to what a React
project must keep. It is enforced by `lints/eslint.config.mjs`; this file
explains why each wall exists.

## 1. The layers

```text
View (platform UI)  ──►  ViewModel (hook, shared)  ──►  SDK (shared)  ──►  Backend API
      ▲                        │                            │
      └──── state + events ────┘                            └── ports: TokenStore,
                                └── ports: Navigator,           Transport, Clock
                                    Notifier, Permissions
```

| Layer | Responsibility | May import | Must not import |
|---|---|---|---|
| **View** | Render JSX, forward events, layout, styling, a11y | Its feature's ViewModel hook, the UI kit, rendering platform APIs | The SDK, HTTP, tokens, business rules, router internals, other features' internals |
| **ViewModel** | Presentation state, derived values, form state, commands, orchestration of SDK calls, loading/error states | The SDK, ports, shared domain types, React hooks | JSX, `react-dom`, `react-native`, `chrome.*`, router libraries, views |
| **SDK** | Typed API client, DTOs, error normalization, auth/tenant headers, pagination, retries | Ports and types | React, any UI, any platform API |
| **Core** | Ports and pure types: route builders, error types, permission helpers | Nothing | Everything else |

The walls are not style. A View that calls the SDK cannot be tested without a
network, cannot be reused by another renderer, and hides the loading/error
state the user needs. A ViewModel that imports `react-dom` cannot run in a
Chrome extension or React Native. An SDK that imports React cannot be used by
a CLI or a test runner.

## 2. Feature folders

One feature = one backend slice. The feature name is the same in:

- the frontend folder: `src/features/<feature>/`;
- the route module: `/api/v1/{userType}/<feature>/...`;
- the SDK module: `sdk.{userType}.<feature>.<resource>`;
- the permission prefix: `<feature>.<resource>.<action>`.

A feature owns its views, its ViewModel hook, its route definitions, and its
tests. It never imports another feature's views, ViewModel or internals. When
two features need the same thing, it moves to `lib/` (pure) or `ui/` (shared
components) — not into one feature and imported by the other.

## 3. The ViewModel contract

A ViewModel exposes:

- **state** — one discriminated union for the screen, plus the data it
  renders;
- **commands** — `refresh`, `save`, `remove`, `retry`; each returns a result
  or updates the state, never throws for an expected failure;
- **derived values** — computed, not stored;
- **ports** — injected, never imported as a singleton.

```tsx
export type LeadsState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "ready"; rows: Lead[] }
  | { status: "forbidden"; requiredPermission?: string }
  | { status: "error"; correlationId?: string };

export interface LeadsViewModel {
  readonly state: LeadsState;
  refresh(): Promise<void>;
  remove(id: LeadId): Promise<void>;
}
```

The React adapter is a hook:

```tsx
export function useLeads(): LeadsViewModel {
  // binds the pure ViewModel to React; no business rule lives here
}
```

The pure ViewModel is testable without React; the hook only subscribes and
schedules.

## 4. The SDK contract

- Namespace mirrors the URL contract: `sdk.{userType}.{module}.{resource}`.
- Methods: `list`, `get`, `create`, `update`, `delete`, plus verb methods for
  state transitions (`suspend`, `launch`).
- The SDK normalizes HTTP into the shared error envelope; it never throws a
  string and never returns `any`.
- Auth, tenant, correlation, idempotency and client-info headers are
  interceptors, not per-call code.
- Pagination is cursor-based and exposed as an async iterable or a
  `{ items, nextCursor }` page; the ViewModel decides how much to load.

## 5. Routes and permissions

- Routes mirror the URL playbook; the `{userType}` segment is an experience
  namespace, never a security decision.
- A route guard hides or redirects for UX; the API rejects the request
  regardless of what the client renders.
- A guard's redirect is one-shot. A redirect that re-navigates on every
  render (TanStack Router's `<Navigate>` re-fires because its props object is
  new each render) starts a navigation that supersedes the pending one before
  it commits, so a route whose chunk is loading never renders and the tab
  freezes; React Router's `Navigate` fires once per mount unless the path or
  `state` identity changes. Redirect in `beforeLoad`/loader where the decision
  allows it; when it needs React state, navigate in an effect behind a ref so
  it runs exactly once.
- A permission is checked to shape the UI (`can("leads.delete")`); the
  backend is the authority.
- Deep links and URLs are parsed with a schema; an unknown route renders a
  not-found screen, not a crash.

## 6. Errors and observability

- The error envelope is `{ error: { code, message, requiredPermission?,
  correlationId } }`; the SDK normalizes it into a typed union.
- The ViewModel maps each code to a screen state: `unauthenticated` →
  re-auth, `forbidden` → forbidden, `notFound` → not-found, `conflict` →
  refresh, `validation` → field errors, `rateLimited` → retry with
  `Retry-After`, `network`/`server` → retryable error.
- The correlation id is shown (copyable) on the error screen; logs and traces
  carry it.
- A client error is reported without personal data; no token, no payload.

## 7. Testing the layers

- **Core/ViewModel/SDK:** plain Vitest unit tests; no DOM, no network.
- **View:** React Testing Library with MSW at the network boundary; query by
  role/label, assert user-visible behavior.
- **Feature:** one test per screen state (loading, empty, error, forbidden,
  ready), one per form failure, one per critical interaction.
- **E2E:** Playwright for journeys that cross pages; a thin suite, not a
  second component suite.

## 8. The enforcement map

| Rule | Where |
|---|---|
| View does not import the SDK | `no-restricted-imports` override for `**/views/**` and `**/app/**` |
| ViewModel does not import a rendering platform | `no-restricted-imports` for `**/viewmodels/**`: `react-dom`, `react-native`, `chrome` |
| SDK does not import React | `no-restricted-imports` for `**/sdk/**`: `react`, `react-dom`, `react-native` |
| Hooks rules | `react-hooks/rules-of-hooks`, `react-hooks/exhaustive-deps` |
| Accessible controls | `jsx-a11y/alt-text`, `jsx-a11y/anchor-is-valid` |
| No silenced types | `@typescript-eslint/ban-ts-comment` |
| No unlimited disables | `@eslint-community/eslint-comments/*` |

- **A boundary gate is code and needs a failing fixture.** A custom regex gate
  anchored at the bare package name (`^pkg$`) lets `pkg/subpath` through
  silently: ban the prefix there (`^pkg(\/|$)`). An ESLint
  `no-restricted-imports` `group` pattern is gitignore-style, not regex: a
  bare `pkg` already covers `pkg/subpath` (keep that one entry), while the
  exact `paths` form and a `^pkg$` regex do not. Prove the gate with a
  deliberate violation in `lints/check/src` that imports a subpath specifier
  and carries `// expect:no-restricted-imports`.

When a change needs an exception, re-cut the layout; do not add a path to the
exception list. A config exception is a contract change and needs the same
review as the code.
