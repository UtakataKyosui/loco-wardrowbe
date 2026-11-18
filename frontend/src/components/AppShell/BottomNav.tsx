import { Link, useRouterState } from "@tanstack/react-router";
import { MaterialIcon } from "../MaterialIcon";
import { NAV_ITEMS } from "./nav";

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="c--bottomNav" aria-label="メインナビゲーション">
      <ul className="c--bottomNavList">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
          return (
            <li key={item.to}>
              <Link
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
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
