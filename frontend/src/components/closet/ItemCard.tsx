import { Box, Flex, Heading, Text } from "lism-css/react";
import { MaterialIcon } from "../MaterialIcon";
import type { ClothingItem } from "../../mocks/types";

type Props = { item: ClothingItem; onToggleFavorite: (id: string) => void };

export function ItemCard({ item, onToggleFavorite }: Props) {
  return (
    <Box as="article" className="c--itemCard">
      <div className="c--itemThumb">
        {item.imageUrl && <img src={item.imageUrl} alt={`${item.brand} ${item.name}`} loading="lazy" />}
        <button
          type="button"
          className="c--favBtn"
          aria-pressed={item.favorite}
          aria-label={`${item.name}をお気に入り`}
          onClick={() => onToggleFavorite(item.id)}
        >
          <MaterialIcon name="favorite" size={16} filled={item.favorite} />
        </button>
        {item.tag && <span className="c--itemTag">{item.tag}</span>}
      </div>
      <Box p="20" pt="15">
        <Text className="c--itemMeta" tt="uppercase" css={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.brand}
        </Text>
        <Heading level="3" fz="s" fw="500" mt="5" css={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.name}
        </Heading>
        <Flex ai="center" jc="between" mt="20" g="10">
          <span className="c--itemMeta">{item.color}</span>
          <span className={`c--wear${item.wearCount >= 14 ? " is-hot" : ""}`}>{item.wearCount}回着用</span>
        </Flex>
      </Box>
    </Box>
  );
}
