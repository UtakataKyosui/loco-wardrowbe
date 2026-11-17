import { createFileRoute } from "@tanstack/react-router";
import { Verify } from "../auth/Verify";

export const Route = createFileRoute("/verify")({
  component: Verify,
});
