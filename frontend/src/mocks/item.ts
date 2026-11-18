const IMG = "https://lh3.googleusercontent.com/aida-public/";

export const mockItem = {
  id: "abc",
  archiveId: "#AT-0924",
  capsule: "Capsule Staple",
  brand: "ATON TOKYO",
  name: "OVERSIZED CASHMERE KNIT",
  colorLabel: "Charcoal Melange",
  colorShort: "Charcoal",
  colorHex: "#37383B",
  size: "Size 02 (M)",
  sizeSpec: "02 / M相当",
  categoryChip: "トップス / ニット",
  category: "トップス › クルーネックニット",
  material: "カシミヤ 100%",
  price: 49500,
  purchasedAt: "2024 Autumn",
  wearCount: 14,
  lastWorn: "3日前",
  efficiency: 82,
  efficiencyNote: "上位15%アイテム",
  images: [
    {
      alt: "ATON Charcoal Cashmere Knit",
      src: `${IMG}AB6AXuAve4j-zqg0YAvvabhBIxYqI-bqkHmqa-UePHrOoiSv3hxk6mtFt3SL_hlEh_I7FUapZrYgpsxo7LQz2RS9NcZd_iu4wAzJThBnH7ZKXdmwFaA5nUZYDDY92EI_GTT3cx3tbgrcZW9-4BL58CVl10ZzYQ3iY-ErI1GLF4TzOhAI2i-B3mhF5Vl73c_4tyZwFfGCVtDo06QpLXjd-1Y2rbFtYOINRNMdeMVBSSZjZoU`,
    },
    {
      alt: "Fabric swatch texture",
      src: `${IMG}AB6AXuDSW_GBvTS2biHyIoZVU-wOSJAnlBMl0XFq2TnsDwuNkvU4JyafVdB5G4gLu4J997IzvEL-N5nBvm5hss1pUeWMm7nMAbeYv5IEe8tdtmgY0fxUOGl0GCoLutem9ITUd6WeX8Z4R3tpGLiGugByr8ZgFUxeQQJ-ceOsWZpgveCSfc02FRFPJFgzatlamU5DV67eRoJkjBKczxdEU3NdbB5gXmXwlbP_3EWYiMe18ig`,
    },
    {
      alt: "Care label detail",
      src: `${IMG}AB6AXuBTTXGi7h0SOalqo_Ir8u1YIfVRXTp6LosKsAzt6xCPJ5Pb13G8lIwFFpYrL0kDvaxq8oKxRenuvLmgnElgonva4kqun_jzQJW2cp9ILm7PfQgsvUHTZHKViJKr2D-iHOUhWn_Bbn--7SwPoYWG08vKcmUFCasTpqZzf0A38KvOB64lO4magZG35dLN4fabQ6eQnEAtsAn8YaQ93d-AcnIo5utrtq97o8P7wjDlr2I`,
    },
  ],
  care: [
    { icon: "dry_cleaning", label: "石油系ドライ" },
    { icon: "iron", label: "低温・当て布" },
    { icon: "do_not_touch", label: "水洗い不可" },
  ],
  seasons: [
    { key: "spring", label: "春 (早春)", on: false, disabled: false },
    { key: "summer", label: "夏", on: false, disabled: true },
    { key: "autumn", label: "秋", on: true, disabled: false },
    { key: "winter", label: "冬", on: true, disabled: false },
  ],
  looks: [
    {
      id: "l1",
      no: "LOOK #01",
      title: "Autumn Minimal Urban",
      sub: "ニット × ワイドスラックス",
      worn: 6,
      src: `${IMG}AB6AXuDjwqhG2Iv_NDM3mFOQ4PDB_eO5U9BY5bqSD0HkkwV_IfjoCXwRxMs3WaWh8ggZr4rUYALmyG8kKn4XS8v2gfGhWyx4cz62l2L8OV0Cstxn-FQ3z17SKabUAsSVjDWHgZ6S13pgn-VEqFbckIm2p1miZr1gAaibqzin6di_b4dwKMLJL04IiXA42LmF0TIeQDUUsFtl6RVlbL8IyrJMXO8WirRhLky3V8ehBpoGhak`,
    },
    {
      id: "l2",
      no: "LOOK #04",
      title: "Warm Trench Layer",
      sub: "トレンチ × ニットレイヤード",
      worn: 5,
      src: `${IMG}AB6AXuBam20YAG53Lhedsu15FIHLuvS-DzuIfyS5_ZvonoCJNoFAKns0w52ZgycEJPCO-lvtulcda_xH2g1t6Wg6Uptq8U4FiJ7_ilix94gxAb6yAAMh0eFfQmLE1X1RLzxjbjMVeKbHw2kfDPPhEYSzKX-J4nN0oYB77ueTKV_Ej04PgylJjpjRL_V3HCze-MRKcf1hd4p6GfZx8f_9J1adUt2laoLzDybEw5sR0YU9hdc`,
    },
  ],
};

export type MockItem = typeof mockItem;
