import { Container, Group } from "lism-css/react";
import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";

/**
 * Mobile-first shell for wardrobe screens: top bar + padded Container + floating bottom nav.
 * The Container makes Lism responsive props (container queries) work inside pages.
 */
export function AppShell({ subLabel, children }: { subLabel: string; children: ReactNode }) {
  return (
    <Container
      isContainer
      w="100%"
      max-w="28rem"
      mx="auto"
      style={{ minHeight: "100dvh", background: "var(--surface)" }}
    >
      <TopBar subLabel={subLabel} />
      <Group as="main" px="20" pb="70" pt="10">
        {children}
      </Group>
      <BottomNav />
    </Container>
  );
}
