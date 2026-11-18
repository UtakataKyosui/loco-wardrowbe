import { createFileRoute } from "@tanstack/react-router";
import { ItemDetail } from "../pages/ItemDetail";

export const Route = createFileRoute("/closet/$itemId")({
  head: () => ({ meta: [{ title: "アイテム詳細 | Wardrowbe" }] }),
  component: ItemDetail,
});
