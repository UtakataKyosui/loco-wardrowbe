import { createFileRoute } from "@tanstack/react-router";
import { MagicLink } from "../auth/MagicLink";

export const Route = createFileRoute("/magic-link")({
  head: () => ({ meta: [{ title: "マジックリンク | Wardrowbe" }] }),
  component: MagicLink,
});
