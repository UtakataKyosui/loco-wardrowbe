import { Link, useRouterState } from "@tanstack/react-router";
import { Flex } from "lism-css/react";
import { MaterialIcon } from "../MaterialIcon";
import { NAV_ITEMS } from "./nav";

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Flex
      as="nav"
      className="c--bottomNav"
      aria-label="メインナビゲーション"
      ai="center"
      jc="around"
      px="10"
    >
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
        return (
          <Link
            key={item.to}
            to={item.to}
            className="c--navItem"
            data-active={active}
            aria-current={active ? "page" : undefined}
          >
            {item.fab ? (
              <span className="c--navFab">
                <MaterialIcon name={item.icon} size={18} filled />
              </span>
            ) : (
              <MaterialIcon name={item.icon} size={22} filled={active} />
            )}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </Flex>
  );
}
