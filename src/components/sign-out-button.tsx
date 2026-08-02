"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  const router = useRouter();

  async function signOut() {
    onClick?.();
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className={className ?? "cursor-pointer"}
      title="Sign out"
    >
      Sign out
    </button>
  );
}
