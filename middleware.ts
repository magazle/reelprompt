import { NextRequest, NextResponse } from "next/server";

// The middleware runs on the edge and cannot call Supabase with the service key.
// We protect /admin by checking that a session cookie exists (Supabase sets one
// when signed in via magic link). The actual email-based authorization check is
// done inside /api/admin on every request.
//
// Without a session cookie the user is sent to the home page.
// This is a soft gate — the real gate is the API.

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    // Supabase stores the session in a cookie named "sb-<project>-auth-token"
    // (compact JWT) or in the sb-access-token header. We only need to confirm
    // *something* is present; the API validates it against the real JWT.
    const hasCookie = [...req.cookies.getAll()].some(
      (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
    );

    if (!hasCookie) {
      // Redirect to home — page.tsx will show the sign-in prompt via useAuth
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
