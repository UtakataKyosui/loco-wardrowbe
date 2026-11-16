import { createFileRoute } from "@tanstack/react-router";
import { Stack } from "lism-css/react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <Stack g="20" p="30">
      <h1>Wardrowbe</h1>
    </Stack>
  );
}
