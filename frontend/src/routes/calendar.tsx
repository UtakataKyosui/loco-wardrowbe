import { createFileRoute } from "@tanstack/react-router";
import { Calendar } from "../pages/Calendar";

export const Route = createFileRoute("/calendar")({
  head: () => ({ meta: [{ title: "カレンダー | Wardrowbe" }] }),
  component: Calendar,
});
