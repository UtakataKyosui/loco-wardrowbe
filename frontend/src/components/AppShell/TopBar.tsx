import type { CSSProperties } from "react";
import { Avatar, Button } from "@utakata-ui/react";
import { Flex, Stack, Text } from "lism-css/react";
import { useIsAuthenticated } from "../../auth/useIsAuthenticated";
import { useLogout } from "../../auth/useLogout";
import { MaterialIcon } from "../MaterialIcon";

export function TopBar({ subLabel }: { subLabel: string }) {
  const isAuthenticated = useIsAuthenticated();
  const handleLogout = useLogout();

  return (
    <Flex as="header" className="c--topBar" ai="center" jc="between" px="20">
      <Stack g="0">
        <Text ff="accent" fz="xl" lh="1" lts="s">
          KINFOLK
        </Text>
        <Text fz="2xs" tt="uppercase" lts="xl" c="text-2" lang="en">
          {subLabel}
        </Text>
      </Stack>
      <Flex ai="center" g="10">
        <Button
          type="button"
          variant="ghost"
          iconOnly
          square
          aria-label="絞り込み"
          style={{ "--ui-button-square-size": "44px", minHeight: "44px" } as CSSProperties}
        >
          <MaterialIcon name="tune" />
        </Button>
        {isAuthenticated && (
          <Button
            type="button"
            variant="ghost"
            iconOnly
            square
            aria-label="ログアウト"
            onClick={handleLogout}
            style={{ "--ui-button-square-size": "44px", minHeight: "44px" } as CSSProperties}
          >
            <MaterialIcon name="logout" />
          </Button>
        )}
        <Avatar.Root
          size="sm"
          role="img"
          aria-label="プロフィール"
          style={
            {
              "--ui-avatar-size": "32px",
              "--ui-avatar-background": "var(--surface-highest)",
            } as CSSProperties
          }
        >
          <Avatar.Fallback aria-hidden="true" style={{ color: "var(--on-surface-variant)" }}>
            <MaterialIcon name="person" size={18} />
          </Avatar.Fallback>
        </Avatar.Root>
      </Flex>
    </Flex>
  );
}
