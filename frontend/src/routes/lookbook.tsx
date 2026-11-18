import { createFileRoute } from "@tanstack/react-router";
import { Lookbook } from "../pages/Lookbook";

export const Route = createFileRoute("/lookbook")({
  component: Lookbook,
});
