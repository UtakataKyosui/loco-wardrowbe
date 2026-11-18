import type { CSSProperties } from "react";

type Props = {
  name: string;
  filled?: boolean;
  size?: number;
  className?: string;
  style?: CSSProperties;
};

/** Material Symbols Outlined glyph (font loaded in __root.tsx). Decorative by default. */
export function MaterialIcon({ name, filled, size = 22, className, style }: Props) {
  return (
    <span
      aria-hidden="true"
      className={["c--icon", filled ? "is-fill" : "", className].filter(Boolean).join(" ")}
      style={{ fontSize: size, ...style }}
    >
      {name}
    </span>
  );
}
