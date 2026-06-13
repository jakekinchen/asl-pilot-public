type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function clientRateLimitKey(request: Request, scope: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return `${scope}:${forwardedFor || realIp || "local"}`;
}

export function checkRateLimit(key: string, options: RateLimitOptions) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { ok: true, retryAfter: 0 };
  }

  existing.count += 1;
  if (existing.count <= options.limit) {
    return { ok: true, retryAfter: 0 };
  }

  return {
    ok: false,
    retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}
