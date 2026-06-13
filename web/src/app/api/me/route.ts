import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server-store";
import { isSupabaseAuthEnabled } from "@/lib/supabase-server";
import { getSupabaseCurrentUser } from "@/lib/supabase-store";

export async function GET(request: NextRequest) {
  if (isSupabaseAuthEnabled()) {
    return await getSupabaseCurrentUser(request);
  }

  const user = await getCurrentUser();
  return NextResponse.json({ user });
}
