import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { verify } from "../api/generated/auth/auth";
import { takeTokenFromHash } from "./tokenFromHash";

type State =
  | { kind: "pending" }
  | { kind: "verified" }
  | { kind: "failed"; message: string };

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
    <div>
      <h1>Verify your email</h1>
      {state.kind === "pending" && <p>Verifying…</p>}
      {state.kind === "verified" && (
        <>
          <p>Your email address is verified.</p>
          <p>
            <Link to="/login">Log in</Link>
          </p>
        </>
      )}
      {state.kind === "failed" && <p role="alert">{state.message}</p>}
    </div>
  );
}
