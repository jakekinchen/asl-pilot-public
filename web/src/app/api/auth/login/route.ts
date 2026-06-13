import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, clientRateLimitKey } from "@/lib/rate-limit";
import { loginUser } from "@/lib/server-store";
import { isSupabaseAuthEnabled } from "@/lib/supabase-server";
import { loginSupabaseUser } from "@/lib/supabase-store";

export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit(clientRateLimitKey(request, "auth-login"), {
      limit: 8,
      windowMs: 60_000,
    });
    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: "Too many login attempts. Try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfter) },
        },
      );
    }

    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    if (isSupabaseAuthEnabled()) {
      return await loginSupabaseUser(request, {
        email: body.email ?? "",
        password: body.password ?? "",
      });
    }

    const user = await loginUser({
      email: body.email ?? "",
      password: body.password ?? "",
    });
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to log in." },
      { status: 401 },
    );
  }
}
