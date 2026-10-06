// ─── Next.js Middleware: Auth Gate ───
// Protects all routes. Redirects unauthenticated users to /login.
// Blocks non-admin users from /admin routes.

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-in-production"
);

// Routes that DON'T require authentication
const PUBLIC_ROUTES = [
  "/deals",
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register",
];

// Routes that require ADMIN role
const ADMIN_ROUTES = ["/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Allow public routes ───
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    // If already logged in and trying to access login/register → redirect
    const token = request.cookies.get("shopvault_token")?.value;
    if (token && (pathname === "/login" || pathname === "/register")) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (payload.role === "ADMIN") {
          return NextResponse.redirect(new URL("/admin", request.url));
        }
        return NextResponse.redirect(new URL("/deals", request.url));
      } catch {
        // Token invalid, allow access to login page
      }
    }
    return NextResponse.next();
  }

  // ─── Allow API routes for upload and export (they handle auth internally) ───
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // ─── Allow static files ───
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // ─── Check authentication for all other routes ───
  const token = request.cookies.get("shopvault_token")?.value;

  if (!token) {
    // Not authenticated → redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Verify token
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // ─── Admin route protection ───
    if (pathname.startsWith("/admin")) {
      if (payload.role !== "ADMIN") {
        // Non-admin trying to access admin → redirect to deals
        return NextResponse.redirect(new URL("/deals", request.url));
      }
    }

    // ─── Add user info to headers for downstream use ───
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.userId as string);
    requestHeaders.set("x-user-role", payload.role as string);
    requestHeaders.set("x-user-email", payload.email as string);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    // Token invalid or expired → clear cookie and redirect to login
    const response = NextResponse.redirect(
      new URL("/login", request.url)
    );
    response.cookies.delete("shopvault_token");
    return response;
  }
}

// ─── Configure which paths middleware runs on ───
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};