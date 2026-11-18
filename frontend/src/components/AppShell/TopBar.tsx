import { Flex, Stack, Text } from "lism-css/react";
import { MaterialIcon } from "../MaterialIcon";

export function TopBar({ subLabel }: { subLabel: string }) {
  return (
    <Flex as="header" className="c--topBar" ai="center" jc="between" px="20">
      <Stack g="0">
        <Text ff="accent" fz="xl" lh="1" lts="s">
          KINFOLK
        </Text>
        <Text fz="2xs" tt="uppercase" lts="xl" c="text-2">
          {subLabel}
        </Text>
      </Stack>
      <Flex ai="center" g="10">
        <button type="button" className="c--iconBtn" aria-label="絞り込み">
          <MaterialIcon name="tune" />
        </button>
        <Flex
          ai="center"
          jc="center"
          w="32px"
          h="32px"
          bdrs="99"
          bgc="var(--surface-highest)"
          c="var(--on-surface-variant)"
          aria-label="プロフィール"
        >
          <MaterialIcon name="person" size={18} />
        </Flex>
      </Flex>
    </Flex>
  );
}
