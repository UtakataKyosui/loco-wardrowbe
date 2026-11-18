import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ApiClientError, post } from "../api/client";
import { AuthCard, AuthField } from "./AuthCard";

export function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    try {
      // `register` answers 200 with a null body whether or not the address was
      // already taken — deliberately, so the endpoint cannot be used to probe
      // for accounts. There is nothing to read back, and the success copy has
      // to stay neutral for the same reason.
      await post<null>("/api/auth/register", { name, email, password });
      setIsDone(true);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Failed to register",
      );
    } finally {
      setIsPending(false);
    }
  }

  if (isDone) {
    return (
      <AuthCard title="Check your email">
        <p className="c--authText">
          If that address is available, a verification link is on its way. You
          need to verify before you can log in.
        </p>
        <p className="c--authFooter">
          <Link to="/login">Back to log in</Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Sign up">
      <form className="c--authForm" onSubmit={handleSubmit}>
        <AuthField
          id="name"
          label="Name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={setName}
        />
        <AuthField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
        />
        <button className="c--authButton" type="submit" disabled={isPending}>
          {isPending ? "Signing up…" : "Sign up"}
        </button>
      </form>
      {error && (
        <p className="c--authAlert" role="alert">
          {error}
        </p>
      )}
      <p className="c--authFooter">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthCard>
  );
}
