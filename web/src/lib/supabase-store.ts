import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { VOCABULARY } from "./vocabulary";
import {
  applySupabaseCookies,
  createSupabaseCookieClient,
} from "./supabase-server";

type PublicUser = {
  id: string;
  email: string;
  name: string;
};

type AttemptInput = {
  vocabularyId: string;
  passed: boolean;
  confidence: number;
  predictedId: string | null;
  predictedLabel?: string | null;
  modelId: string;
  modelStatus: "not_trained" | "trained";
  hint: string;
  reason: string;
  durationMs: number | null;
  frameCount: number | null;
};

type AttemptRow = {
  id: string;
  user_id: string;
  vocabulary_id: string;
  passed: boolean;
  confidence: number;
  predicted_id: string | null;
  predicted_label: string | null;
  model_id: string;
  model_status: "not_trained" | "trained";
  hint: string;
  reason: string;
  duration_ms: number | null;
  frame_count: number | null;
  created_at: string;
};

type ProgressRow = {
  vocabulary_id: string;
  attempts: number;
  passes: number;
  fails: number;
  last_attempt_at: string | null;
};

export async function registerSupabaseUser(
  request: NextRequest,
  input: { email: string; name: string; password: string },
) {
  const { supabase, cookiesToSet } = createSupabaseCookieClient(request);
  const origin = request.nextUrl.origin;
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        display_name: input.name,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) throw new Error(error.message);

  const body = data.session && data.user
    ? { user: publicUser(data.user.id, data.user.email, data.user.user_metadata?.display_name) }
    : { user: null, pendingEmailVerification: true };
  return applySupabaseCookies(NextResponse.json(body), cookiesToSet);
}

export async function loginSupabaseUser(
  request: NextRequest,
  input: { email: string; password: string },
) {
  const { supabase, cookiesToSet } = createSupabaseCookieClient(request);
  const { data, error } = await supabase.auth.signInWithPassword(input);
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Unable to load Supabase user.");

  return applySupabaseCookies(
    NextResponse.json({
      user: publicUser(data.user.id, data.user.email, data.user.user_metadata?.display_name),
    }),
    cookiesToSet,
  );
}

export async function logoutSupabaseUser(request: NextRequest) {
  const { supabase, cookiesToSet } = createSupabaseCookieClient(request);
  await supabase.auth.signOut();
  return applySupabaseCookies(NextResponse.json({ ok: true }), cookiesToSet);
}

export async function getSupabaseCurrentUser(request: NextRequest) {
  const { supabase, cookiesToSet } = createSupabaseCookieClient(request);
  const { data, error } = await supabase.auth.getUser();
  const response = NextResponse.json({
    user: error || !data.user
      ? null
      : publicUser(data.user.id, data.user.email, data.user.user_metadata?.display_name),
  });
  return applySupabaseCookies(response, cookiesToSet);
}

export async function saveSupabaseAttempt(request: NextRequest, input: AttemptInput) {
  const { supabase, cookiesToSet } = createSupabaseCookieClient(request);
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("You must be logged in to save practice.");

  const { data, error } = await supabase
    .from("attempts")
    .insert({
      user_id: userData.user.id,
      vocabulary_id: input.vocabularyId,
      passed: input.passed,
      confidence: input.confidence,
      predicted_id: input.predictedId,
      predicted_label: input.predictedLabel ?? null,
      model_id: input.modelId,
      model_status: input.modelStatus,
      hint: input.hint,
      reason: input.reason,
      duration_ms: input.durationMs,
      frame_count: input.frameCount,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  return applySupabaseCookies(
    NextResponse.json({ attempt: mapAttempt(data as AttemptRow) }),
    cookiesToSet,
  );
}

export async function getSupabaseProgress(request: NextRequest) {
  const { supabase, cookiesToSet } = createSupabaseCookieClient(request);
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("You must be logged in to view progress.");

  const [{ data: progressRows, error: progressError }, { data: attemptRows, error: attemptsError }] =
    await Promise.all([
      supabase.from("attempt_progress").select("*").order("last_attempt_at", { ascending: false }),
      supabase.from("attempts").select("*").order("created_at", { ascending: false }).limit(12),
    ]);
  if (progressError) throw new Error(progressError.message);
  if (attemptsError) throw new Error(attemptsError.message);

  const byVocabulary = new Map(
    ((progressRows ?? []) as ProgressRow[]).map((row) => [row.vocabulary_id, row]),
  );
  const progress = VOCABULARY.map((item) => {
    const row = byVocabulary.get(item.id);
    const attempts = row?.attempts ?? 0;
    const passes = row?.passes ?? 0;
    return {
      vocabularyId: item.id,
      label: item.label,
      attempts,
      passes,
      fails: row?.fails ?? 0,
      status: passes >= 2 ? "mastered" : attempts > 0 ? "in_progress" : "not_started",
      lastAttemptAt: row?.last_attempt_at ?? null,
    };
  });

  return applySupabaseCookies(
    NextResponse.json({
      progress,
      recentAttempts: ((attemptRows ?? []) as AttemptRow[]).map(mapAttempt),
    }),
    cookiesToSet,
  );
}

function publicUser(id: string, email: string | undefined, displayName: unknown): PublicUser {
  return {
    id,
    email: email ?? "",
    name: typeof displayName === "string" && displayName.trim() ? displayName.trim() : "Learner",
  };
}

function mapAttempt(row: AttemptRow) {
  return {
    id: row.id,
    userId: row.user_id,
    vocabularyId: row.vocabulary_id,
    passed: row.passed,
    confidence: row.confidence,
    predictedId: row.predicted_id,
    modelId: row.model_id,
    modelStatus: row.model_status,
    hint: row.hint,
    reason: row.reason,
    durationMs: row.duration_ms,
    frameCount: row.frame_count,
    createdAt: row.created_at,
  };
}
