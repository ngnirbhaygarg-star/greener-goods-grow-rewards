import { cn } from "@/lib/utils";
import { ecoTier } from "@/lib/rewards";

const tone = {
  high: "bg-eco-high text-primary-foreground",
  mid: "bg-eco-mid text-accent-foreground",
  low: "bg-eco-low text-primary-foreground",
};
const label = { high: "Eco Choice", mid: "Fair", low: "High Impact" };

export function EcoScore({ score, size = "md" }: { score: number; size?: "sm" | "md" }) {
  const t = ecoTier(score);
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full font-display font-bold",
        tone[t],
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
      )}
      title="Eco Score (0–100)"
    >
      <span>{score}</span>
      <span className="font-sans text-[0.7em] font-medium uppercase tracking-wider opacity-90">
        {label[t]}
      </span>
    </div>
  );
}
