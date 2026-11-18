import { createFileRoute } from "@tanstack/react-router";
import { Register } from "../auth/Register";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "新規登録 | Wardrowbe" }] }),
  component: Register,
});
