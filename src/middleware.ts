import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get("aspec_role")?.value;

  // Kalau belum ada role dan bukan di halaman login, redirect ke login
  if (!role && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Kalau sudah ada role dan akses halaman login, redirect ke dashboard
  if (role && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets).*)"],
};