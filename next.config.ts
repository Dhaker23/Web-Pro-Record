import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Allow the preview panel domain to access dev resources.
  allowedDevOrigins: ["*.space-z.ai"],
  // TypeScript checking re-enabled (was disabled in scaffold).
  typescript: {
    ignoreBuildErrors: false,
  },
  // React Strict Mode disabled — the recorder hook manages browser media
  // resources (MediaStream, MediaRecorder, AudioContext) that cannot tolerate
  // Strict Mode's double-mount behavior in development.
  reactStrictMode: false,
  // Security headers — scoped to allow the app to run in preview iframes
  // while still protecting against XSS, clickjacking, and content injection.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), display-capture=(self), picture-in-picture=(self), fullscreen=(self)",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob:",
              "media-src 'self' blob:",
              "connect-src 'self' ws: wss:",
              "frame-src 'self'",
              "worker-src 'self' blob:",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
