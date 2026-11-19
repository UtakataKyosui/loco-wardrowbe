import { createFileRoute } from "@tanstack/react-router";
import { ItemNew } from "../pages/ItemNew";

export const Route = createFileRoute("/closet/new")({
  head: () => ({ meta: [{ title: "アイテム追加 | Wardrowbe" }] }),
  component: ItemNew,
});
