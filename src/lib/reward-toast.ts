import { toast } from "sonner";
import { ecoStore } from "./eco-store";

export function earnWithToast(label: string, points: number, co2: number) {
  const plant = ecoStore.earn(label, points, co2);
  toast.success(`+${points} eco points`, { description: `${label} · ${co2.toFixed(1)} kg CO₂ saved` });
  if (plant)
    toast(`${plant.emoji} Milestone reached! You earned a ${plant.plant}`, {
      description: "Claim your real plant on the Rewards page.",
      duration: 8000,
    });
}
