"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton({
  className,
  onClick,
  onMouseEnter,
  children = "Sign out",
}: {
  className?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  children?: ReactNode;
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
      onMouseEnter={onMouseEnter}
      className={className ?? "cursor-pointer"}
      title="Sign out"
    >
      {children}
    </button>
  );
}
