import type { NextConfig } from "next";

validateEnvironment();

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "img-src 'self' data: blob:",
              "media-src 'self' blob:",
              "connect-src 'self' https://cdn.jsdelivr.net",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "worker-src 'self' blob: https://cdn.jsdelivr.net",
            ].join("; "),
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

function validateEnvironment() {
  const datasetApi = process.env.ENABLE_DATASET_COLLECTION === "true";
  const datasetUi = process.env.NEXT_PUBLIC_ENABLE_DATASET_COLLECTION === "true";
  if (datasetApi !== datasetUi) {
    throw new Error(
      "ENABLE_DATASET_COLLECTION and NEXT_PUBLIC_ENABLE_DATASET_COLLECTION must both be true or both be false.",
    );
  }

  const usesSupabaseAuth = process.env.ASL_PILOT_AUTH_PROVIDER === "supabase";
  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
  const hasSupabaseAnonKey = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
  );
  if ((usesSupabaseAuth || hasSupabaseUrl || hasSupabaseAnonKey) && (!hasSupabaseUrl || !hasSupabaseAnonKey)) {
    throw new Error(
      "Supabase auth requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
}

export default nextConfig;
