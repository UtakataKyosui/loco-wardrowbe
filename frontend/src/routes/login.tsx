import { createFileRoute } from "@tanstack/react-router";
import { Login } from "../auth/Login";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "ログイン | Wardrowbe" }] }),
  component: Login,
});
