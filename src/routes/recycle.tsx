import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Camera, CheckCircle2, Loader2, Recycle, TriangleAlert, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyzeWaste } from "@/lib/eco.functions";
import type { WasteResult } from "@/lib/eco-types";
import { pointsFor } from "@/lib/rewards";
import { earnWithToast } from "@/lib/reward-toast";

export const Route = createFileRoute("/recycle")({
  head: () => ({
    meta: [
      { title: "Reuse & Recycle — Eco Agent" },
      { name: "description", content: "Snap a photo of any waste or old item and the Eco Agent tells you how to upcycle, reuse or recycle it." },
      { property: "og:title", content: "Reuse & Recycle with Eco Agent" },
      { property: "og:description", content: "AI waste analysis with upcycling ideas and recycling steps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RecyclePage,
});

async function toDataUrl(file: File): Promise<string> {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, 1024 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = img.width * scale;
  c.height = img.height * scale;
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.8);
}

function RecyclePage() {
  const analyze = useServerFn(analyzeWaste);
  const fileRef = useRef<HTMLInputElement>(null);
  const [desc, setDesc] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WasteResult | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());

  async function run() {
    if (loading || (!image && desc.trim().length < 2)) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setDone(new Set());
    try {
      const r = await analyze({ data: { description: desc, image } });
      if ("error" in r) setError(r.error);
      else setResult(r);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function complete(key: string, label: string, share: number) {
    if (!result || done.has(key)) return;
    const co2 = +(result.co2SavedKg * share).toFixed(2);
    earnWithToast(label, pointsFor("recycleDone", co2), co2);
    setDone(new Set(done).add(key));
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex items-center gap-2 text-sm font-semibold text-primary"><Recycle className="size-4" /> Waste Analyzer</div>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight md:text-5xl">Give old things a second life.</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">Upload a photo or describe any waste — a plastic bottle, old jeans, a broken phone. The Eco Agent shows how to reuse or recycle it.</p>

      <div className="mt-8 grid gap-4 rounded-3xl border border-border bg-card p-5 shadow-soft md:grid-cols-[220px_1fr]">
        <button
          onClick={() => fileRef.current?.click()}
          className="relative grid aspect-square place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted text-muted-foreground transition-colors hover:border-primary"
        >
          {image ? (
            <>
              <img src={image} alt="Item to analyze" className="absolute inset-0 size-full object-cover" />
              <span
                onClick={(e) => { e.stopPropagation(); setImage(null); }}
                className="absolute right-2 top-2 rounded-full bg-card p-1 text-foreground"
                aria-label="Remove photo"
              ><X className="size-4" /></span>
            </>
          ) : (
            <span className="flex flex-col items-center gap-2 text-sm"><Camera className="size-8" />Add photo</span>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setImage(await toDataUrl(f)); e.target.value = ""; }} />
        <div className="flex flex-col gap-3">
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Describe the item (optional with a photo) — e.g. 'a pile of old newspapers and glass jars'"
            className="min-h-32 flex-1 resize-none rounded-xl border border-input bg-background p-4 text-base outline-none focus:ring-2 focus:ring-ring"
          />
          <Button size="lg" onClick={run} disabled={loading || (!image && desc.trim().length < 2)} className="self-end">
            {loading ? <><Loader2 className="animate-spin" /> Analyzing…</> : <><Wand2 /> Analyze waste</>}
          </Button>
        </div>
      </div>

      {error && <div className="mt-6 flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-destructive"><TriangleAlert className="size-5" /> {error}</div>}

      {result && (
        <div className="mt-10 space-y-8">
          <div className="rounded-3xl bg-hero-gradient p-6 text-hero-foreground">
            <p className="text-sm opacity-75">{result.material} · {result.condition}</p>
            <h2 className="mt-1 text-3xl font-extrabold">{result.item}</h2>
            <p className="mt-2 max-w-2xl opacity-85">{result.summary}</p>
            <p className="mt-4 inline-block rounded-full bg-accent px-4 py-1 text-sm font-semibold text-accent-foreground">Up to {result.co2SavedKg} kg CO₂ saved</p>
          </div>

          <div>
            <h3 className="text-2xl font-bold">Reuse & upcycle ideas</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {result.reuseIdeas.map((idea, i) => (
                <div key={i} className="flex flex-col rounded-2xl border border-border bg-card p-5">
                  <span className="self-start rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">{idea.difficulty}</span>
                  <h4 className="mt-2 text-lg font-bold">{idea.title}</h4>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">{idea.steps.map((s, j) => <li key={j}>{s}</li>)}</ol>
                  <Button className="mt-auto" variant={done.has(`r${i}`) ? "secondary" : "default"} disabled={done.has(`r${i}`)} onClick={() => complete(`r${i}`, `Upcycled: ${idea.title}`, 1)}>
                    <CheckCircle2 /> {done.has(`r${i}`) ? "Done — points earned" : "I did this"}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-xl font-bold">♻️ How to recycle</h3>
              <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm">{result.recycleSteps.map((s, i) => <li key={i}>{s}</li>)}</ol>
              <Button className="mt-4" variant="outline" disabled={done.has("rec")} onClick={() => complete("rec", `Recycled: ${result.item}`, 0.8)}>
                <CheckCircle2 /> {done.has("rec") ? "Recycled — points earned" : "I recycled it"}
              </Button>
            </div>
            <div className="rounded-2xl border border-eco-low/30 bg-card p-5">
              <h3 className="text-xl font-bold">🚫 Avoid</h3>
              <ul className="mt-3 space-y-1.5 text-sm">{result.doNot.map((s, i) => <li key={i} className="flex gap-2"><span className="text-eco-low">✕</span>{s}</li>)}</ul>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
