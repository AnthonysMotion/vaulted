import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { VISION_USER_ID_HEADER } from "@/lib/auth/session-header";

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

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(
      (c) =>
        c.name.startsWith("sb-") &&
        (c.name.includes("auth-token") || c.name.includes("access-token")),
    );
}

function requestHeadersWithUser(
  request: NextRequest,
  userId: string | null,
) {
  const headers = new Headers(request.headers);
  // Never trust a client-supplied user id.
  headers.delete(VISION_USER_ID_HEADER);
  if (userId) {
    headers.set(VISION_USER_ID_HEADER, userId);
  }
  return headers;
}

function buildResponse(
  request: NextRequest,
  userId: string | null,
  cookiesToSet: CookieToSet[],
  cacheHeaders: Record<string, string> | undefined,
) {
  const response = NextResponse.next({
    request: {
      headers: requestHeadersWithUser(request, userId),
    },
  });

  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set(name, value, options);
  }

  if (cacheHeaders) {
    for (const [key, value] of Object.entries(cacheHeaders)) {
      if (typeof value === "string") {
        response.headers.set(key, value);
      }
    }
  }

  return response;
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const needsAuth = PROTECTED_PREFIXES.some((p) => path.startsWith(p));
  const maybeSignedIn = hasSupabaseAuthCookie(request);

  if (!needsAuth && !maybeSignedIn) {
    return NextResponse.next({
      request: {
        headers: requestHeadersWithUser(request, null),
      },
    });
  }

  const session = {
    userId: null as string | null,
    cookiesToSet: [] as CookieToSet[],
    cacheHeaders: undefined as Record<string, string> | undefined,
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, cacheHeaders) {
          // Mutate request cookies so downstream RSC sees the refreshed session.
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          session.cookiesToSet = cookiesToSet;
          session.cacheHeaders = cacheHeaders as
            | Record<string, string>
            | undefined;
        },
      },
    },
  );

  // Prefer getClaims(): validates/refreshes the JWT locally (or via JWKS)
  // instead of a full Auth getUser() round-trip on every navigation.
  const { data: claimsData } = await supabase.auth.getClaims();
  const sub = claimsData?.claims?.sub;
  session.userId = typeof sub === "string" && sub.length > 0 ? sub : null;

  if (needsAuth && !session.userId) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return buildResponse(
    request,
    session.userId,
    session.cookiesToSet,
    session.cacheHeaders,
  );
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
