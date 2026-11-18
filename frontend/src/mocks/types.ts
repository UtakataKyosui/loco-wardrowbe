export type Category = "tops" | "bottoms" | "outer" | "shoes" | "accessories";
export type Season = "spring" | "summer" | "autumn" | "winter";

export type ClothingItem = {
  id: string;
  brand: string;
  name: string;
  color: string;
  category: Category;
  imageUrl?: string;
  seasons: Season[];
  tag?: string; // badge such as "A/W", "ALL", "DINNER"
  wearCount: number;
  favorite: boolean;
  size?: string;
  material?: string;
  price?: number;
  purchasedAt?: string;
};

export type Outfit = {
  id: string;
  title: string;
  label?: string; // e.g. "No. 01 · Work Capsule"
  occasion: string;
  tags: string[];
  itemIds: string[];
  matchScore?: number; // percent
  saved: boolean;
};

export type WearLog = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  outfitId?: string;
  itemIds: string[];
  weather?: { tempC: number; label: string };
  note?: string;
};
