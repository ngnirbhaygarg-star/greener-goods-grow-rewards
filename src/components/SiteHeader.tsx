import { Link } from "@tanstack/react-router";
import { Leaf, Recycle, Trophy, ShoppingBag } from "lucide-react";
import { useEcoState } from "@/lib/eco-store";

const nav = [
  { to: "/", label: "Shop with Agent", icon: ShoppingBag },
  { to: "/recycle", label: "Reuse & Recycle", icon: Recycle },
  { to: "/rewards", label: "Rewards", icon: Trophy },
] as const;

export function SiteHeader() {
  const s = useEcoState();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-extrabold text-primary">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Leaf className="size-5" />
          </span>
          Eco Agent
        </Link>
        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
              activeOptions={{ exact: true }}
            >
              <n.icon className="size-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <Link
          to="/rewards"
          className="ml-auto flex items-center gap-3 rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground"
        >
          <span>🌱 {s.points} pts</span>
          <span className="hidden opacity-75 sm:inline">· {s.co2.toFixed(1)} kg CO₂ saved</span>
          {s.cart.length > 0 && <span className="opacity-75">· 🛒 {s.cart.length}</span>}
        </Link>
      </div>
      <nav className="flex justify-around border-t border-border/60 py-1 md:hidden">
        {nav.map((n) => (
          <Link key={n.to} to={n.to} className="flex flex-col items-center px-3 py-1 text-xs text-muted-foreground" activeProps={{ className: "text-primary font-semibold" }} activeOptions={{ exact: true }}>
            <n.icon className="size-4" />
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
