import { Link } from "@tanstack/react-router";
import { Badge, Toggle } from "@utakata-ui/react";
import { Box, Flex, Heading, Text } from "lism-css/react";
import { MaterialIcon } from "../MaterialIcon";
import type { ClothingItem } from "../../mocks/types";

type Props = { item: ClothingItem; onToggleFavorite: (id: string) => void };

// Rendered inside a <li> by the parent list. The title is the single link to the detail page
// (stretched over the card); the favourite Toggle sits above it.
export function ItemCard({ item, onToggleFavorite }: Props) {
  return (
    <Box className="c--closetCard">
      <div className="c--closetThumb">
        {/* Decorative: the adjacent heading already names the item. */}
        {item.imageUrl && <img src={item.imageUrl} alt="" loading="lazy" />}
        <Toggle
          iconOnly
          className="c--favBtn"
          aria-label={`${item.name}をお気に入り`}
          pressed={item.favorite}
          onPressedChange={() => onToggleFavorite(item.id)}
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <span className="c--favDot">
            <MaterialIcon name="favorite" size={16} filled={item.favorite} />
          </span>
        </Toggle>
        {item.tag && (
          <Badge variant="outline" className="c--itemTag">
            {item.tag}
          </Badge>
        )}
      </div>
      <Box p="20" pt="15">
        <Text
          className="c--itemMeta"
          tt="uppercase"
          css={{ overflow: "hidden", textOverflow: "ellipsis", overflowWrap: "anywhere" }}
        >
          {item.brand}
        </Text>
        <Heading level="3" fz="s" fw="500" mt="5" css={{ overflowWrap: "anywhere" }}>
          <Link to="/closet/$itemId" params={{ itemId: item.id }} className="c--itemLink">
            {item.name}
          </Link>
        </Heading>
        <Flex ai="center" jc="between" mt="20" g="10">
          <span className="c--itemMeta">{item.color}</span>
          <span className={`c--wear${item.wearCount >= 14 ? " is-hot" : ""}`}>
            {item.wearCount}回着用
          </span>
        </Flex>
      </Box>
    </Box>
  );
}
