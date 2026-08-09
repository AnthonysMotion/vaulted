import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { VAULTED_USER_ID_HEADER } from "@/lib/auth/session-header";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/collection",
  "/friends",
  "/binder/edit",
  "/account",
  "/achievements",
  "/onboarding",
  "/dev",
];

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(
      (c) =>
        c.name.startsWith("sb-") &&
        (c.name.includes("auth-token") || c.name.includes("access-token")),
    );
}

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  // Never trust a client-supplied user id — strip on every path, including
  // the public fast-path that skips Auth.
  requestHeaders.delete(VAULTED_USER_ID_HEADER);

  const path = request.nextUrl.pathname;
  const needsAuth = PROTECTED_PREFIXES.some((p) => path.startsWith(p));
  const maybeSignedIn = hasSupabaseAuthCookie(request);

  if (!needsAuth && !maybeSignedIn) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  let cookiesToApply: {
    name: string;
    value: string;
    options?: Parameters<NextResponse["cookies"]["set"]>[2];
  }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          cookiesToApply = cookiesToSet;
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (needsAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user) {
    requestHeaders.set(VAULTED_USER_ID_HEADER, user.id);
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  for (const { name, value, options } of cookiesToApply) {
    response.cookies.set(name, value, options);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
