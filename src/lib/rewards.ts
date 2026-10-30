// Reward rules: points from carbon saved and eco actions; milestones unlock a real plant.
export const POINTS_PER_KG_CO2 = 10;

export const ACTION_POINTS = {
  ecoPurchase: 20, // chose a product with eco score >= 70
  switchToAlternative: 30, // swapped a low-score product for a greener alternative
  recycleDone: 25, // completed a reuse / recycle action
} as const;

export const MILESTONES = [
  { points: 100, plant: "Tulsi (Holy Basil)", emoji: "🌿", note: "Purifies air, easy indoor care" },
  { points: 300, plant: "Money Plant", emoji: "🪴", note: "Thrives in water or soil" },
  { points: 600, plant: "Aloe Vera", emoji: "🌵", note: "Low water, medicinal gel" },
  { points: 1000, plant: "Neem Sapling", emoji: "🌳", note: "A tree that absorbs ~20kg CO₂/yr" },
  { points: 2000, plant: "Mango Tree Sapling", emoji: "🥭", note: "Plant it with your family" },
] as const;

export function pointsFor(kind: keyof typeof ACTION_POINTS, co2SavedKg: number): number {
  return ACTION_POINTS[kind] + Math.round(Math.max(0, co2SavedKg) * POINTS_PER_KG_CO2);
}

export function milestoneStatus(points: number) {
  const unlocked = MILESTONES.filter((m) => points >= m.points);
  const next = MILESTONES.find((m) => points < m.points) ?? null;
  const prev = unlocked.at(-1)?.points ?? 0;
  const progress = next ? (points - prev) / (next.points - prev) : 1;
  return { unlocked, next, progress };
}

export function ecoTier(score: number): "high" | "mid" | "low" {
  if (score >= 70) return "high";
  if (score >= 50) return "mid";
  return "low";
}
