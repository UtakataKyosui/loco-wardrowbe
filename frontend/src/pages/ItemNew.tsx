import { Link } from "@tanstack/react-router";
import { Heading, Stack } from "lism-css/react";
import { MaterialIcon } from "../components/MaterialIcon";
import { ItemForm } from "../components/closet/ItemForm";
import "../components/item/item.css";

export function ItemNew() {
  return (
    <Stack g="20">
      <div className="c--itemSub">
        <Link to="/closet" className="c--itemBack">
          <MaterialIcon name="arrow_back" size={20} />
          クローゼット
        </Link>
      </div>
      <Heading level="1" ff="accent" fz="2xl" fw="500">
        アイテムを追加
      </Heading>
      <ItemForm />
    </Stack>
  );
}
