import { createFileRoute } from "@tanstack/react-router";
import { Account } from "../pages/Account";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "アカウント設定 | Wardrowbe" }] }),
  component: Account,
});
