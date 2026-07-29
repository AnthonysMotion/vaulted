"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui";

export function AddFriendForm({ initialUsername = "" }: { initialUsername?: string }) {
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ ok: true, text: `Request sent to ${username}!` });
        setUsername("");
        router.refresh();
      } else {
        setMessage({ ok: false, text: data.error ?? "Failed" });
      }
    } catch {
      setMessage({ ok: false, text: "Network error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      <input
        required
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Trainer username"
        className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <Button type="submit" disabled={busy}>
        {busy ? "..." : "Send request"}
      </Button>
      {message && (
        <span className={`text-sm ${message.ok ? "text-emerald-400" : "text-red-400"}`}>
          {message.text}
        </span>
      )}
    </form>
  );
}

export function RespondButtons({ friendshipId }: { friendshipId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function respond(action: "accept" | "reject") {
    setBusy(true);
    await fetch("/api/friends", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendshipId, action }),
    });
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button onClick={() => respond("accept")} disabled={busy} className="!px-3 !py-1 text-xs">
        Accept
      </Button>
      <Button
        onClick={() => respond("reject")}
        disabled={busy}
        variant="danger"
        className="!px-3 !py-1 text-xs"
      >
        Reject
      </Button>
    </div>
  );
}

export function RemoveFriendButton({ friendId }: { friendId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm("Remove this friend?")) return;
    setBusy(true);
    await fetch("/api/friends", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendId }),
    });
    router.refresh();
  }

  return (
    <Button onClick={remove} disabled={busy} variant="ghost" className="!px-2 !py-1 text-xs">
      Remove
    </Button>
  );
}
