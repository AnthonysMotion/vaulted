import { Suspense } from "react";
import { getGlobalFeed } from "@/lib/game/queries";
import { getSessionUser } from "@/lib/game/profile";
import { FeedList } from "@/components/feed-list";
import { FeedSkeleton } from "@/components/skeletons";

export const metadata = { title: "Activity Feed" };

export default async function FeedPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-black">Activity feed</h1>
      <p className="mt-1 text-muted">Big pulls and milestones from every trainer.</p>
      <Suspense fallback={<FeedSkeleton />}>
        <FeedBody />
      </Suspense>
    </div>
  );
}

async function FeedBody() {
  const [items, user] = await Promise.all([getGlobalFeed(60), getSessionUser()]);
  return (
    <div className="mt-6">
      <FeedList items={items} viewerId={user?.id ?? null} />
    </div>
  );
}
