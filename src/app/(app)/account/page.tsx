import { db } from "@/db";
import { profiles } from "@/db/schema";
import { getOrCreateProfile } from "@/lib/game/profile";
import { redirectIfNeedsOnboarding } from "@/lib/game/onboarding";
import { Button, Card } from "@/components/ui";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function updateAccount(formData: FormData) {
  "use server";

  const profile = await getOrCreateProfile().catch(() => null);
  if (!profile) redirect("/login?next=/account");

  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();
  const bannerUrl = String(formData.get("bannerUrl") ?? "").trim();
  const favouritePokemon = String(formData.get("favouritePokemon") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    redirect("/account?error=username");
  }

  const collision = await db.query.profiles.findFirst({
    where: and(eq(profiles.username, username), ne(profiles.id, profile.id)),
    columns: { id: true },
  });
  if (collision) {
    redirect("/account?error=taken");
  }

  await db
    .update(profiles)
    .set({
      username,
      avatarUrl: avatarUrl || null,
      bannerUrl: bannerUrl || null,
      favouritePokemon: favouritePokemon || null,
      bio: bio || null,
    })
    .where(eq(profiles.id, profile.id));

  revalidatePath("/dashboard");
  revalidatePath("/feed");
  revalidatePath(`/profile/${profile.username}`);
  revalidatePath(`/profile/${username}`);
  revalidatePath("/account");

  redirect("/account?saved=1");
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const [profile, params] = await Promise.all([
    getOrCreateProfile().catch(() => null),
    searchParams,
  ]);

  if (!profile) redirect("/login?next=/account");
  redirectIfNeedsOnboarding(profile);

  const message =
    params.error === "taken"
      ? "That username is already taken."
      : params.error === "username"
        ? "Username must be 3-20 characters and use only lowercase letters, numbers, or underscores."
        : params.saved
          ? "Account updated."
          : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600">
          Account
        </div>
        <h1 className="mt-4 text-4xl font-black tracking-tighter text-white">
          Edit account
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-zinc-500">
          Update your public profile details, images, and trainer identity.
        </p>
      </div>

      <Card variant="surface" className="p-6 sm:p-8">
        <form action={updateAccount} className="flex flex-col gap-6">
          {message && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                params.error
                  ? "border-red-500/30 bg-red-500/10 text-red-300"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              }`}
            >
              {message}
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                Username
              </span>
              <input
                name="username"
                required
                minLength={3}
                maxLength={20}
                pattern="[a-z0-9_]+"
                defaultValue={profile.username}
                className="h-12 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-white outline-none transition-colors focus:border-zinc-600"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                Favourite Pokemon
              </span>
              <input
                name="favouritePokemon"
                maxLength={40}
                defaultValue={profile.favouritePokemon ?? ""}
                className="h-12 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-white outline-none transition-colors focus:border-zinc-600"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              Bio
            </span>
            <textarea
              name="bio"
              rows={4}
              maxLength={240}
              defaultValue={profile.bio ?? ""}
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none transition-colors focus:border-zinc-600"
            />
          </label>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                Avatar image URL
              </span>
              <input
                name="avatarUrl"
                type="url"
                defaultValue={profile.avatarUrl ?? ""}
                className="h-12 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-white outline-none transition-colors focus:border-zinc-600"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                Banner image URL
              </span>
              <input
                name="bannerUrl"
                type="url"
                defaultValue={profile.bannerUrl ?? ""}
                className="h-12 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-white outline-none transition-colors focus:border-zinc-600"
              />
            </label>
          </div>

          <div className="flex items-center justify-end">
            <Button type="submit" className="px-6">
              Save changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
