export type NavItem = {
  to: "/closet" | "/lookbook" | "/builder" | "/calendar";
  label: string;
  icon: string;
  fab?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { to: "/closet", label: "クローゼット", icon: "checkroom" },
  { to: "/lookbook", label: "セットアップ", icon: "styler" },
  { to: "/builder", label: "コーデ作成", icon: "auto_fix_high", fab: true },
  { to: "/calendar", label: "カレンダー", icon: "calendar_today" },
];

/** Sub-label under "KINFOLK" per top-level screen. */
export const SCREEN_LABELS: Record<string, string> = {
  "/closet": "Closet",
  "/lookbook": "Setups",
  "/builder": "Builder",
  "/calendar": "Calendar",
};

/** Shell screens that are not part of the bottom navigation. */
const EXTRA_SCREENS: Record<string, string> = { "/account": "Account" };

const matches = (pathname: string, to: string) => pathname === to || pathname.startsWith(`${to}/`);

export function isShellPath(pathname: string): boolean {
  return (
    NAV_ITEMS.some((i) => matches(pathname, i.to)) ||
    Object.keys(EXTRA_SCREENS).some((to) => matches(pathname, to))
  );
}

export function screenLabel(pathname: string): string {
  const hit = NAV_ITEMS.find((i) => matches(pathname, i.to));
  if (hit) return SCREEN_LABELS[hit.to];
  const extra = Object.keys(EXTRA_SCREENS).find((to) => matches(pathname, to));
  return extra ? EXTRA_SCREENS[extra] : "";
}
