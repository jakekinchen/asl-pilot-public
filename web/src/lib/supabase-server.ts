import "server-only";

import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

type SupabaseServerConfig = {
  url: string;
  anonKey: string;
};

export function getOptionalSupabaseServerConfig(): SupabaseServerConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function isSupabaseAuthEnabled() {
  return process.env.ASL_PILOT_AUTH_PROVIDER === "supabase";
}

export function createSupabaseRouteClient(request: NextRequest, response: NextResponse) {
  const config = getOptionalSupabaseServerConfig();
  if (!config) {
    throw new Error("Supabase auth is not configured.");
  }

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}

export function createSupabaseCookieClient(request: NextRequest) {
  const config = getOptionalSupabaseServerConfig();
  if (!config) {
    throw new Error("Supabase auth is not configured.");
  }

  const cookiesToSet: Parameters<NextResponse["cookies"]["set"]>[] = [];
  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(nextCookies) {
        nextCookies.forEach(({ name, value, options }) => {
          cookiesToSet.push([name, value, options]);
        });
      },
    },
  });

  return { supabase, cookiesToSet };
}

export function applySupabaseCookies(
  response: NextResponse,
  cookiesToSet: Parameters<NextResponse["cookies"]["set"]>[],
) {
  cookiesToSet.forEach((cookie) => response.cookies.set(...cookie));
  return response;
}
