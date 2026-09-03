import Link from "next/link";
import { LinkButton, SectionEyebrow } from "@/components/ui";
import { VisionWordmark } from "@/components/vision-logo";
import { DAILY_PACK_LIMIT } from "@/lib/game/constants";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-16 md:gap-20">
      <header>
        <div className="mb-6">
          <VisionWordmark logoSize={36} />
        </div>
        <SectionEyebrow>About</SectionEyebrow>
        <h1 className="mt-4 text-4xl font-black tracking-tighter text-white sm:text-5xl">
          A pack simulator for people who like opening packs.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted">
          Vision is a free, non-profit fan project. Open Pokémon TCG boosters with
          researched slot odds, keep what you pull, and show cards off to friends.
        </p>
      </header>

      <section className="flex flex-col gap-4 border-t border-border pt-10">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-2">
          What you can do
        </h2>
        <ul className="space-y-4 text-muted leading-relaxed">
          <li>
            <span className="font-medium text-white">Sandbox</span> — open as many
            packs as you want. Nothing is saved.
          </li>
          <li>
            <span className="font-medium text-white">Trainer</span> —{" "}
            {DAILY_PACK_LIMIT} packs a day, cards go into your collection, XP
            and streaks count.
          </li>
          <li>
            <span className="font-medium text-white">Binder &amp; profile</span> —
            pin favourites on a public 3×3 page and share your trainer link.
          </li>
          <li>
            <span className="font-medium text-white">Friends &amp; feed</span> —
            compare collections, react to pulls, see what other people hit.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-4 border-t border-border pt-10">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-2">
          How packs work
        </h2>
        <p className="text-muted leading-relaxed">
          Packs follow era-specific slot layouts — commons, reverses, rares, and
          the rest — instead of drawing random cards from the whole set. Odds are
          based on community pack studies (Elite Fourum samples, TCGplayer Infinite
          work, ThePriceDex models, and similar sources). Configs live in code so
          you can inspect and simulate them.
        </p>
        <p className="text-sm text-muted-2 leading-relaxed">
          Rates are researched estimates, not official Pokémon Company figures.
          Real sealed product can differ by print run and region.
        </p>
      </section>

      <section className="flex flex-col gap-4 border-t border-border pt-10">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-2">
          Credits &amp; data
        </h2>
        <p className="text-muted leading-relaxed">
          Card names, set lists, and images come from the community{" "}
          <a
            href="https://github.com/PokemonTCG/pokemon-tcg-data"
            className="text-muted underline underline-offset-4 hover:text-white"
            target="_blank"
            rel="noreferrer"
          >
            pokemon-tcg-data
          </a>{" "}
          project. Optional market prices (when enabled) use the Pokémon TCG API.
        </p>
      </section>

      <section className="flex flex-col gap-4 border-t border-border pt-10">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-2">
          Disclaimer
        </h2>
        <p className="text-muted leading-relaxed">
          Pokémon and Pokémon TCG are trademarks of Nintendo, Creatures Inc., and
          GAME FREAK inc. Vision is an unofficial fan project and is not
          affiliated with, endorsed by, or connected to The Pokémon Company,
          Nintendo, or related rights holders. No real money packs, gambling, or
          card sales here — just a simulator.
        </p>
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-10">
        <LinkButton href="/open-pack" variant="primary" className="h-11 px-6">
          Open a pack
        </LinkButton>
        <Link
          href="/sets"
          className="text-sm font-medium text-muted-2 underline underline-offset-4 hover:text-white"
        >
          Browse sets
        </Link>
      </div>
    </div>
  );
}
