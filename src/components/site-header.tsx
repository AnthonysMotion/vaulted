"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { NavSearch } from "@/components/nav-search";
import { SafeImage } from "@/components/safe-image";
import { ShuffleLabel } from "@/components/shuffle-label";
import { SignOutButton } from "@/components/sign-out-button";
import { VisionWordmark } from "@/components/vision-logo";

const GITHUB_URL = "https://github.com/AnthonysMotion/visiontcg";

type NavLink = {
  href: string;
  label: string;
  description: string;
  /** Opens in a new tab and renders an outbound arrow. */
  external?: boolean;
};

type NavSection = {
  category: string;
  links: NavLink[];
};

type NavGroup = {
  kind: "group";
  id: string;
  label: string;
  columns: NavSection[];
};

/** Opens the same dropdown chrome as a group, but holds the search panel. */
type NavSearchItem = {
  kind: "search";
  id: "search";
  label: string;
};

type NavItem = NavGroup | NavSearchItem;

type Profile = {
  username: string;
  avatarUrl: string | null;
};

/** Theme tokens — edit `--color-blur` / greys in `globals.css`. */
const BLUR = "var(--color-blur)";
const SURFACE = "var(--color-grey-900)";
const SURFACE_2 = "var(--color-grey-800)";
const BORDER = "var(--color-grey-700)";
const MUTED = "var(--color-grey-400)";
const CATEGORY = "var(--color-grey-300)";
const CLOSE_DELAY_MS = 120;

function buildNavItems(profile: Profile | null): NavItem[] {
  const play: NavGroup = {
    kind: "group",
    id: "play",
    label: "Play",
    columns: [
      {
        category: "Opening/",
        links: [
          {
            href: "/open-pack",
            label: "Open a pack",
            description: profile
              ? "Spend a daily pack, or switch to sandbox"
              : "Free sandbox pulls — no account needed",
          },
          {
            href: "/sets",
            label: "Browse sets",
            description: "Pick an expansion and see its checklist",
          },
        ],
      },
    ],
  };

  // Nothing in here exists for a signed-out visitor.
  const collection: NavGroup | null = profile
    ? {
        kind: "group",
        id: "collection",
        label: "Collection",
        columns: [
          {
            category: "Vault/",
            links: [
              {
                href: "/collection",
                label: "My cards",
                description: "Every card you have pulled",
              },
              {
                href: `/binder/${profile.username}`,
                label: "Binder",
                description: "Arrange your public showcase",
              },
            ],
          },
          {
            category: "Progress/",
            links: [
              {
                href: "/dashboard",
                label: "Dashboard",
                description: "Daily packs, XP, and set completion",
              },
              {
                href: "/achievements",
                label: "Achievements",
                description: "Milestones, streaks, and badges",
              },
            ],
          },
          {
            category: "Social/",
            links: [
              {
                href: "/friends",
                label: "Friends",
                description: "Requests, binders, and collection compare",
              },
              {
                href: "/feed",
                label: "Activity feed",
                description: "Big pulls from every trainer",
              },
            ],
          },
        ],
      }
    : null;

  const search: NavSearchItem = {
    kind: "search",
    id: "search",
    label: "Search",
  };

  const about: NavGroup = {
    kind: "group",
    id: "about",
    label: "About",
    columns: [
      {
        category: "Project/",
        links: [
          {
            href: "/about",
            label: "About Vision",
            description: "Fan project notes, pull-rate research, and credits",
          },
          {
            href: GITHUB_URL,
            label: "GitHub",
            description: "Source code, issues, and roadmap",
            external: true,
          },
        ],
      },
    ],
  };

  return collection ? [play, collection, search, about] : [play, search, about];
}

function PlusIcon({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden
      className="grid h-[1.625rem] w-[1.625rem] shrink-0 place-items-center p-2 text-white transition-colors duration-150"
      style={{ backgroundColor: open ? BLUR : BORDER }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 10 10"
        fill="none"
        className={`h-2.5 w-2.5 transition-transform duration-200 ease-[cubic-bezier(0.215,0.61,0.355,1)] ${
          open ? "rotate-45" : "rotate-0"
        }`}
      >
        <path
          d="M5.5 10H4.5V5.92H5.5V10ZM10 4.5V5.5H5.92V4.5H10ZM4.08 5.5H0V4.5H4.08V5.5ZM5.5 4.08H4.5V0H5.5V4.08Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

export function SiteHeader({
  homeHref,
  profile,
}: {
  homeHref: string;
  profile: Profile | null;
}) {
  const pathname = usePathname();
  const navItems = buildNavItems(profile);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [ctaOpen, setCtaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--site-header-offset",
      "5.25rem",
    );
  }, []);

  useEffect(() => {
    setOpenGroup(null);
    setCtaOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenGroup(null);
        setCtaOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const openMenu = (id: string) => {
    clearCloseTimer();
    setCtaOpen(false);
    setOpenGroup(id);
  };

  const closeMenus = useCallback(() => {
    clearCloseTimer();
    setOpenGroup(null);
    setCtaOpen(false);
  }, [clearCloseTimer]);

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => {
      setOpenGroup(null);
      setCtaOpen(false);
    }, CLOSE_DELAY_MS);
  };

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  const activeGroup =
    navItems.find(
      (item): item is NavGroup => item.kind === "group" && item.id === openGroup,
    ) ?? null;
  const searchOpen = openGroup === "search";
  const menuOpen = Boolean(activeGroup || ctaOpen || searchOpen);
  const columnCount = Math.max(
    1,
    activeGroup?.columns.filter((c) => c.links.length > 0).length ?? 1,
  );

  return (
    <>
      {/* Page scrim — sits under the floating chrome, above page content */}
      <div
        aria-hidden={!menuOpen}
        className={`fixed inset-0 z-[250] bg-black/55 backdrop-blur-[6px] transition-[opacity,visibility] duration-200 ease-[var(--ease-sui)] ${
          menuOpen
            ? "visible opacity-100"
            : "invisible pointer-events-none opacity-0"
        }`}
        onClick={closeMenus}
      />

      <div className="pointer-events-none fixed inset-x-0 top-0 z-[260]">
        <div className="pointer-events-none px-3 pt-3 sm:px-4">
          <div
            className="pointer-events-auto relative mx-auto w-full max-w-[1600px]"
            onMouseEnter={clearCloseTimer}
            onMouseLeave={scheduleClose}
          >
            <div
              className="relative z-[3] flex items-center justify-between px-[1.031em] py-[1.5em]"
              style={{
                backgroundColor: SURFACE,
              }}
            >
              <Link
                href={homeHref}
                className="relative z-[1] shrink-0 text-white"
                onClick={() => {
                  setOpenGroup(null);
                  setMobileOpen(false);
                }}
              >
                <VisionWordmark logoSize={36} priority />
              </Link>

              <nav className="pointer-events-none absolute inset-0 hidden items-center justify-center lg:flex">
                <ul className="pointer-events-auto flex items-stretch">
                  {navItems.map((item) => (
                    <NavGroupButton
                      key={item.id}
                      label={item.label}
                      open={openGroup === item.id}
                      onOpen={() => openMenu(item.id)}
                      onClick={() =>
                        setOpenGroup((current) =>
                          current === item.id ? null : item.id,
                        )
                      }
                    />
                  ))}
                </ul>
              </nav>

              <div className="relative z-[1] hidden items-center lg:flex">
                {profile ? (
                  <div
                    onMouseEnter={() => {
                      clearCloseTimer();
                      setOpenGroup(null);
                      setCtaOpen(true);
                    }}
                  >
                    <ProfileButton
                      open={ctaOpen}
                      username={profile.username}
                      avatarUrl={profile.avatarUrl}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CtaLink href="/login" label="Log in" variant="ghost" />
                    <CtaLink href="/login?mode=signup" label="Sign up" />
                  </div>
                )}
              </div>

              <div className="relative z-[1] flex items-center gap-2 lg:hidden">
                <CtaLink
                  href={profile ? "/open-pack" : "/login?mode=signup"}
                  label={profile ? "Open pack" : "Sign up"}
                />
                <button
                  type="button"
                  aria-label={mobileOpen ? "Close menu" : "Open menu"}
                  aria-expanded={mobileOpen}
                  onClick={() => setMobileOpen((v) => !v)}
                  className="grid h-9 w-9 place-items-center text-white"
                  style={{ backgroundColor: BORDER }}
                >
                  <HamburgerIcon open={mobileOpen} />
                </button>
              </div>
            </div>

            {searchOpen ? (
              <div
                key="search-panel"
                className="absolute left-1/2 top-full z-[2] w-full max-w-[34em] -translate-x-1/2"
              >
                <div
                  className="vision-dd-bounce w-full overflow-hidden border-2"
                  style={{
                    backgroundColor: SURFACE,
                    borderColor: SURFACE_2,
                  }}
                >
                  <NavSearch onNavigate={closeMenus} />
                </div>
              </div>
            ) : null}

            {/* Panels sized to content only — no full-width invisible hover trap */}
            {activeGroup ? (
              <div
                key={activeGroup.id}
                className="absolute left-1/2 top-full z-[2] w-full -translate-x-1/2"
                style={{
                  maxWidth:
                    columnCount >= 3
                      ? "72.5em"
                      : columnCount === 2
                        ? "52em"
                        : "30em",
                }}
              >
                <div
                  className="vision-dd-bounce grid w-full overflow-hidden border-2"
                  style={{
                    backgroundColor: SURFACE,
                    borderColor: SURFACE_2,
                    gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                    minHeight: columnCount > 1 ? "16rem" : undefined,
                  }}
                >
                  {activeGroup.columns
                    .filter((col) => col.links.length > 0)
                    .map((col, colIndex) => (
                      <div
                        key={col.category}
                        className={`flex h-full min-w-0 flex-col px-2 pt-1 ${
                          columnCount > 1 ? "pb-12" : "pb-4"
                        }`}
                        style={
                          colIndex > 0
                            ? { borderLeft: `1px dashed ${BORDER}` }
                            : undefined
                        }
                      >
                        <div
                          className="mb-3 w-full px-4 py-2.5 font-mono text-[0.6875rem] uppercase leading-tight tracking-[-0.01em]"
                          style={{
                            color: CATEGORY,
                            backgroundColor: SURFACE_2,
                          }}
                        >
                          {col.category}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          {col.links.map((link) => (
                            <MegaLink key={link.href + link.label} link={link} />
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : null}

            {profile && ctaOpen && !activeGroup ? (
              <div
                key="account-menu"
                className="absolute right-0 top-full z-[2] w-full max-w-[22em]"
              >
                <div
                  className="vision-dd-bounce w-full overflow-hidden border-2"
                  style={{
                    backgroundColor: SURFACE,
                    borderColor: SURFACE_2,
                    minHeight: "16rem",
                  }}
                >
                  <div className="flex h-full min-w-0 flex-col px-2 pb-12 pt-1">
                    <div
                      className="mb-3 w-full px-4 py-2.5 font-mono text-[0.6875rem] uppercase leading-tight tracking-[-0.01em]"
                      style={{
                        color: CATEGORY,
                        backgroundColor: SURFACE_2,
                      }}
                    >
                      Account/
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <MegaLink
                        link={{
                          href: `/profile/${profile.username}`,
                          label: "Your profile",
                          description: "Your public trainer page",
                        }}
                      />
                      <MegaLink
                        link={{
                          href: "/account",
                          label: "Edit account",
                          description: "Username, bio, banner, and settings",
                        }}
                      />
                      <MegaSignOut />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Spacer so page content clears the fixed floating bar */}
      <div aria-hidden className="h-[5.25rem]" />

      {mobileOpen ? (
        <div className="fixed inset-0 z-[255] flex flex-col bg-black lg:hidden">
          <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
            <Link
              href={homeHref}
              className="text-white"
              onClick={() => setMobileOpen(false)}
            >
              <VisionWordmark logoSize={36} />
            </Link>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="grid h-9 w-9 place-items-center text-white"
              style={{ backgroundColor: BORDER }}
            >
              <HamburgerIcon open />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-10 pt-4">
            {profile ? (
              <Link
                href="/account"
                onClick={() => setMobileOpen(false)}
                className="mb-6 flex items-center gap-3 border border-white/10 px-3 py-3"
              >
                <span className="relative grid h-10 w-10 place-items-center overflow-hidden bg-surface">
                  <SafeImage
                    src={profile.avatarUrl}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-cover"
                    fallback={<span className="h-2.5 w-2.5 bg-white" />}
                  />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {profile.username}
                  </p>
                  <p className="text-xs text-muted-2">Manage your account</p>
                </div>
              </Link>
            ) : null}

            <div className="flex flex-col">
              {navItems.map((item) => {
                const open = openGroup === item.id;

                if (item.kind === "search") {
                  return (
                    <div key={item.id} className="border-b border-white/10">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between py-3 text-left"
                        onClick={() =>
                          setOpenGroup((current) =>
                            current === item.id ? null : item.id,
                          )
                        }
                      >
                        <span className="text-[17px] font-medium tracking-[-0.02em] text-white">
                          {item.label}
                        </span>
                        <PlusIcon open={open} />
                      </button>
                      {open ? (
                        <div
                          className="mb-4 border"
                          style={{ borderColor: BORDER }}
                        >
                          <NavSearch
                            onNavigate={() => {
                              setMobileOpen(false);
                              setOpenGroup(null);
                            }}
                          />
                        </div>
                      ) : null}
                    </div>
                  );
                }

                return (
                  <div key={item.id} className="border-b border-white/10">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between py-3 text-left"
                      onClick={() =>
                        setOpenGroup((current) =>
                          current === item.id ? null : item.id,
                        )
                      }
                    >
                      <span className="text-[17px] font-medium tracking-[-0.02em] text-white">
                        {item.label}
                      </span>
                      <PlusIcon open={open} />
                    </button>
                    {open ? (
                      <div className="flex flex-col gap-4 pb-5">
                        {item.columns.map((col) => (
                          <div key={col.category}>
                            <div
                              className="mb-2 px-3 py-2 font-mono text-[0.625rem] uppercase"
                              style={{
                                color: CATEGORY,
                                backgroundColor: SURFACE_2,
                              }}
                            >
                              {col.category}
                            </div>
                            {col.links.map((link) => {
                              const body = (
                                <>
                                  <div className="text-[15px] text-white">
                                    {link.label}
                                    {link.external ? " ↗" : null}
                                  </div>
                                  <p
                                    className="mt-0.5 text-[13px]"
                                    style={{ color: MUTED }}
                                  >
                                    {link.description}
                                  </p>
                                </>
                              );
                              return link.external ? (
                                <a
                                  key={link.href + link.label}
                                  href={link.href}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  onClick={() => setMobileOpen(false)}
                                  className="block px-2 py-2"
                                >
                                  {body}
                                </a>
                              ) : (
                                <Link
                                  key={link.href + link.label}
                                  href={link.href}
                                  onClick={() => setMobileOpen(false)}
                                  className="block px-2 py-2"
                                >
                                  {body}
                                </Link>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {profile ? (
              <Link
                href="/open-pack"
                onClick={() => setMobileOpen(false)}
                className="mt-8 flex h-12 items-center justify-center text-[15px] font-normal text-white"
                style={{ backgroundColor: BLUR }}
              >
                Open a pack
              </Link>
            ) : (
              <div className="mt-8 flex flex-col gap-2">
                <Link
                  href="/login?mode=signup"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-12 items-center justify-center text-[15px] font-normal text-white"
                  style={{ backgroundColor: BLUR }}
                >
                  Sign up
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-12 items-center justify-center border text-[15px] font-normal text-white"
                  style={{ borderColor: BORDER }}
                >
                  Log in
                </Link>
              </div>
            )}

            {profile ? (
              <SignOutButton
                className="mt-4 w-full py-3 text-center text-sm text-muted"
                onClick={() => setMobileOpen(false)}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

function NavGroupButton({
  label,
  open,
  onOpen,
  onClick,
}: {
  label: string;
  open: boolean;
  onOpen: () => void;
  onClick: () => void;
}) {
  const [scrambleTrigger, setScrambleTrigger] = useState(0);

  return (
    <li
      className="flex"
      onMouseEnter={() => {
        onOpen();
        setScrambleTrigger((n) => n + 1);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={onClick}
        className="flex cursor-pointer items-center gap-2 px-[1.125em] py-[0.375em]"
        style={{
          backgroundColor: open ? "rgba(255,255,255,0.03)" : "transparent",
        }}
      >
        <ShuffleLabel
          text={label}
          trigger={scrambleTrigger}
          className="text-[0.875rem] font-normal tracking-[-0.01em] text-white"
        />
        <PlusIcon open={open} />
      </button>
    </li>
  );
}

function ProfileButton({
  open,
  username,
  avatarUrl,
}: {
  open: boolean;
  username: string;
  avatarUrl: string | null;
}) {
  return (
    <button
      type="button"
      className="inline-flex h-10 max-w-[14rem] cursor-pointer items-center gap-2.5 px-3 text-[0.875rem] font-normal text-white transition-colors duration-150 hover:bg-white/[0.04]"
      style={{ backgroundColor: SURFACE_2 }}
      aria-expanded={open}
      aria-haspopup="menu"
      aria-label={`Profile menu for ${username}`}
    >
      <span className="relative grid h-7 w-7 shrink-0 place-items-center overflow-hidden bg-surface">
        <SafeImage
          src={avatarUrl}
          alt=""
          fill
          sizes="28px"
          className="object-cover"
          fallback={
            <span
              className="text-[0.6875rem] font-medium uppercase leading-none"
              style={{ color: CATEGORY }}
            >
              {username.slice(0, 1)}
            </span>
          }
        />
      </span>
      <span className="min-w-0 truncate tracking-[-0.01em]">{username}</span>
      <PlusIcon open={open} />
    </button>
  );
}

function CtaLink({
  href,
  label,
  variant = "primary",
}: {
  href: string;
  label: string;
  variant?: "primary" | "ghost";
}) {
  const [trigger, setTrigger] = useState(0);
  const ghost = variant === "ghost";

  return (
    <Link
      href={href}
      className={`inline-flex h-10 items-center justify-center px-5 text-[0.875rem] font-normal text-white transition-colors duration-150 ${
        ghost ? "border hover:bg-white/[0.06]" : "hover:opacity-90"
      }`}
      style={
        ghost ? { borderColor: BORDER } : { backgroundColor: BLUR }
      }
      onMouseEnter={() => setTrigger((n) => n + 1)}
    >
      <ShuffleLabel
        text={label}
        trigger={trigger}
        accentColor={ghost ? "var(--color-blur)" : "var(--color-black)"}
        className="text-[0.875rem] font-normal tracking-[-0.01em] text-white"
      />
    </Link>
  );
}

function MegaLink({ link }: { link: NavLink }) {
  const [trigger, setTrigger] = useState(0);

  const className =
    "group flex w-full items-start gap-1.5 px-3 py-3 text-white transition-colors duration-150 hover:bg-[var(--color-blur)]";

  const body = (
    <span className="min-w-0 flex-1">
      <span className="flex items-center gap-1.5">
        <ShuffleLabel
          text={link.label}
          trigger={trigger}
          accentColor={false}
          align="left"
          className="block text-[1rem] font-normal leading-none tracking-[-0.01em] text-white"
        />
        {link.external ? (
          <svg
            aria-hidden
            viewBox="0 0 10 10"
            fill="none"
            className="h-2.5 w-2.5 shrink-0"
          >
            <path
              d="M1 9 9 1M9 1H3.4M9 1v5.6"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="square"
            />
          </svg>
        ) : null}
      </span>
      <ShuffleLabel
        text={link.description}
        trigger={trigger}
        accentColor={false}
        align="left"
        className="mt-1.5 block text-[0.8125rem] font-normal leading-snug tracking-[-0.01em] text-white"
      />
    </span>
  );

  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noreferrer noopener"
        className={className}
        onMouseEnter={() => setTrigger((n) => n + 1)}
      >
        {body}
      </a>
    );
  }

  return (
    <Link
      href={link.href}
      className={className}
      onMouseEnter={() => setTrigger((n) => n + 1)}
    >
      {body}
    </Link>
  );
}

function MegaSignOut() {
  const [trigger, setTrigger] = useState(0);

  return (
    <SignOutButton
      className="group flex w-full cursor-pointer flex-col items-start px-3 py-3 text-left text-white transition-colors duration-150 hover:bg-[var(--color-blur)]"
      onMouseEnter={() => setTrigger((n) => n + 1)}
    >
      <ShuffleLabel
        text="Sign out"
        trigger={trigger}
        accentColor={false}
        align="left"
        className="block text-[1rem] font-normal leading-none tracking-[-0.01em] text-white"
      />
      <ShuffleLabel
        text="End your session on this device"
        trigger={trigger}
        accentColor={false}
        align="left"
        className="mt-1.5 block text-[0.8125rem] font-normal leading-snug tracking-[-0.01em] text-white"
      />
    </SignOutButton>
  );
}

function HamburgerIcon({ open }: { open?: boolean }) {
  return (
    <span className="relative block h-3.5 w-4" aria-hidden>
      <span
        className={`absolute left-0 block h-px w-4 bg-current transition-transform duration-200 ${
          open ? "top-1.5 rotate-45" : "top-0"
        }`}
      />
      <span
        className={`absolute left-0 top-1.5 block h-px w-4 bg-current transition-opacity duration-200 ${
          open ? "opacity-0" : "opacity-100"
        }`}
      />
      <span
        className={`absolute left-0 block h-px w-4 bg-current transition-transform duration-200 ${
          open ? "top-1.5 -rotate-45" : "top-3"
        }`}
      />
    </span>
  );
}
