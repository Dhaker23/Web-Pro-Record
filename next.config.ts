import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // SEC-004 FIX: Re-enable TypeScript checking.
  // React Strict Mode is kept disabled because the recorder hook manages
  // browser media resources (MediaStream, MediaRecorder, AudioContext) that
  // cannot tolerate the double-mount/double-effect-invocation behavior of
  // Strict Mode in development. This is a known limitation of media-heavy apps.
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  // SEC-002 FIX: Add security headers to all responses.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), display-capture=(self), picture-in-picture=(self), fullscreen=(self)",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob:",
              "media-src 'self' blob:",
              "connect-src 'self' ws: wss:",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
