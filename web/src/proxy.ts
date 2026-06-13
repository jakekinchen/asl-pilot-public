import { NextRequest, NextResponse } from "next/server";
import { isSafeRedirectPath } from "./lib/redirects";

export function proxy(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next");
  if (next && !isSafeRedirectPath(next)) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/auth/:path*"],
};
