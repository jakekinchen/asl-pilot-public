import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, clientRateLimitKey } from "@/lib/rate-limit";
import { createUserSession } from "@/lib/server-store";
import { isSupabaseAuthEnabled } from "@/lib/supabase-server";
import { registerSupabaseUser } from "@/lib/supabase-store";

export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit(clientRateLimitKey(request, "auth-register"), {
      limit: 5,
      windowMs: 60_000,
    });
    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: "Too many account creation attempts. Try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfter) },
        },
      );
    }

    const body = (await request.json()) as {
      email?: string;
      name?: string;
      password?: string;
    };
    if (isSupabaseAuthEnabled()) {
      return await registerSupabaseUser(request, {
        email: body.email ?? "",
        name: body.name ?? "",
        password: body.password ?? "",
      });
    }

    const user = await createUserSession({
      email: body.email ?? "",
      name: body.name ?? "",
      password: body.password ?? "",
    });
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create account." },
      { status: 400 },
    );
  }
}
