import Link from "next/link";
import { LinkButton } from "@/components/ui";
import { getSessionUser } from "@/lib/game/profile";

const FEATURES = [
  {
    icon: "🎴",
    title: "Realistic pull rates",
    body: "Pack odds modelled on community datasets of thousands of real openings — secret rares are genuinely rare.",
  },
  {
    icon: "📚",
    title: "Every era, every set",
    body: "From Base Set to Scarlet & Violet. Each expansion has its own booster structure and rarity pool.",
  },
  {
    icon: "🔥",
    title: "Daily streaks & XP",
    body: "Open 3 packs a day in Trainer Mode, keep your streak alive and level up your trainer profile.",
  },
  {
    icon: "🖼️",
    title: "Showcase binder",
    body: "Curate a 3×3 binder of your best pulls for the world to see. Only cards you actually own.",
  },
  {
    icon: "🤝",
    title: "Friends & rivalry",
    body: "Compare set completion with friends and see exactly which cards you're both missing.",
  },
  {
    icon: "📣",
    title: "Live pull feed",
    body: "Big hits hit the global feed. React with 🔥 when someone pulls the Charizard.",
  },
];

export default async function LandingPage() {
  const user = await getSessionUser();

  return (
    <div className="flex flex-col gap-20 py-8">
      <section className="flex flex-col items-center gap-6 text-center">
        <span className="rounded-full border border-border bg-surface px-4 py-1 text-xs text-muted">
          Non-profit fan project · free forever
        </span>
        <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-6xl">
          Rip packs. Chase the <span className="text-primary">Charizard</span>.
          Build your legacy.
        </h1>
        <p className="max-w-xl text-lg text-muted">
          A social Pokémon TCG pack-opening simulator with real-world pull rates,
          permanent collections, binders and friends.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <LinkButton href="/open-pack" className="px-8 py-3 text-base">
            Open a free pack
          </LinkButton>
          {!user && (
            <LinkButton href="/login" variant="secondary" className="px-8 py-3 text-base">
              Create trainer account
            </LinkButton>
          )}
        </div>
        <p className="text-xs text-muted">
          Sandbox mode needs no account — jump straight in.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-primary/40"
          >
            <div className="text-3xl">{f.icon}</div>
            <h3 className="mt-3 font-bold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted">{f.body}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-border bg-surface p-8 text-center sm:p-12">
        <h2 className="text-2xl font-bold sm:text-3xl">Two ways to play</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface-2 p-6 text-left">
            <h3 className="text-lg font-bold">🏖️ Sandbox Mode</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>• Unlimited packs, no account needed</li>
              <li>• Full opening experience with rarity animations</li>
              <li>• Session history to flex your luck</li>
              <li>• Cards are not saved — pure fun</li>
            </ul>
            <LinkButton href="/open-pack?mode=sandbox" variant="secondary" className="mt-5">
              Play sandbox
            </LinkButton>
          </div>
          <div className="rounded-2xl border border-primary/30 bg-surface-2 p-6 text-left">
            <h3 className="text-lg font-bold">🏆 Trainer Mode</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>• 3 packs per day — make them count</li>
              <li>• Every card joins your permanent collection</li>
              <li>• Streaks, XP, levels and achievements</li>
              <li>• Binder showcases, friends and feed glory</li>
            </ul>
            <LinkButton href={user ? "/open-pack?mode=trainer" : "/login"} className="mt-5">
              {user ? "Open today's packs" : "Sign up free"}
            </LinkButton>
          </div>
        </div>
      </section>

      <section className="text-center text-sm text-muted">
        Browse all{" "}
        <Link href="/sets" className="text-primary underline">
          expansions
        </Link>{" "}
        from Base Set (1999) to the latest Scarlet & Violet releases.
      </section>
    </div>
  );
}
