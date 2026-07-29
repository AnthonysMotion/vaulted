import Link from "next/link";
import { notFound } from "next/navigation";
import { getBinder, getProfileByUsername } from "@/lib/game/queries";
import { getOrCreateProfile } from "@/lib/game/profile";
import { BinderEditor } from "@/components/binder-editor";

export default async function BinderPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const [binder, viewer] = await Promise.all([
    getBinder(profile.id),
    getOrCreateProfile().catch(() => null),
  ]);
  const isOwner = viewer?.id === profile.id;

  const slots = (binder?.slots ?? []).map((s) => ({
    position: s.position,
    cardId: s.cardId,
    name: s.card.name,
    rarity: s.card.rarity,
    imageSmall: s.card.imageSmall,
    isFavourite: s.isFavourite,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-3xl font-black">
          <Link href={`/profile/${profile.username}`} className="text-primary hover:underline">
            {profile.username}
          </Link>
          &apos;s binder
        </h1>
        <p className="mt-1 text-muted">
          {isOwner
            ? "This is your public showcase. Make it count."
            : `A hand-picked showcase of ${profile.username}'s best cards.`}
        </p>
      </div>

      <BinderEditor initialSlots={slots} editable={isOwner} />
    </div>
  );
}
