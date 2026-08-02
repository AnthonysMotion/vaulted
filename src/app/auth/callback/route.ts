import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

function safeNextPath(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/dashboard";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  const cookieStore = await cookies();
  // Build the redirect first so auth cookies can be attached to it.
  // Without this, the session often fails to stick across the redirect.
  let destination = `${origin}/onboarding`;
  const response = NextResponse.redirect(destination);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  try {
    const existing = await db.query.profiles.findFirst({
      where: eq(profiles.id, data.user.id),
      columns: { onboardingCompleted: true },
    });

    destination =
      !existing || !existing.onboardingCompleted
        ? `${origin}/onboarding`
        : `${origin}${next}`;
  } catch (err) {
    console.error("[auth/callback] profile lookup failed", err);
    // Session is valid — send them somewhere safe even if the flag query failed.
    destination = `${origin}${next}`;
  }

  // Recreate redirect with final destination, copying session cookies.
  const finalResponse = NextResponse.redirect(destination);
  for (const cookie of response.cookies.getAll()) {
    finalResponse.cookies.set(cookie);
  }
  return finalResponse;
}
