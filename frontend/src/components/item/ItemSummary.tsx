import { useId } from "react";
import { Button, Card, Flex, Heading, Text } from "@utakata-ui/react";
import { MaterialIcon } from "../MaterialIcon";
import type { MockItem } from "../../mocks/item";

const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

export function ItemSummary({ item }: { item: MockItem }) {
  const uid = useId();
  const cpw = item.wearCount > 0 ? Math.round(item.price / item.wearCount) : null;
  return (
    <>
      <Flex fxd="column" mb="30" as="section" aria-labelledby={`${uid}-title`}>
        <Flex ai="baseline" jc="between" mb="5">
          <span className="c--itemEyebrow" style={{ color: "var(--accent)" }}>
            {item.capsule}
          </span>
          <Text fz="2xs" c="text-2" className="c--itemMicro" style={{ textTransform: "none" }}>
            ARCHIVE ID: {item.archiveId}
          </Text>
        </Flex>
        <Flex ai="center" jc="between">
          <Text as="p" ff="accent" fz="xl" fw="500" c="var(--primary)">
            {item.brand}
          </Text>
          <Button
            type="button"
            variant="ghost"
            className="c--itemLinkBtn"
            aria-label="ブランドを変更"
          >
            <MaterialIcon name="edit" size={14} />
            変更
          </Button>
        </Flex>
        <Heading level="1" id={`${uid}-title`} fz="s" c="text-2" lts="s" mt="5" className="c--itemName">
          {item.name}
        </Heading>
        <Flex fxw="wrap" g="10" mt="15">
          <span className="c--itemChip">
            <span className="c--itemDot" style={{ background: item.colorHex }} aria-hidden="true" />
            {item.colorLabel}
          </span>
          <span className="c--itemChip">{item.size}</span>
          <span className="c--itemChip">{item.categoryChip}</span>
          <span className="c--itemChip is-accent">{item.material}</span>
        </Flex>
      </Flex>

      <Card.Root className="c--itemCard c--itemPerf">
        <Card.Header className="c--itemRow">
          <Card.Title level="2" className="c--itemEyebrow c--itemPerfTitle">
            <MaterialIcon name="analytics" size={18} style={{ color: "var(--accent)" }} />
            着用パフォーマンス
          </Card.Title>
          <span className="c--itemMicro" style={{ textTransform: "none" }}>
            今季高稼働
          </span>
        </Card.Header>
        <Card.Content>
          <dl className="c--itemStats">
            <div className="c--itemStat">
              <dt className="c--itemMicro">総着用回数</dt>
              <dd style={{ marginTop: 4 }}>
                <span className="c--itemNum">{item.wearCount}</span>
                <span className="c--itemMicro"> 回</span>
              </dd>
              <dd className="c--itemStatNote" style={{ color: "var(--accent)" }}>
                最終: {item.lastWorn}
              </dd>
            </div>
            <div className="c--itemStat">
              <dt className="c--itemMicro">着用単価 (CPW)</dt>
              <dd className="c--itemNum" style={{ marginTop: 4 }}>
                {cpw === null ? "-" : yen(cpw)}
              </dd>
              <dd className="c--itemStatNote">定価 {yen(item.price)}</dd>
            </div>
            <div className="c--itemStat">
              <dt className="c--itemMicro" id={`${uid}-eff`}>
                活用効率
              </dt>
              <dd style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                {/* Ring gauge: exposed as a progressbar; the visible number is hidden from AT to avoid double reading. */}
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 36 36"
                  role="progressbar"
                  aria-labelledby={`${uid}-eff`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={item.efficiency}
                  aria-valuetext={`${item.efficiency}%`}
                >
                  <g style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}>
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--outline-variant)" strokeWidth="4" />
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
                  </g>
                </svg>
                <span className="c--itemNum" aria-hidden="true">
                  {item.efficiency}
                  <span style={{ fontSize: 11 }}>%</span>
                </span>
              </dd>
              <dd className="c--itemStatNote">{item.efficiencyNote}</dd>
            </div>
          </dl>
        </Card.Content>
      </Card.Root>
    </>
  );
}
