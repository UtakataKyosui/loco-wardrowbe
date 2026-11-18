import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ApiClientError, post } from "../api/client";
import { AuthAlert, AuthCard, AuthField, AuthSubmit } from "./AuthCard";
import { setToken } from "./token";

interface LoginResponse {
  token: string;
  pid: string;
  name: string;
  is_verified: boolean;
}

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    try {
      const res = await post<LoginResponse>("/api/auth/login", {
        email,
        password,
      });
      setToken(res.token);
      navigate({ to: "/" });
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Failed to log in",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AuthCard title="Log in">
      <form className="c--authForm" onSubmit={handleSubmit}>
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
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
        />
        <AuthAlert message={error} />
        <AuthSubmit isPending={isPending} idleLabel="Log in" pendingLabel="Logging in…" />
      </form>
      <p className="c--authFooter">
        Don&apos;t have an account? <Link to="/register">Sign up</Link>. You
        will need to verify your email before you can log in.
      </p>
    </AuthCard>
  );
}
