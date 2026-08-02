import { requireDeveloper } from "@/lib/game/developer";

export const dynamic = "force-dynamic";

export default async function DevLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireDeveloper();
  return children;
}
