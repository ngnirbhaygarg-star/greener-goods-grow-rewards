export type Alternative = {
  name: string;
  price: string;
  store: string;
  url: string;
  ecoScore: number;
  whyBetter: string;
  co2SavedKg: number;
};

export type Product = {
  name: string;
  brand: string;
  price: string;
  store: string;
  url: string;
  category: string;
  ecoScore: number;
  materials: string;
  co2Kg: number;
  reasons: string[];
  alternatives: Alternative[];
};

export type SearchResult = { summary: string; products: Product[] };

export type WasteResult = {
  item: string;
  material: string;
  condition: string;
  summary: string;
  reuseIdeas: { title: string; difficulty: "Easy" | "Medium" | "Hard"; steps: string[] }[];
  recycleSteps: string[];
  doNot: string[];
  co2SavedKg: number;
};
