"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      className="mwg-label-s h-[50px] rounded-full px-4 text-muted transition-colors hover:bg-surface hover:text-foreground cursor-pointer"
      title="Sign out"
    >
      Sign out
    </button>
  );
}
