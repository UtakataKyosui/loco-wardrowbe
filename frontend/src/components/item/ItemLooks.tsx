import { MaterialIcon } from "../MaterialIcon";
import type { MockItem } from "../../mocks/item";

export function ItemLooks({ looks }: { looks: MockItem["looks"] }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", marginBottom: 32 }}>
      <div className="c--itemRow" style={{ marginBottom: 12 }}>
        <h2 className="c--itemEyebrow" style={{ margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
          <MaterialIcon name="styler" size={18} style={{ color: "var(--accent)" }} />
          このアイテムを使ったルック ({looks.length + 1})
        </h2>
        <a href="/lookbook" className="c--itemLinkBtn" style={{ textDecoration: "none" }}>
          すべて見る
        </a>
      </div>
      <div className="c--itemLooks">
        {looks.map((l) => (
          <div key={l.id} className="c--itemLook">
            <div className="pic">
              <img alt={l.title} src={l.src} />
              <span className="c--itemGlass tag">着用 {l.worn}回</span>
            </div>
            <div style={{ padding: 10, display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 9, letterSpacing: "0.08em", color: "var(--accent)" }}>{l.no}</span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {l.title}
              </span>
              <span className="c--itemMicro" style={{ textTransform: "none", marginTop: 2 }}>
                {l.sub}
              </span>
            </div>
          </div>
        ))}
        <button type="button" className="c--itemLookCta">
          <span className="c--itemIconCircle" style={{ width: 40, height: 40, background: "var(--surface-lowest)", marginBottom: 8 }}>
            <MaterialIcon name="auto_fix_high" size={20} />
          </span>
          この服で
          <br />
          コーデを作る
          <span style={{ fontSize: 9, color: "var(--on-surface-variant)", fontWeight: 400 }}>キャンバスへ移動</span>
        </button>
      </div>
    </section>
  );
}
