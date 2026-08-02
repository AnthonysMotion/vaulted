"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  getLastAuthMethod,
  setLastAuthMethod,
  type AuthMethod,
} from "@/lib/auth/last-method";
import { Button, Card } from "@/components/ui";

function LastUsedTag() {
  return (
    <span className="absolute -top-2 right-3 rounded-full border border-zinc-700 bg-zinc-950 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-zinc-300 shadow-sm">
      Last used
    </span>
  );
}

function GoogleIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function DiscordIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M20.317 4.37a19.8 19.8 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.3 18.3 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.7 19.7 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.08.08 0 0 0 .031.055 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.1 14.1 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.373-.292a.074.074 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .079.009c.12.1.247.198.373.293a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.891.076.076 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.029 19.8 19.8 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const oauthError = searchParams.get("error") === "oauth";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(
    oauthError ? "OAuth sign-in failed. Try again or use email." : null,
  );
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "discord" | null>(
    null,
  );
  const [lastMethod, setLastMethod] = useState<AuthMethod | null>(null);

  useEffect(() => {
    setLastMethod(getLastAuthMethod());
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const supabase = createSupabaseBrowserClient();

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } },
        });
        if (error) throw error;
        setLastAuthMethod("email");
        setLastMethod("email");
        if (data.session) {
          router.push("/onboarding");
          router.refresh();
        } else {
          setInfo("Check your email to confirm your account, then sign in.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setLastAuthMethod("email");
        setLastMethod("email");
        router.push(next);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithOAuth(provider: "google" | "discord") {
    setError(null);
    setInfo(null);
    setOauthLoading(provider);
    setLastAuthMethod(provider);
    setLastMethod(provider);

    const supabase = createSupabaseBrowserClient();
    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", next);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo.toString(),
        queryParams:
          provider === "google" ? { prompt: "select_account" } : undefined,
      },
    });

    if (error) {
      setError(error.message);
      setOauthLoading(null);
    }
  }

  const busy = loading || oauthLoading !== null;

  return (
    <div className="mx-auto mt-10 w-full max-w-md">
      <Card>
        <p className="mwg-label text-muted">Account</p>
        <h1 className="title-s mt-2">
          {mode === "signin" ? "Welcome back, trainer" : "Start your journey"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {mode === "signin"
            ? "Sign in to open today's packs."
            : "Create a free account to build a permanent collection."}
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <div className="relative">
            {lastMethod === "google" && <LastUsedTag />}
            <button
              type="button"
              disabled={busy}
              onClick={() => signInWithOAuth("google")}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-zinc-800 bg-zinc-950 text-sm font-medium text-white transition-colors hover:border-zinc-600 hover:bg-zinc-900 disabled:opacity-50"
            >
              <GoogleIcon className="h-4 w-4" />
              {oauthLoading === "google" ? "Redirecting…" : "Continue with Google"}
            </button>
          </div>

          <div className="relative">
            {lastMethod === "discord" && <LastUsedTag />}
            <button
              type="button"
              disabled={busy}
              onClick={() => signInWithOAuth("discord")}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-zinc-800 bg-zinc-950 text-sm font-medium text-white transition-colors hover:border-zinc-600 hover:bg-zinc-900 disabled:opacity-50"
            >
              <DiscordIcon className="h-4 w-4" />
              {oauthLoading === "discord"
                ? "Redirecting…"
                : "Continue with Discord"}
            </button>
          </div>
        </div>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
            or email
          </span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          {mode === "signup" && (
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="mwg-label-s text-muted">Username</span>
              <input
                required
                minLength={3}
                maxLength={20}
                pattern="[a-zA-Z0-9_]+"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ash_ketchum"
                className="h-12 rounded-full border border-border bg-surface-2 px-4 text-white placeholder:text-zinc-500 outline-none transition-colors focus:border-anthracite focus:bg-white focus:text-black"
              />
            </label>
          )}
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="mwg-label-s text-muted">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-12 rounded-full border border-border bg-surface-2 px-4 text-white placeholder:text-zinc-500 outline-none transition-colors focus:border-anthracite focus:bg-white focus:text-black"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="mwg-label-s text-muted">Password</span>
            <input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-12 rounded-full border border-border bg-surface-2 px-4 text-white placeholder:text-zinc-500 outline-none transition-colors focus:border-anthracite focus:bg-white focus:text-black"
            />
          </label>

          {error && <p className="text-sm text-[#fc4c3b]">{error}</p>}
          {info && <p className="text-sm text-[#0f9a52]">{info}</p>}

          <div className="relative">
            {lastMethod === "email" && <LastUsedTag />}
            <Button
              type="submit"
              disabled={busy}
              className="w-full bg-white/10 border border-white/20 backdrop-blur-xl text-white shadow-sm hover:bg-white/15"
            >
              {loading
                ? "..."
                : mode === "signin"
                  ? "Sign in with email →"
                  : "Create account →"}
            </Button>
          </div>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mwg-label-s mt-5 text-muted underline decoration-primary underline-offset-4 hover:text-foreground cursor-pointer"
        >
          {mode === "signin"
            ? "New here? Create an account"
            : "Already have an account? Sign in"}
        </button>
      </Card>

      <p className="mwg-label-s mt-6 text-center text-muted">
        Just want to rip packs?{" "}
        <Link
          href="/open-pack?mode=sandbox"
          className="underline underline-offset-4"
        >
          Sandbox mode
        </Link>{" "}
        needs no account.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
