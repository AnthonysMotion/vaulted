import Link from "next/link";
import { LinkButton, SectionEyebrow } from "@/components/ui";
import { getSessionUser } from "@/lib/game/profile";

const FEATURES = [
  {
    n: "01",
    title: "Realistic pull rates",
    body: "Odds modelled on community datasets of thousands of real openings — secret rares stay genuinely rare.",
  },
  {
    n: "02",
    title: "Every era, every set",
    body: "From Base Set to Mega Evolution. Each expansion carries its own booster structure and rarity pool.",
  },
  {
    n: "03",
    title: "Daily streaks & XP",
    body: "Three packs a day in Trainer Mode. Keep your streak alive and level your trainer profile.",
  },
  {
    n: "04",
    title: "Showcase binder",
    body: "Curate a 3×3 binder of your best pulls. Only cards you actually own make the cut.",
  },
  {
    n: "05",
    title: "Friends & rivalry",
    body: "Compare set completion with friends and see exactly which cards you're both missing.",
  },
  {
    n: "06",
    title: "Live pull feed",
    body: "Big hits land on the global feed. React when someone rips the Charizard.",
  },
];

export default async function LandingPage() {
  const user = await getSessionUser();

  return (
    <div className="flex flex-col gap-28 pb-8 pt-10 sm:pt-16">
      {/* Hero — brand first, MWG editorial scale */}
      <section className="relative">
        <SectionEyebrow>Non-profit fan project · free forever</SectionEyebrow>
        <h1 className="title-xl mt-6 max-w-4xl">
          VaultedTCG
        </h1>
        <p className="title-m mt-4 max-w-2xl text-muted">
          Unique pack openings, made with care.
        </p>
        <p className="mt-6 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
          Rip boosters with real-world pull rates. Build a permanent collection,
          curate your binder, and chase luck with friends.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <LinkButton href="/open-pack">
            Open a free pack <span aria-hidden>→</span>
          </LinkButton>
          {!user && (
            <LinkButton href="/login" variant="dark">
              Create trainer account
            </LinkButton>
          )}
          {user && (
            <LinkButton href="/dashboard" variant="secondary">
              Dashboard
            </LinkButton>
          )}
        </div>
        <p className="mwg-label-s mt-5 text-muted">
          Sandbox mode needs no account — jump straight in.
        </p>
      </section>

      {/* Trust / numbers strip */}
      <section className="grid grid-cols-2 gap-6 border-y border-border py-10 sm:grid-cols-4">
        {[
          { k: "20k+", v: "Cards imported" },
          { k: "174", v: "Expansions" },
          { k: "3", v: "Packs / day" },
          { k: "∞", v: "Sandbox packs" },
        ].map((stat) => (
          <div key={stat.v}>
            <div className="title-m">{stat.k}</div>
            <div className="mwg-label mt-2 text-muted">{stat.v}</div>
          </div>
        ))}
      </section>

      {/* What it's all about */}
      <section className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
        <div>
          <SectionEyebrow>What it&apos;s all about</SectionEyebrow>
          <h2 className="title-l mt-4">
            Open packs.
            <br />
            Build legacy.
          </h2>
        </div>
        <div className="flex flex-col justify-end gap-5 text-base leading-relaxed text-muted sm:text-lg">
          <p>
            A collection of era-accurate booster simulations so you can learn
            real pull rhythms — and use them instantly in a social collecting game.
          </p>
          <p>
            Sandbox is unlimited fun. Trainer Mode is the long game: streaks,
            XP, binders, friends, and a feed that celebrates the big ones.
          </p>
        </div>
      </section>

      {/* Numbered features — MWG list style */}
      <section>
        <SectionEyebrow>Features</SectionEyebrow>
        <h2 className="title-l mt-4 max-w-2xl">
          Built for trainers who take luck seriously.
        </h2>
        <div className="mt-12 grid gap-0 border-t border-border sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.n}
              className="group border-b border-border p-6 transition-colors hover:bg-surface sm:odd:border-r"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="title-s">{f.title}</h3>
                <span className="mwg-label text-muted">{f.n}</span>
              </div>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-base">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Two modes */}
      <section>
        <SectionEyebrow>Two ways to play</SectionEyebrow>
        <h2 className="title-l mt-4">So, ready to rip?</h2>
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="flex flex-col rounded-[20px] bg-surface p-8 sm:p-10">
            <span className="mwg-label text-muted">01 · Free</span>
            <h3 className="title-m mt-3">Sandbox</h3>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-muted sm:text-base">
              <li>Unlimited packs, no account</li>
              <li>Full opening with rarity animations</li>
              <li>Session history to flex your luck</li>
              <li>Cards are not saved — pure fun</li>
            </ul>
            <LinkButton href="/open-pack?mode=sandbox" variant="secondary" className="mt-8 w-fit">
              Play sandbox →
            </LinkButton>
          </div>
          <div className="flex flex-col rounded-[20px] bg-anthracite p-8 text-white sm:p-10">
            <span className="mwg-label text-primary">02 · Progression</span>
            <h3 className="title-m mt-3 text-white">Trainer Mode</h3>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-white/70 sm:text-base">
              <li>3 packs per day — make them count</li>
              <li>Every card joins your collection</li>
              <li>Streaks, XP, levels and achievements</li>
              <li>Binder, friends and feed glory</li>
            </ul>
            <LinkButton
              href={user ? "/open-pack?mode=trainer" : "/login"}
              className="mt-8 w-fit"
            >
              {user ? "Open today's packs →" : "Sign up free →"}
            </LinkButton>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="rounded-[20px] bg-primary px-8 py-14 text-center text-ink sm:px-16 sm:py-20">
        <SectionEyebrow>
          <span className="text-ink/60">From Base Set to Mega Evolution</span>
        </SectionEyebrow>
        <h2 className="title-l mt-4">
          Browse every
          <br />
          expansion.
        </h2>
        <div className="mt-8 flex justify-center">
          <LinkButton href="/sets" variant="dark">
            Explore sets →
          </LinkButton>
        </div>
        <p className="mwg-label-s mt-6 text-ink/50">
          Or jump to{" "}
          <Link href="/open-pack/sv3pt5" className="underline underline-offset-4">
            Scarlet & Violet 151
          </Link>
        </p>
      </section>
    </div>
  );
}
