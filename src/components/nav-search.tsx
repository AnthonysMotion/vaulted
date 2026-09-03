"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CatalogImage } from "@/components/catalog-image";
import { SafeImage } from "@/components/safe-image";
import { ShuffleLabel } from "@/components/shuffle-label";
import {
  MAX_SEARCH_LENGTH,
  MIN_SEARCH_LENGTH,
  cardResultHref,
  type SearchResponse,
} from "@/lib/search";

const DEBOUNCE_MS = 200;
const SURFACE_2 = "var(--color-grey-800)";
const BORDER = "var(--color-grey-700)";
const CATEGORY = "var(--color-grey-300)";

const EMPTY: SearchResponse = { q: "", trainers: [], sets: [], cards: [] };

/** Idle state doubles as the entry point to the public browse surfaces. */
const QUICK_LINKS = [
  {
    href: "/open-pack",
    title: "Open a pack",
    meta: "Free sandbox pulls, no account needed",
  },
  {
    href: "/sets",
    title: "All sets",
    meta: "Every expansion from Base Set to today",
  },
  {
    href: "/feed",
    title: "Activity feed",
    meta: "Big pulls from every trainer",
  },
];

function SearchIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      fill="none"
      className="h-4 w-4 shrink-0"
    >
      <circle cx="7" cy="7" r="4.75" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10.5 10.5 14 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CategoryChip({ label }: { label: string }) {
  return (
    <div
      className="mb-2 mt-3 w-full px-4 py-2.5 font-mono text-[0.6875rem] uppercase leading-tight tracking-[-0.01em]"
      style={{ color: CATEGORY, backgroundColor: SURFACE_2 }}
    >
      {label}
    </div>
  );
}

function ResultRow({
  href,
  active,
  onActivate,
  onHover,
  media,
  title,
  meta,
}: {
  href: string;
  active: boolean;
  onActivate: () => void;
  onHover: () => void;
  media: ReactNode;
  title: string;
  meta: string;
}) {
  const [trigger, setTrigger] = useState(0);

  return (
    <Link
      href={href}
      onClick={onActivate}
      onMouseEnter={() => {
        onHover();
        setTrigger((n) => n + 1);
      }}
      className="group flex items-center gap-3 px-3 py-2.5 text-white transition-colors duration-150"
      style={{
        backgroundColor: active ? "rgba(255,255,255,0.06)" : "transparent",
      }}
    >
      {media}
      <span className="min-w-0 flex-1 overflow-hidden">
        <span className="block">
          <ShuffleLabel
            text={title}
            trigger={trigger}
            accentColor={false}
            align="left"
            className="text-[0.9375rem] leading-tight tracking-[-0.01em] text-white"
          />
        </span>
        <span className="mt-1 block">
          <ShuffleLabel
            text={meta}
            trigger={trigger}
            accentColor={false}
            align="left"
            className="text-[0.75rem] leading-tight tracking-[-0.01em] text-muted"
          />
        </span>
      </span>
    </Link>
  );
}

/**
 * Public search across trainers, cards, and sets. Card hits deep-link into the
 * set gallery, which pops the lightbox for that card.
 */
export function NavSearch({ onNavigate }: { onNavigate: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const term = query.trim();
  const ready = term.length >= MIN_SEARCH_LENGTH;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (term.length < MIN_SEARCH_LENGTH) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(term)}`, {
        signal: controller.signal,
      })
        .then((res) => (res.ok ? (res.json() as Promise<SearchResponse>) : EMPTY))
        .then(setResults)
        .catch(() => undefined)
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  // Flat order must mirror the rendered section order for arrow-key nav.
  const rows = useMemo(() => {
    if (!ready) return QUICK_LINKS.map((l) => l.href);
    return [
      ...results.trainers.map((t) => `/profile/${t.username}`),
      ...results.cards.map(cardResultHref),
      ...results.sets.map((s) => `/sets/${s.id}`),
    ];
  }, [ready, results]);

  const active = rows.length > 0 ? Math.min(activeIndex, rows.length - 1) : -1;
  const showEmpty = ready && !loading && rows.length === 0;

  let cursor = -1;
  const nextIndex = () => {
    cursor += 1;
    return cursor;
  };

  return (
    <div className="flex flex-col">
      <div
        className="flex items-center gap-3 px-4 py-3.5 text-white"
        style={{ borderBottom: `1px solid ${BORDER}` }}
      >
        <span className="text-muted">
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          maxLength={MAX_SEARCH_LENGTH}
          placeholder="Search trainers, cards, and sets"
          aria-label="Search trainers, cards, and sets"
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) => Math.min(i + 1, rows.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => Math.max(i - 1, -1));
            } else if (e.key === "Enter" && active >= 0 && rows[active]) {
              e.preventDefault();
              router.push(rows[active]);
              onNavigate();
            }
          }}
          className="w-full bg-transparent text-[0.9375rem] tracking-[-0.01em] text-white outline-none placeholder:text-muted-2 [&::-webkit-search-cancel-button]:appearance-none"
        />
        {loading ? (
          <span className="shrink-0 font-mono text-[0.625rem] uppercase text-muted-2">
            …
          </span>
        ) : null}
      </div>

      <div
        className={`max-h-[24rem] overflow-y-auto px-2 pb-3 transition-opacity duration-150 ${
          loading ? "opacity-60" : "opacity-100"
        }`}
      >
        {!ready ? (
          <>
            <p className="px-3 pb-1 pt-4 text-[0.8125rem] leading-relaxed text-muted">
              Type at least {MIN_SEARCH_LENGTH} characters to find trainers by
              username, cards by name, or sets by name and series.
            </p>
            <CategoryChip label="Browse/" />
            {QUICK_LINKS.map((link) => {
              const index = nextIndex();
              return (
                <ResultRow
                  key={link.href}
                  href={link.href}
                  active={index === active}
                  onActivate={onNavigate}
                  onHover={() => setActiveIndex(index)}
                  title={link.title}
                  meta={link.meta}
                  media={
                    <span
                      aria-hidden
                      className="grid h-9 w-9 shrink-0 place-items-center bg-surface-2 text-muted transition-colors duration-150 group-hover:bg-accent group-hover:text-white"
                    >
                      →
                    </span>
                  }
                />
              );
            })}
          </>
        ) : null}

        {showEmpty ? (
          <p className="px-3 py-6 text-[0.8125rem] text-muted">
            No trainers, cards, or sets match “{term}”.
          </p>
        ) : null}

        {ready && results.trainers.length > 0 ? (
          <>
            <CategoryChip label="Trainers/" />
            {results.trainers.map((trainer) => {
              const index = nextIndex();
              return (
                <ResultRow
                  key={trainer.username}
                  href={`/profile/${trainer.username}`}
                  active={index === active}
                  onActivate={onNavigate}
                  onHover={() => setActiveIndex(index)}
                  title={trainer.username}
                  meta={`Level ${trainer.level} · ${trainer.totalCardsCollected.toLocaleString()} cards`}
                  media={
                    <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden bg-surface">
                      <SafeImage
                        src={trainer.avatarUrl}
                        alt=""
                        fill
                        sizes="36px"
                        className="object-cover"
                        fallback={
                          <span className="text-[0.6875rem] uppercase text-muted">
                            {trainer.username.slice(0, 1)}
                          </span>
                        }
                      />
                    </span>
                  }
                />
              );
            })}
          </>
        ) : null}

        {ready && results.cards.length > 0 ? (
          <>
            <CategoryChip label="Cards/" />
            {results.cards.map((card) => {
              const index = nextIndex();
              return (
                <ResultRow
                  key={card.id}
                  href={cardResultHref(card)}
                  active={index === active}
                  onActivate={onNavigate}
                  onHover={() => setActiveIndex(index)}
                  title={card.name}
                  meta={`${card.setName} · #${card.number}${
                    card.rarity ? ` · ${card.rarity}` : ""
                  }`}
                  media={
                    <span className="relative h-12 w-[2.15rem] shrink-0 overflow-hidden bg-surface">
                      <CatalogImage
                        src={card.imageSmall}
                        alt=""
                        fill
                        sizes="35px"
                        className="object-cover"
                        fallback={<span />}
                      />
                    </span>
                  }
                />
              );
            })}
          </>
        ) : null}

        {ready && results.sets.length > 0 ? (
          <>
            <CategoryChip label="Sets/" />
            {results.sets.map((set) => {
              const index = nextIndex();
              return (
                <ResultRow
                  key={set.id}
                  href={`/sets/${set.id}`}
                  active={index === active}
                  onActivate={onNavigate}
                  onHover={() => setActiveIndex(index)}
                  title={set.name}
                  meta={`${set.series} · ${set.releaseDate.split("-")[0]} · ${set.total} cards`}
                  media={
                    <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden">
                      <CatalogImage
                        src={set.logoUrl ?? set.symbolUrl}
                        alt=""
                        fill
                        sizes="36px"
                        className="object-contain"
                        fallback={<span />}
                      />
                    </span>
                  }
                />
              );
            })}
          </>
        ) : null}
      </div>
    </div>
  );
}
