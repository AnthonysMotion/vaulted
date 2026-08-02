"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button, Card } from "@/components/ui";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        if (data.session) {
          router.push("/onboarding");
          router.refresh();
        } else {
          setInfo("Check your email to confirm your account, then sign in.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(next);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

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

        <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
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

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-white/10 border border-white/20 backdrop-blur-xl text-white shadow-sm hover:bg-white/15"
          >
            {loading ? "..." : mode === "signin" ? "Sign in →" : "Create account →"}
          </Button>
        </form>

        <button
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
        <Link href="/open-pack?mode=sandbox" className="underline underline-offset-4">
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
