# TypeScript strict for React

The tsconfig set and the type patterns that make React code hard to break.
The point is not "more types"; it is that invalid states fail to compile.

## 1. The strict set

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ES2022",
    "jsx": "react-jsx",
    "skipLibCheck": true
  }
}
```

- `noUncheckedIndexedAccess` turns `rows[0]` into `Row | undefined`; the
  compiler forces the check the UI needs anyway.
- `exactOptionalPropertyTypes` distinguishes `{ x?: string }` from `{ x:
  string | undefined }`; a prop that is optional is not the same as one that
  can be explicitly `undefined`.
- `verbatimModuleSyntax` makes `import type` explicit; the bundler can drop
  type-only imports without guessing.
- `moduleResolution: "bundler"` matches Vite, Next.js and modern tooling; use
  `NodeNext` only for a Node package.

## 2. Discriminated unions

```ts
type AppError = { code: string; correlationId?: string };

type LoadState<T> =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "ready"; data: T }
  | { status: "error"; error: AppError };
```

- A literal `status` (or `kind`) is the discriminant; narrow with `switch`.
- Every switch is exhaustive: `default: { const _never: never = state; }`
  or `satisfies never`. A new variant is a compile error, not a silent
  no-op.
- Never model one state with independent booleans (`isLoading`, `isError`,
  `isEmpty`); the combinations that cannot happen still compile.

## 3. Branded ids

```tsx
type Brand<T, B extends string> = T & { readonly __brand: B };
type LeadId = Brand<string, "LeadId">;
type TenantId = Brand<string, "TenantId">;

const asLeadId = (raw: string): LeadId => raw as LeadId; // one constructor, at the boundary
```

A function that takes `LeadId` cannot receive a `TenantId` or a raw string.
Brand at the parse boundary (the SDK response or the route param), not in
every component.

## 4. Props

- Type props as an object type, not an interface with an index signature.
- Extend the intrinsic element when wrapping one:
  `React.ComponentProps<"button">` (React 19 includes `ref`).
- `children: React.ReactNode` unless the component requires a single element
  (`React.ReactElement`) or a render function.
- A discriminated union of props for variants is better than ten optional
  booleans:

```tsx
type AlertProps =
  | { tone: "info" | "success"; title: string }
  | { tone: "error"; title: string; correlationId: string };
```

- Do not use `React.FC`; it adds an implicit `children` and weakens the
  return type. A function component is `function Card(props: CardProps)`.

## 5. Generics and inference

- Let inference work; annotate the boundary (exported functions, SDK methods,
  context values), not every local.
- `satisfies` checks a value against a type without widening it:
  `const routes = { ... } satisfies Record<RouteName, RouteDef>` keeps the
  literal keys while proving completeness.
- `as const` for literal tables (route names, query keys); it is not a cast.
- `as` is a boundary tool. Every `as` needs a comment naming the invariant
  the compiler cannot see; `as unknown as X` is a lint-level finding.

## 6. Async and promises

- An async function returns `Promise<T>`; an event handler that returns a
  promise is a floating promise unless the caller awaits it. Use
  `void handler()` only when the rejection is handled inside.
- `no-floating-promises` and `no-misused-promises` are the enforcement; do
  not disable them to pass a handler to `onClick`.
- Model failure as a value (`Result<T, E>`) in the ViewModel; reserve
  exceptions for programmer errors and cancellation.

## 7. The API boundary

- Parse external data once: zod (or a generated schema) at the SDK response
  and at the route param. Inside the app, the type is trusted.
- `unknown` at the boundary, never `any`; narrow with a schema or a type
  guard.
- A DTO is not a view model: map it in the SDK or the ViewModel, not in JSX.

## 8. Type-level review questions

1. Could this state be a union instead of booleans?
2. Is every switch exhaustive?
3. Is this `as` justified and commented?
4. Is the id branded, or can a raw string stand in?
5. Does an optional prop mean "absent" or "explicitly undefined"?
6. Is the external data parsed once, or trusted everywhere?
7. Does the type survive `noUncheckedIndexedAccess`?
