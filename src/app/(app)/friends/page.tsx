import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrCreateProfile } from "@/lib/game/profile";
import { redirectIfNeedsOnboarding } from "@/lib/game/onboarding";
import { getFriendships } from "@/lib/game/queries";
import { Card, EmptyState, LinkButton } from "@/components/ui";
import {
  AddFriendForm,
  RespondButtons,
  RemoveFriendButton,
} from "@/components/friend-actions";

export const metadata = { title: "Friends" };

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string }>;
}) {
  const profile = await getOrCreateProfile();
  if (!profile) redirect("/login?next=/friends");
  redirectIfNeedsOnboarding(profile);

  const { add } = await searchParams;
  const { friends, incoming, outgoing } = await getFriendships(profile.id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-3xl font-black">Friends</h1>
        <p className="mt-1 text-muted">
          Compare collections, browse binders, find trade bait.
        </p>
      </div>

      <Card>
        <h2 className="mb-3 font-bold">Add a friend</h2>
        <AddFriendForm initialUsername={add ?? ""} />
      </Card>

      {incoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">
            Incoming requests · {incoming.length}
          </h2>
          <div className="flex flex-col gap-2">
            {incoming.map((r) => (
              <Card key={r.id} className="flex items-center justify-between !p-4">
                <Link
                  href={`/profile/${r.requester.username}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {r.requester.username}
                </Link>
                <RespondButtons friendshipId={r.id} />
              </Card>
            ))}
          </div>
        </section>
      )}

      {outgoing.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">Sent requests</h2>
          <div className="flex flex-col gap-2">
            {outgoing.map((r) => (
              <Card key={r.id} className="flex items-center justify-between !p-4">
                <span className="text-sm">
                  Waiting for{" "}
                  <Link
                    href={`/profile/${r.addressee.username}`}
                    className="font-semibold text-primary hover:underline"
                  >
                    {r.addressee.username}
                  </Link>
                </span>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold">Friends · {friends.length}</h2>
        {friends.length === 0 ? (
          <EmptyState icon="🤝" title="No friends yet">
            Send a request using a trainer&apos;s username above.
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-2">
            {friends.map(({ friendshipId, friend }) => (
              <Card key={friendshipId} className="flex flex-wrap items-center justify-between gap-3 !p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center bg-primary/15 text-sm font-bold text-primary">
                    {friend.level}
                  </span>
                  <Link
                    href={`/profile/${friend.username}`}
                    className="font-semibold hover:text-primary"
                  >
                    {friend.username}
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <LinkButton
                    href={`/binder/${friend.username}`}
                    variant="secondary"
                    className="!px-3 !py-1 text-xs"
                  >
                    Binder
                  </LinkButton>
                  <LinkButton
                    href={`/compare/${friend.username}`}
                    variant="secondary"
                    className="!px-3 !py-1 text-xs"
                  >
                    Compare
                  </LinkButton>
                  <RemoveFriendButton friendId={friend.id} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
