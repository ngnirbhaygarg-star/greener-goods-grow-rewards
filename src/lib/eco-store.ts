import { useEffect, useState, useSyncExternalStore } from "react";
import { milestoneStatus } from "./rewards";

export type Activity = { id: string; label: string; points: number; co2: number; at: number };
export type CartItem = { id: string; name: string; price: string; store: string; url: string; ecoScore: number };
type State = { points: number; co2: number; activity: Activity[]; cart: CartItem[]; claimed: number[] };

const KEY = "eco-agent-state-v1";
const empty: State = { points: 0, co2: 0, activity: [], cart: [], claimed: [] };
let state: State = empty;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...empty, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
}
function set(next: State) {
  state = next;
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export const ecoStore = {
  earn(label: string, points: number, co2: number) {
    load();
    const before = milestoneStatus(state.points).unlocked.length;
    set({
      ...state,
      points: state.points + points,
      co2: +(state.co2 + co2).toFixed(2),
      activity: [{ id: crypto.randomUUID(), label, points, co2, at: Date.now() }, ...state.activity].slice(0, 50),
    });
    const after = milestoneStatus(state.points).unlocked;
    return after.length > before ? after.at(-1)! : null;
  },
  addToCart(item: Omit<CartItem, "id">) {
    load();
    set({ ...state, cart: [...state.cart, { ...item, id: crypto.randomUUID() }] });
  },
  removeFromCart(id: string) {
    set({ ...state, cart: state.cart.filter((c) => c.id !== id) });
  },
  claim(points: number) {
    set({ ...state, claimed: [...state.claimed, points] });
  },
};

export function useEcoState(): State {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    load();
    setHydrated(true);
  }, []);
  const s = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => empty,
  );
  return hydrated ? s : empty;
}
