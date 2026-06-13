import { NextRequest, NextResponse } from "next/server";
import { logoutUser } from "@/lib/server-store";
import { isSupabaseAuthEnabled } from "@/lib/supabase-server";
import { logoutSupabaseUser } from "@/lib/supabase-store";

export async function POST(request: NextRequest) {
  if (isSupabaseAuthEnabled()) {
    return await logoutSupabaseUser(request);
  }

  await logoutUser();
  return NextResponse.json({ ok: true });
}
