import type { CSSProperties } from "react";

type Props = {
  name: string;
  filled?: boolean;
  size?: number;
  className?: string;
  style?: CSSProperties;
  /** Accessible name. Omit for decorative icons (the default, aria-hidden). */
  label?: string;
};

/** Material Symbols Outlined glyph (font loaded in __root.tsx). Decorative by default. */
export function MaterialIcon({ name, filled, size = 22, className, style, label }: Props) {
  return (
    <span
      translate="no"
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      className={["c--icon", filled ? "is-fill" : "", className].filter(Boolean).join(" ")}
      style={{ fontSize: size, ...style }}
    >
      {name}
    </span>
  );
}
