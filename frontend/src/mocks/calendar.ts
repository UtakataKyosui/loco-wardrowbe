import type { WearLog } from "./types";

/** Fixed "today" so the mock matches the design (Fri 24 Oct 2025). */
export const MOCK_TODAY = "2025-10-24";

export type CalendarOutfit = {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
};

export const calendarOutfits: CalendarOutfit[] = [
  {
    id: "o-urban",
    title: "Autumn Minimal Urban",
    summary: "ウールブレザー + ワイドスラックス",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDkNXng_JlUEVCREjVcMlHywocganPUa7bGymtCVBM6Fr5WEhCock3VCwSfGP3ryqPmWl80GJ-tj8jgcCSMHkO5I22rt5F0xPKZux2DIQ1yaGoF40AC9DyIFU05fqyKp9fkgQe-0ej6tsoiAeghSqRETJ3ZcwPZQfxMcCkRZA-4EfueC2UI7ZqrnlCsPSgh0T0HwaKLc4bUW9ae7_Vo4MMXMJB6HgKZ4JpcHSZtkaE",
  },
  {
    id: "o-knit",
    title: "Cashmere Weekend",
    summary: "カシミヤニット + ストレートデニム",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCz1FCWr95ETY4Jd4nYWF_S2pzEvgLvulM71TOmE_Nwf2PhVVzwwqtzwCWQ5XLQILd9e3AIBdrnk2oMae0zT9Edje4UBKAaCisnYFrj5OCsbE0dnVrrTgc332pbyv589fLAlvBRwiLK82m9fsnrXRQYAKQf0WtauNE10zdeYAzZlUZdTK8sgmEY5aHjHYjtEho6Pikm_12KNHgEvgkxZkpXLas13F06q6RBGj94X9s",
  },
  {
    id: "o-shirt",
    title: "Quiet Office Layer",
    summary: "ポプリンシャツ + テーパードパンツ",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCudzlyywgRgC26aeUSzC7MNCQktAvRyuyX3or589RTHzIuHj5RmxuESCo_WeLXhKkK-RBb-UDoURZwtibneh14R4HpJlCxSXAxPrVZChh1Juo5OUQYcaL2N-rm5VH1h-lNEOdSvVOPBM2ytlZjf4r0qJXcPE7Yu02-d9zmuy1FiHKaz9Dw3vZAZCiw-sTbrfe7RbZTDYDDNeNlbBdTIP6pZ3Z1TBM0aa3vUFg84Ps",
  },
];

const OCT_WORN = [2, 3, 4, 5, 7, 8, 9, 10, 12, 13, 14, 16, 17, 18, 19, 20, 22, 23, 24, 27, 28, 29];
const SEP_WORN = [1, 2, 3, 5, 6, 8, 9, 10, 12, 15, 16, 17, 19, 22, 23, 24, 26, 29, 30];

function logsFor(prefix: string, days: number[]): WearLog[] {
  return days.map((d, i) => {
    const outfit = calendarOutfits[i % calendarOutfits.length];
    const date = `${prefix}-${String(d).padStart(2, "0")}`;
    return {
      id: `log-${date}`,
      date,
      outfitId: outfit.id,
      itemIds: [`${outfit.id}-a`, `${outfit.id}-b`],
      weather: { tempC: 14 + (d % 8), label: d % 3 === 0 ? "くもり" : "晴れ" },
    };
  });
}

const baseLogs = [...logsFor("2025-09", SEP_WORN), ...logsFor("2025-10", OCT_WORN)];

export const wearLogs: WearLog[] = baseLogs.map((log) =>
  log.date === MOCK_TODAY
    ? {
        ...log,
        outfitId: "o-urban",
        weather: { tempC: 18, label: "晴れ" },
        note: "クライアント打ち合わせ。動きやすく上品な組み合わせ",
      }
    : log,
);

/** Per-month analytics that cannot be derived from the logs alone. */
export const monthAnalytics: Record<
  string,
  { utilization: number; topItem: string; topItemCount: number }
> = {
  "2025-10": { utilization: 74, topItem: "カシミヤニット", topItemCount: 8 },
  "2025-09": { utilization: 68, topItem: "リネンシャツ", topItemCount: 6 },
};

export type LowRotationItem = {
  id: string;
  category: string;
  name: string;
  daysIdle: number;
  imageUrl: string;
};

export const lowRotationItems: LowRotationItem[] = [
  {
    id: "lr-1",
    category: "SHIRTS / TOPS",
    name: "リラックスポプリン 白シャツ",
    daysIdle: 42,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCudzlyywgRgC26aeUSzC7MNCQktAvRyuyX3or589RTHzIuHj5RmxuESCo_WeLXhKkK-RBb-UDoURZwtibneh14R4HpJlCxSXAxPrVZChh1Juo5OUQYcaL2N-rm5VH1h-lNEOdSvVOPBM2ytlZjf4r0qJXcPE7Yu02-d9zmuy1FiHKaz9Dw3vZAZCiw-sTbrfe7RbZTDYDDNeNlbBdTIP6pZ3Z1TBM0aa3vUFg84Ps",
  },
  {
    id: "lr-2",
    category: "ACCESSORY",
    name: "シルクツイルスカーフ",
    daysIdle: 58,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuACwwuLK6DuM_xQPRb-VN3w87mVyEfGgDd6dc2df8LXuEmnwiisDNAqyapjSNfR_L0Ynw7gn1YhEtRQCiu_SYtOFN3tuVhW-otc0hVnEFBLJcWC0of2-NaxGNUFHLYoM9uFl8ERPrgPIJCRz-V9FaPAZmQmIJKSG_6hcGOSs4Jn_d7NlXiwJ7Z9UxmBEe9PR4vCg_FjcBDTJIzzJxrCDnQgxpDJDmOJaNJRALcbuQ0",
  },
  {
    id: "lr-3",
    category: "BOTTOMS",
    name: "セルビッジ ストレートデニム",
    daysIdle: 35,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCz1FCWr95ETY4Jd4nYWF_S2pzEvgLvulM71TOmE_Nwf2PhVVzwwqtzwCWQ5XLQILd9e3AIBdrnk2oMae0zT9Edje4UBKAaCisnYFrj5OCsbE0dnVrrTgc332pbyv589fLAlvBRwiLK82m9fsnrXRQYAKQf0WtauNE10zdeYAzZlUZdTK8sgmEY5aHjHYjtEho6Pikm_12KNHgEvgkxZkpXLas13F06q6RBGj94X9s",
  },
];
