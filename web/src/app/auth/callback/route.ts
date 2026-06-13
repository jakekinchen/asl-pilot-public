import { NextRequest, NextResponse } from "next/server";
import { safeRedirectPath } from "@/lib/redirects";
import {
  createSupabaseRouteClient,
  getOptionalSupabaseServerConfig,
} from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const nextPath = safeRedirectPath(request.nextUrl.searchParams.get("next"), "/");

  if (!code) {
    return redirectWithAuthError(request, nextPath, "missing_code");
  }

  if (!getOptionalSupabaseServerConfig()) {
    return redirectWithAuthError(request, nextPath, "server_config");
  }

  const redirectUrl = new URL(nextPath, request.url);
  const response = NextResponse.redirect(redirectUrl);
  const supabase = createSupabaseRouteClient(request, response);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return redirectWithAuthError(request, nextPath, "callback_failed");
  }

  return response;
}

function redirectWithAuthError(request: NextRequest, nextPath: string, reason: string) {
  const redirectUrl = new URL(nextPath, request.url);
  redirectUrl.searchParams.set("auth_error", reason);
  return NextResponse.redirect(redirectUrl);
}
