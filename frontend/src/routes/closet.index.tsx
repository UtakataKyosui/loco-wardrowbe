import { createFileRoute } from "@tanstack/react-router";
import { Closet } from "../pages/Closet";

export const Route = createFileRoute("/closet/")({
  head: () => ({ meta: [{ title: "クローゼット | Wardrowbe" }] }),
  component: Closet,
});
