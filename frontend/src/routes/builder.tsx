import { createFileRoute } from "@tanstack/react-router";
import { Builder } from "../pages/Builder";

export const Route = createFileRoute("/builder")({
  head: () => ({ meta: [{ title: "コーデ作成 | Wardrowbe" }] }),
  component: Builder,
});
