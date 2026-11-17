import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { magicLinkVerify } from "../api/generated/auth/auth";
import { setToken } from "./token";
import { takeTokenFromHash } from "./tokenFromHash";

/** Landing page of the magic link (`/magic-link#<token>`): signs the user in. */
export function MagicLink() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  // The token is single-use, so it must be redeemed exactly once even though
  // the effect runs twice under StrictMode in development.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const token = takeTokenFromHash();
    if (token === null) {
      setError("This link is missing its token.");
      return;
    }
    magicLinkVerify({ token })
      .then((res) => {
        if (res.status === 200) {
          setToken(res.data.token);
          void navigate({ to: "/" });
        } else {
          setError("This link is invalid or has expired.");
        }
      })
      .catch(() => {
        setError("Could not reach the server.");
      });
  }, [navigate]);

  return (
    <div>
      <h1>Signing you in</h1>
      {error === null ? (
        <p>One moment…</p>
      ) : (
        <>
          <p role="alert">{error}</p>
          <p>
            <Link to="/login">Back to log in</Link>
          </p>
        </>
      )}
    </div>
  );
}
