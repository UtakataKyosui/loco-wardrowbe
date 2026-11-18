import { createFileRoute } from "@tanstack/react-router";
import { Home } from "../pages/Home";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "ホーム | Wardrowbe" }] }),
  component: Home,
});
