import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
