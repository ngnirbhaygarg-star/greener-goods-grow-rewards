import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, ExternalLink, Leaf, Loader2, Search, ShoppingCart, Sparkle, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EcoScore } from "@/components/EcoScore";
import { searchProducts } from "@/lib/eco.functions";
import type { Product, SearchResult } from "@/lib/eco-types";
import { ecoTier, pointsFor } from "@/lib/rewards";
import { earnWithToast } from "@/lib/reward-toast";
import { ecoStore, useEcoState } from "@/lib/eco-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Eco Agent — AI sustainable shopping assistant" },
      { name: "description", content: "Tell the Eco Agent what you need. It searches stores online, assigns every product an Eco Score and suggests greener alternatives." },
      { property: "og:title", content: "Eco Agent — Don't just shop. Shop with purpose." },
      { property: "og:description", content: "AI search across online stores with Eco Scores and greener swaps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const CATEGORIES = [
  { label: "Personal care", q: "toothbrush and shampoo bar" },
  { label: "Kitchen", q: "food storage containers" },
  { label: "Fashion", q: "everyday cotton t-shirt" },
  { label: "Electronics", q: "phone charger power bank" },
  { label: "Home", q: "laundry detergent" },
  { label: "Stationery", q: "notebooks and pens for school" },
];

type Sort = "relevance" | "eco" | "co2";

function Index() {
  const search = useServerFn(searchProducts);
  const [query, setQuery] = useState("");
  const [asked, setAsked] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [minScore, setMinScore] = useState(0);
  const [sort, setSort] = useState<Sort>("relevance");

  async function run(q: string) {
    if (q.trim().length < 2 || loading) return;
    setQuery(q);
    setAsked(q);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await search({ data: { query: q } });
      if ("error" in r) setError(r.error);
      else setResult(r);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const products = (result?.products ?? [])
    .filter((p) => p.ecoScore >= minScore)
    .sort((a, b) => (sort === "eco" ? b.ecoScore - a.ecoScore : sort === "co2" ? a.co2Kg - b.co2Kg : 0));

  return (
    <main>
      <section className="bg-hero-gradient text-hero-foreground">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-14 md:pt-20">
          <div className="flex items-center gap-2 text-sm font-medium text-accent">
            <Leaf className="size-4 animate-leaf" /> Your AI Eco Agent
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
            Don't just shop. <span className="text-accent">Shop with purpose.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg opacity-80">
            Tell me what you need. I'll search stores online, score every product's impact on the planet, and find greener swaps.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(query);
            }}
            className="mt-8 flex max-w-2xl items-center gap-2 rounded-2xl bg-card p-2 shadow-soft"
          >
            <Search className="ml-3 size-5 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. a water bottle for school under ₹800"
              className="h-12 min-w-0 flex-1 bg-transparent text-base text-card-foreground outline-none placeholder:text-muted-foreground"
            />
            <Button type="submit" size="lg" disabled={loading} className="h-12 rounded-xl px-6">
              {loading ? <Loader2 className="animate-spin" /> : <>Ask agent <ArrowRight /></>}
            </Button>
          </form>
          <div className="mt-5 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.label}
                onClick={() => run(c.q)}
                className="rounded-full border border-hero-foreground/25 px-4 py-1.5 text-sm transition-colors hover:bg-hero-foreground/10"
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        {!asked && <HowItWorks />}

        {loading && (
          <div className="grid place-items-center gap-3 py-20 text-center">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="font-display text-xl font-bold">Searching stores for “{asked}”…</p>
            <p className="text-sm text-muted-foreground">Reading materials, packaging, certifications & carbon footprint. This takes ~30 seconds.</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
            <TriangleAlert className="size-5" /> {error}
          </div>
        )}

        {result && (
          <>
            <div className="flex flex-col gap-4 rounded-2xl bg-secondary p-5 md:flex-row md:items-center">
              <Sparkle className="size-6 shrink-0 text-primary" />
              <p className="flex-1 text-secondary-foreground">
                <span className="font-semibold">Agent says: </span>
                {result.summary}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
              <span className="text-muted-foreground">Min eco score</span>
              {[0, 50, 70].map((m) => (
                <Chip key={m} active={minScore === m} onClick={() => setMinScore(m)}>
                  {m === 0 ? "All" : `${m}+`}
                </Chip>
              ))}
              <span className="ml-4 text-muted-foreground">Sort</span>
              {(["relevance", "eco", "co2"] as Sort[]).map((s) => (
                <Chip key={s} active={sort === s} onClick={() => setSort(s)}>
                  {s === "relevance" ? "Relevance" : s === "eco" ? "Best eco score" : "Lowest CO₂"}
                </Chip>
              ))}
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {products.map((p, i) => (
                <ProductCard key={i} p={p} />
              ))}
            </div>
            {products.length === 0 && <p className="py-10 text-center text-muted-foreground">No products match this filter.</p>}
          </>
        )}
        <Cart />
      </section>
    </main>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 font-medium transition-colors ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}

function ProductCard({ p }: { p: Product }) {
  const low = ecoTier(p.ecoScore) === "low";
  function add() {
    ecoStore.addToCart({ name: p.name, price: p.price, store: p.store, url: p.url, ecoScore: p.ecoScore });
    if (p.ecoScore >= 70) earnWithToast(`Chose eco product: ${p.name}`, pointsFor("ecoPurchase", p.co2Kg * 0.3), p.co2Kg * 0.3);
  }
  return (
    <article className={`flex flex-col rounded-2xl border bg-card p-5 shadow-soft ${low ? "border-eco-low/40" : "border-border"}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{p.category}</span>
        <EcoScore score={p.ecoScore} />
      </div>
      <h3 className="mt-3 text-lg font-bold leading-snug">{p.name}</h3>
      <p className="text-sm text-muted-foreground">{p.brand} · {p.store}</p>
      <div className="mt-3 flex items-baseline gap-3">
        <span className="font-display text-2xl font-extrabold">{p.price}</span>
        <span className="text-xs text-muted-foreground">~{p.co2Kg} kg CO₂e</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground"><span className="font-semibold">Materials:</span> {p.materials}</p>
      <ul className="mt-3 space-y-1 text-sm">
        {p.reasons.map((r, i) => (
          <li key={i} className="flex gap-2"><span className="text-primary">•</span>{r}</li>
        ))}
      </ul>
      {low && p.alternatives.length > 0 && (
        <div className="mt-4 rounded-xl bg-secondary p-3">
          <p className="flex items-center gap-1.5 text-sm font-bold text-secondary-foreground">
            <TriangleAlert className="size-4 text-eco-low" /> Greener alternatives
          </p>
          <div className="mt-2 space-y-2">
            {p.alternatives.map((a, i) => (
              <div key={i} className="rounded-lg bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{a.name}</p>
                  <EcoScore score={Math.round(a.ecoScore)} size="sm" />
                </div>
                <p className="text-xs text-muted-foreground">{a.price} · {a.store} · saves ~{a.co2SavedKg} kg CO₂</p>
                <p className="mt-1 text-xs">{a.whyBetter}</p>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      ecoStore.addToCart({ name: a.name, price: a.price, store: a.store, url: a.url, ecoScore: Math.round(a.ecoScore) });
                      earnWithToast(`Switched to ${a.name}`, pointsFor("switchToAlternative", a.co2SavedKg), a.co2SavedKg);
                    }}
                  >
                    <Leaf /> Switch & add
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <a href={a.url} target="_blank" rel="noreferrer">View <ExternalLink /></a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mt-auto flex gap-2 pt-4">
        <Button variant={low ? "outline" : "default"} className="flex-1" onClick={add}>
          <ShoppingCart /> Add to cart
        </Button>
        <Button variant="outline" asChild>
          <a href={p.url} target="_blank" rel="noreferrer">Store <ExternalLink /></a>
        </Button>
      </div>
    </article>
  );
}

function Cart() {
  const s = useEcoState();
  if (s.cart.length === 0) return null;
  const avg = Math.round(s.cart.reduce((n, c) => n + c.ecoScore, 0) / s.cart.length);
  return (
    <div className="mt-12 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Your eco cart</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">Cart eco score <EcoScore score={avg} size="sm" /></div>
      </div>
      <ul className="mt-4 divide-y divide-border">
        {s.cart.map((c) => (
          <li key={c.id} className="flex items-center gap-3 py-3">
            <EcoScore score={c.ecoScore} size="sm" />
            <span className="flex-1 text-sm font-medium">{c.name} <span className="text-muted-foreground">· {c.store}</span></span>
            <span className="text-sm font-semibold">{c.price}</span>
            <Button size="sm" asChild><a href={c.url} target="_blank" rel="noreferrer">Buy</a></Button>
            <Button size="icon" variant="ghost" onClick={() => ecoStore.removeFromCart(c.id)} aria-label="Remove"><X /></Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "You ask", d: "Describe what you need in plain words — budget, use, location." },
    { n: "02", t: "Agent searches", d: "AI searches real online stores live — no fixed catalogue." },
    { n: "03", t: "Eco Score", d: "Every product scored 0–100 on materials, carbon, packaging & end of life." },
    { n: "04", t: "Greener swaps", d: "Low scores trigger alternatives. Switching earns points toward a real plant." },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {steps.map((s) => (
        <div key={s.n} className="rounded-2xl border border-border bg-card p-5">
          <span className="font-display text-3xl font-extrabold text-accent">{s.n}</span>
          <h3 className="mt-2 text-lg font-bold">{s.t}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
        </div>
      ))}
    </div>
  );
}
