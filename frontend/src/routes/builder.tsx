import { createFileRoute } from "@tanstack/react-router";
import { Builder } from "../pages/Builder";

export const Route = createFileRoute("/builder")({
  component: Builder,
});
