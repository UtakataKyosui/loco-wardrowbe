import { Alert, Button, Field, Input, Spinner } from "@utakata-ui/react";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import "./auth.css";

interface AuthCardProps {
  title: string;
  children: ReactNode;
}

export function AuthCard({ title, children }: AuthCardProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  // When the card swaps to a new state (e.g. "Check your email"), move focus
  // to the new heading so keyboard and screen reader users notice the change.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [title]);

  return (
    <main id="main" tabIndex={-1} className="c--authPage" lang="en">
      <div className="c--authCard">
        <div>
          <p className="c--authBrand">Kinfolk</p>
          <h1 ref={headingRef} tabIndex={-1} className="c--authTitle">
            {title}
          </h1>
        </div>
        {children}
      </div>
    </main>
  );
}

interface AuthFieldProps {
  id: string;
  label: string;
  type: "text" | "email" | "password";
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function AuthField({
  id,
  label,
  type,
  autoComplete,
  value,
  onChange,
  error,
}: AuthFieldProps) {
  const isEmail = type === "email";
  return (
    <Field.Root name={id} invalid={Boolean(error)}>
      <Field.Label>{label}</Field.Label>
      <Input
        size="lg"
        type={type}
        autoComplete={autoComplete}
        inputMode={isEmail ? "email" : undefined}
        autoCapitalize={type === "text" ? undefined : "none"}
        spellCheck={type === "text" ? undefined : false}
        required
        value={value}
        onValueChange={onChange}
      />
      {error && <Field.Error>{error}</Field.Error>}
    </Field.Root>
  );
}

/** Persistent live region: it exists before the message does, so screen readers announce it. */
export function AuthAlert({ message }: { message: string | null }) {
  return (
    <div className="c--authAlertRegion" role="alert">
      {message && (
        <Alert.Root variant="destructive">
          <Alert.Description>{message}</Alert.Description>
        </Alert.Root>
      )}
    </div>
  );
}

/** Persistent polite status region for progress text; `busy` marks work in progress. */
export function AuthStatus({ busy, children }: { busy?: boolean; children?: ReactNode }) {
  return (
    <div className="c--authStatus" role="status" aria-busy={busy || undefined}>
      {busy && <Spinner size="sm" decorative />}
      {children}
    </div>
  );
}

interface AuthSubmitProps {
  isPending: boolean;
  idleLabel: string;
  pendingLabel: string;
}

export function AuthSubmit({ isPending, idleLabel, pendingLabel }: AuthSubmitProps) {
  return (
    <>
      <Button
        type="submit"
        variant="solid"
        size="lg"
        w="100%"
        disabled={isPending}
        focusableWhenDisabled
        aria-busy={isPending || undefined}
      >
        {isPending && <Spinner size="sm" decorative />}
        {isPending ? pendingLabel : idleLabel}
      </Button>
      <span className="u-visually-hidden" role="status">
        {isPending ? pendingLabel : ""}
      </span>
    </>
  );
}
