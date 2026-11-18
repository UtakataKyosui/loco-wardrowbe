import { createFileRoute } from "@tanstack/react-router";
import { Verify } from "../auth/Verify";

export const Route = createFileRoute("/verify")({
  head: () => ({ meta: [{ title: "メール確認 | Wardrowbe" }] }),
  component: Verify,
});
