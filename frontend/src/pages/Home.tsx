import { Link, Navigate } from "@tanstack/react-router";
import { Group, Heading, Stack, Text } from "lism-css/react";
import { useIsAuthenticated } from "../auth/useIsAuthenticated";

export function Home() {
  const isAuthenticated = useIsAuthenticated();

  if (isAuthenticated) {
    return <Navigate to="/closet" replace />;
  }

  return (
    <Group as="main" id="main" tabIndex={-1} lang="en" p="30">
      <Stack g="20" ai="center">
        <Heading level="1" ff="accent" fz="3xl">
          KINFOLK
        </Heading>
        <Text>
          <Link to="/login">Log in</Link> or <Link to="/register">sign up</Link> to get started.
        </Text>
      </Stack>
    </Group>
  );
}
