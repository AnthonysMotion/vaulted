"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { SafeImage } from "@/components/safe-image";
import { SignOutButton } from "./sign-out-button";

type NavLink = { href: string; label: string };

const solid =
  "inline-flex h-10 items-center justify-center rounded-lg bg-white px-4 text-xs font-bold text-black transition-colors active:scale-[0.98] hover:bg-zinc-200";
const glassBtn =
  "inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-black/50 text-white backdrop-blur-md transition-colors active:scale-[0.98] hover:bg-white/10";

const listVariants = {
  open: {
    transition: { staggerChildren: 0.04, delayChildren: 0.06 },
  },
  closed: {},
};

const itemVariants = {
  open: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 420, damping: 32 },
  },
  closed: { opacity: 0, y: 12 },
};

export function MobileNav({
  homeHref,
  links,
  profile,
}: {
  homeHref: string;
  links: NavLink[];
  profile: { username: string; avatarUrl: string | null } | null;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const browseLinks = links.filter((l) => l.href !== "/open-pack");
  const close = () => setOpen(false);

  return (
    <>
      <div className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/50 p-1.5 shadow-2xl backdrop-blur-xl md:hidden">
        <Link href={homeHref} className={solid}>
          Vaulted
        </Link>
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={glassBtn}
        >
          <HamburgerIcon open={open} />
        </button>
      </div>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                key="mobile-menu"
                role="dialog"
                aria-modal="true"
                aria-label="Navigation"
                className="fixed inset-0 z-[250] md:hidden"
              >
                <motion.button
                  type="button"
                  aria-label="Close menu"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                  onClick={close}
                />

                <motion.div
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "110%" }}
                  transition={{ type: "spring", stiffness: 380, damping: 36 }}
                  className="absolute inset-x-0 bottom-0 top-0 flex flex-col bg-zinc-950"
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_50%)]"
                  />

                  {/* Drag hint / header */}
                  <div className="relative flex flex-col items-center px-5 pt-[max(0.75rem,env(safe-area-inset-top))]">
                    <div className="mb-4 h-1 w-10 rounded-full bg-zinc-800" />
                    <div className="flex w-full items-center justify-between gap-3 pb-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                          Navigate
                        </p>
                        <p className="truncate text-lg font-bold tracking-tight text-white">
                          {profile
                            ? `Hey, ${profile.username}`
                            : "Explore Vaulted"}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label="Close menu"
                        onClick={close}
                        className={glassBtn}
                      >
                        <HamburgerIcon open />
                      </button>
                    </div>
                  </div>

                  <motion.nav
                    variants={listVariants}
                    initial="closed"
                    animate="open"
                    className="relative flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-4"
                  >
                    {/* Primary CTA */}
                    <motion.div variants={itemVariants}>
                      <Link
                        href="/open-pack"
                        onClick={close}
                        className="block rounded-2xl bg-white px-5 py-4 text-black shadow-[0_12px_40px_rgba(255,255,255,0.08)] transition-transform active:scale-[0.98]"
                      >
                        <p className="text-base font-bold">Open a pack</p>
                        <p className="mt-0.5 text-xs font-medium text-zinc-600">
                          Trainer or sandbox
                        </p>
                      </Link>
                    </motion.div>

                    {/* Browse */}
                    <div>
                      <motion.p
                        variants={itemVariants}
                        className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-zinc-600"
                      >
                        Browse
                      </motion.p>
                      <div className="overflow-hidden rounded-2xl border border-zinc-900 bg-black/50">
                        {(browseLinks.length > 0 ? browseLinks : links).map(
                          (link, index) => {
                            const active =
                              pathname === link.href ||
                              pathname.startsWith(`${link.href}/`);
                            return (
                              <motion.div key={link.href} variants={itemVariants}>
                                <Link
                                  href={link.href}
                                  onClick={close}
                                  className={`flex items-center gap-3 border-b border-zinc-900 px-4 py-3.5 last:border-b-0 transition-colors ${
                                    active
                                      ? "bg-white/[0.06]"
                                      : "active:bg-white/[0.04]"
                                  }`}
                                >
                                  <span
                                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-md text-[10px] font-bold ${
                                      active
                                        ? "bg-white text-black"
                                        : "bg-zinc-900 text-zinc-500"
                                    }`}
                                  >
                                    {String(index + 1).padStart(2, "0")}
                                  </span>
                                  <span
                                    className={`min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight ${
                                      active ? "text-white" : "text-zinc-300"
                                    }`}
                                  >
                                    {link.label}
                                  </span>
                                  {active && (
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                      Here
                                    </span>
                                  )}
                                </Link>
                              </motion.div>
                            );
                          },
                        )}
                      </div>
                    </div>

                    {/* Account */}
                    <motion.div variants={itemVariants}>
                      <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                        Account
                      </p>
                      {profile ? (
                        <div className="overflow-hidden rounded-2xl border border-zinc-900 bg-black/50">
                          <Link
                            href={`/profile/${profile.username}`}
                            onClick={close}
                            className="flex items-center gap-3 border-b border-zinc-900 px-4 py-3.5 active:bg-white/[0.04]"
                          >
                            <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                              <SafeImage
                                src={profile.avatarUrl}
                                alt=""
                                fill
                                sizes="40px"
                                className="object-cover"
                                fallback={<span className="h-3 w-3 rounded-full bg-white" />}
                              />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-white">
                                {profile.username}
                              </p>
                              <p className="text-[11px] text-zinc-500">
                                View profile & binder
                              </p>
                            </div>
                          </Link>

                          <AccountLink href="/dashboard" onClick={close}>
                            Dashboard
                          </AccountLink>
                          <AccountLink href="/account" onClick={close}>
                            Edit account
                          </AccountLink>
                          <SignOutButton
                            className="flex w-full items-center justify-between px-4 py-3.5 text-left text-[15px] font-medium text-zinc-400 active:bg-white/[0.04]"
                            onClick={close}
                          />
                        </div>
                      ) : (
                        <Link
                          href="/login"
                          onClick={close}
                          className="block rounded-2xl border border-zinc-800 bg-black/50 px-5 py-4 active:scale-[0.99]"
                        >
                          <p className="text-sm font-semibold text-white">
                            Sign in
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-500">
                            Save packs, streaks & collection
                          </p>
                        </Link>
                      )}
                    </motion.div>
                  </motion.nav>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

function AccountLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block border-b border-zinc-900 px-4 py-3.5 text-[15px] font-medium text-zinc-300 last:border-b-0 active:bg-white/[0.04]"
    >
      {children}
    </Link>
  );
}

function HamburgerIcon({ open }: { open?: boolean }) {
  return (
    <span className="relative block h-3.5 w-4" aria-hidden>
      <span
        className={`absolute left-0 block h-0.5 w-4 bg-current transition-transform duration-200 ${
          open ? "top-1.5 rotate-45" : "top-0"
        }`}
      />
      <span
        className={`absolute left-0 top-1.5 block h-0.5 w-4 bg-current transition-opacity duration-200 ${
          open ? "opacity-0" : "opacity-100"
        }`}
      />
      <span
        className={`absolute left-0 block h-0.5 w-4 bg-current transition-transform duration-200 ${
          open ? "top-1.5 -rotate-45" : "top-3"
        }`}
      />
    </span>
  );
}
