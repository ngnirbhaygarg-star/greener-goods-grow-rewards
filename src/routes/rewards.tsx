import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Sprout } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ecoStore, useEcoState } from "@/lib/eco-store";
import { ACTION_POINTS, MILESTONES, POINTS_PER_KG_CO2, milestoneStatus } from "@/lib/rewards";

export const Route = createFileRoute("/rewards")({
  head: () => ({
    meta: [
      { title: "Green Rewards — Eco Agent" },
      { name: "description", content: "Earn eco points for every kg of CO₂ you save. Reach a milestone and get a real plant as a reward." },
      { property: "og:title", content: "Green Rewards — earn a real plant" },
      { property: "og:description", content: "Points for sustainable choices, plants for milestones." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Rewards,
});

function Rewards() {
  const s = useEcoState();
  const { next, progress, unlocked } = milestoneStatus(s.points);
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="grid gap-6 rounded-3xl bg-hero-gradient p-8 text-hero-foreground md:grid-cols-3">
        <Stat label="Eco points" value={s.points.toString()} />
        <Stat label="CO₂ saved" value={`${s.co2.toFixed(1)} kg`} />
        <Stat label="Plants earned" value={unlocked.length.toString()} />
        <div className="md:col-span-3">
          {next ? (
            <>
              <div className="flex justify-between text-sm opacity-85">
                <span>Next reward: {next.emoji} {next.plant}</span>
                <span>{next.points - s.points} pts to go</span>
              </div>
              <Progress value={progress * 100} className="mt-2 h-3 bg-hero-foreground/20 [&>div]:bg-accent" />
            </>
          ) : (
            <p className="font-semibold">🌳 You've unlocked every plant. You're an Earth Guardian!</p>
          )}
        </div>
      </div>

      <h2 className="mt-12 text-3xl font-extrabold">Plant milestones</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {MILESTONES.map((m) => {
          const got = s.points >= m.points;
          const claimed = s.claimed.includes(m.points);
          return (
            <div key={m.points} className={`flex flex-col items-center rounded-2xl border p-5 text-center ${got ? "border-primary bg-card shadow-soft" : "border-border bg-muted opacity-70"}`}>
              <span className={`text-5xl ${got ? "animate-leaf" : "grayscale"}`}>{m.emoji}</span>
              <h3 className="mt-3 font-bold leading-tight">{m.plant}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{m.note}</p>
              <p className="mt-2 font-display text-sm font-bold text-primary">{m.points} pts</p>
              {got ? (
                <Button size="sm" className="mt-3" disabled={claimed} onClick={() => { ecoStore.claim(m.points); toast.success(`${m.plant} claimed!`, { description: "Your plant will be delivered to you. Thank you for protecting the planet." }); }}>
                  <Sprout /> {claimed ? "Claimed" : "Claim plant"}
                </Button>
              ) : (
                <span className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><Lock className="size-3" /> Locked</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-xl font-bold">How you earn</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>🌍 <b>{POINTS_PER_KG_CO2} pts</b> for every kg of CO₂ you save</li>
            <li>🔁 <b>+{ACTION_POINTS.switchToAlternative}</b> for switching to a greener alternative</li>
            <li>🛍️ <b>+{ACTION_POINTS.ecoPurchase}</b> for choosing a product with eco score 70+</li>
            <li>♻️ <b>+{ACTION_POINTS.recycleDone}</b> for each reuse or recycle action</li>
          </ul>
          <div className="mt-4 flex gap-2">
            <Button asChild><Link to="/">Shop green</Link></Button>
            <Button asChild variant="outline"><Link to="/recycle">Recycle something</Link></Button>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-xl font-bold">Your impact log</h3>
          {s.activity.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No actions yet — your first green choice will show up here.</p>
          ) : (
            <ul className="mt-3 max-h-72 divide-y divide-border overflow-auto">
              {s.activity.map((a) => (
                <li key={a.id} className="flex justify-between gap-3 py-2 text-sm">
                  <span>{a.label}</span>
                  <span className="shrink-0 font-semibold text-primary">+{a.points}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm opacity-75">{label}</p>
      <p className="font-display text-4xl font-extrabold">{value}</p>
    </div>
  );
}
