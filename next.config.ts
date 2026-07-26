import type { NextConfig } from "next";

// Content-Security-Policy is intentionally not set here: the app relies on a
// service worker (public/sw.js), a PWA manifest, Supabase (fetch + realtime
// websocket), and Google OAuth redirects, so a CSP needs to be authored
// against the exact set of origins and verified in a real browser before it
// can safely ship. The headers below are low-risk and don't require that.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // Client-side Router Cache lifetimes, in seconds. Next 15 defaults `dynamic`
  // to 0, so the five `ƒ` routes (/routines/[id], /routines/edit/[id],
  // /workouts/history/[id], /workouts/sessions/[id], /profile/[[...userId]])
  // refetch their RSC payload on every navigation. Those pages are 100%
  // 'use client', so the payload is a small shell — but it is still a round
  // trip, and it is the only navigation cost attributable to the framework.
  // Data freshness is unaffected: it comes from TanStack Query, not the RSC
  // payload. See TD-19.
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
