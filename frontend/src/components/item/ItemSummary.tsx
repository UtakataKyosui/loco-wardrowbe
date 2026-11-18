import { Flex, Heading, Text } from "lism-css/react";
import { MaterialIcon } from "../MaterialIcon";
import type { MockItem } from "../../mocks/item";

const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

export function ItemSummary({ item }: { item: MockItem }) {
  const cpw = Math.round(item.price / item.wearCount);
  return (
    <>
      <Flex fxd="column" mb="30" as="section">
        <Flex ai="baseline" jc="between" mb="5">
          <span className="c--itemEyebrow" style={{ color: "var(--accent)" }}>
            {item.capsule}
          </span>
          <Text fz="2xs" c="text-2">
            ARCHIVE ID: {item.archiveId}
          </Text>
        </Flex>
        <Flex ai="center" jc="between">
          <Heading level="1" ff="accent" fz="xl" fw="500" c="var(--primary)">
            {item.brand}
          </Heading>
          <button type="button" className="c--itemLinkBtn">
            <MaterialIcon name="edit" size={14} />
            変更
          </button>
        </Flex>
        <Text fz="s" c="text-2" mt="5" lts="s">
          {item.name}
        </Text>
        <Flex fxw="wrap" g="10" mt="15">
          <span className="c--itemChip">
            <span className="c--itemDot" style={{ background: item.colorHex }} />
            {item.colorLabel}
          </span>
          <span className="c--itemChip">{item.size}</span>
          <span className="c--itemChip">{item.categoryChip}</span>
          <span className="c--itemChip is-accent">{item.material}</span>
        </Flex>
      </Flex>

      <section className="c--itemCard" style={{ padding: 16, marginBottom: 24 }}>
        <div className="c--itemRow" style={{ marginBottom: 12 }}>
          <span className="c--itemEyebrow" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <MaterialIcon name="analytics" size={18} style={{ color: "var(--accent)" }} />
            着用パフォーマンス
          </span>
          <span className="c--itemMicro" style={{ textTransform: "none" }}>
            今季高稼働
          </span>
        </div>
        <div className="c--itemStats">
          <div className="c--itemStat">
            <span className="c--itemMicro">総着用回数</span>
            <span style={{ marginTop: 4 }}>
              <span className="c--itemNum">{item.wearCount}</span>
              <span className="c--itemMicro"> 回</span>
            </span>
            <span style={{ fontSize: 9, marginTop: 4, color: "var(--accent)" }}>
              最終: {item.lastWorn}
            </span>
          </div>
          <div className="c--itemStat">
            <span className="c--itemMicro">着用単価 (CPW)</span>
            <span className="c--itemNum" style={{ marginTop: 4 }}>
              {yen(cpw)}
            </span>
            <span style={{ fontSize: 9, marginTop: 4, color: "var(--on-surface-variant)" }}>
              定価 {yen(item.price)}
            </span>
          </div>
          <div className="c--itemStat">
            <span className="c--itemMicro">活用効率</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 36 36"
                style={{ transform: "rotate(-90deg)" }}
                aria-hidden="true"
              >
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--surface-highest)" strokeWidth="4" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${item.efficiency}, 100`}
                />
              </svg>
              <span className="c--itemNum">
                {item.efficiency}
                <span style={{ fontSize: 10 }}>%</span>
              </span>
            </span>
            <span style={{ fontSize: 9, marginTop: 4, color: "var(--on-surface-variant)" }}>
              {item.efficiencyNote}
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
