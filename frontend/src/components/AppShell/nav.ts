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

export function isShellPath(pathname: string): boolean {
  return NAV_ITEMS.some((i) => pathname === i.to || pathname.startsWith(`${i.to}/`));
}

export function screenLabel(pathname: string): string {
  const hit = NAV_ITEMS.find((i) => pathname === i.to || pathname.startsWith(`${i.to}/`));
  return hit ? SCREEN_LABELS[hit.to] : "";
}
