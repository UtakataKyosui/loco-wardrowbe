import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { verify } from "../api/generated/auth/auth";
import { AuthAlert, AuthCard, AuthStatus } from "./AuthCard";
import { takeTokenFromHash } from "./tokenFromHash";

type State = { kind: "pending" } | { kind: "verified" } | { kind: "failed"; message: string };

/** Landing page of the e-mail verification link (`/verify#<token>`). */
export function Verify() {
  const [state, setState] = useState<State>({ kind: "pending" });
  // The effect runs twice under StrictMode in development; the token is
  // read (and removed from the URL) only once.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const token = takeTokenFromHash();
    if (token === null) {
      setState({ kind: "failed", message: "This link is missing its token." });
      return;
    }
    verify({ token })
      .then((res) => {
        setState(
          res.status === 204
            ? { kind: "verified" }
            : {
                kind: "failed",
                message: "This link is invalid or has already been used.",
              },
        );
      })
      .catch(() => {
        setState({ kind: "failed", message: "Could not reach the server." });
      });
  }, []);

  return (
    <AuthCard title="Verify your email">
      <AuthStatus busy={state.kind === "pending"}>
        {state.kind === "pending" && <p className="c--authText">Verifying…</p>}
        {state.kind === "verified" && (
          <p className="c--authText">Your email address is verified.</p>
        )}
      </AuthStatus>
      <AuthAlert message={state.kind === "failed" ? state.message : null} />
      {state.kind === "verified" && (
        <p className="c--authFooter">
          <Link to="/login">Log in</Link>
        </p>
      )}
    </AuthCard>
  );
}
