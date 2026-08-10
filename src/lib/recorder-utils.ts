// Recorder utilities: formatting, MIME negotiation, device enumeration,
// and browser feature detection.

export type OutputQuality = "720" | "1080" | "1440" | "native";

export const QUALITY_HEIGHTS: Record<Exclude<OutputQuality, "native">, number> = {
  "720": 720,
  "1080": 1080,
  "1440": 1440,
};

/** Format a duration in seconds as HH:MM:SS (or MM:SS when under an hour). */
export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
  const s = Math.floor(totalSeconds % 60);
  const m = Math.floor((totalSeconds / 60) % 60);
  const h = Math.floor(totalSeconds / 3600);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Human-readable byte size. */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Format resolution like "1920 × 1080". */
export function formatResolution(w?: number, h?: number): string {
  if (!w || !h) return "—";
  return `${w} × ${h}`;
}

/** Pick the best supported video MIME type for MediaRecorder. */
export function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=h264,opus",
    "video/webm",
    "video/mp4",
  ];
  for (const type of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(type)) return type;
    } catch (err) {
      // Some browsers throw on isTypeSupported for unknown MIME strings.
      console.debug(`[pickMimeType] isTypeSupported("${type}") threw:`, err);
    }
  }
  return "";
}

/** File extension based on the chosen MIME type. */
export function mimeToExtension(mime: string): string {
  if (!mime) return "webm";
  if (mime.includes("mp4")) return "mp4";
  return "webm";
}

/** Friendly container label (e.g. "WebM · VP9 + Opus"). */
export function mimeToLabel(mime: string): string {
  if (!mime) return "WebM";
  const lower = mime.toLowerCase();
  const container = lower.includes("mp4") ? "MP4" : "WebM";
  const codecsMatch = lower.match(/codecs=([^;]+)/);
  let codecs = "";
  if (codecsMatch) {
    const parts = codecsMatch[1].split(",");
    const pretty = parts.map((c) => {
      if (c.startsWith("vp9")) return "VP9";
      if (c.startsWith("vp8")) return "VP8";
      if (c.startsWith("h264") || c.startsWith("avc1")) return "H.264";
      if (c.startsWith("opus")) return "Opus";
      if (c.startsWith("aac")) return "AAC";
      return c.toUpperCase();
    });
    codecs = pretty.join(" + ");
  }
  return codecs ? `${container} · ${codecs}` : container;
}

export type FeatureSupport = {
  getDisplayMedia: boolean;
  getUserMedia: boolean;
  mediaRecorder: boolean;
  canvasCapture: boolean;
  audioContext: boolean;
  isSecureContext: boolean;
};

/** Detect which browser features required for recording are available. */
export function detectFeatures(): FeatureSupport {
  const nav = navigator as Navigator & {
    mediaDevices?: MediaDevices & {
      getDisplayMedia?: (cs?: DisplayMediaStreamOptions) => Promise<MediaStream>;
    };
  };
  const hasCanvasCapture = typeof HTMLCanvasElement !== "undefined" && "captureStream" in HTMLCanvasElement.prototype;
  return {
    getDisplayMedia:
      typeof nav.mediaDevices?.getDisplayMedia === "function" &&
      typeof nav.mediaDevices?.getUserMedia === "function",
    getUserMedia:
      typeof nav.mediaDevices?.getUserMedia === "function",
    mediaRecorder: typeof MediaRecorder !== "undefined",
    canvasCapture: hasCanvasCapture,
    audioContext:
      typeof AudioContext !== "undefined" ||
      typeof (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext !== "undefined",
    isSecureContext: typeof window !== "undefined" ? window.isSecureContext : true,
  };
}

export type DeviceList = {
  cameras: MediaDeviceInfo[];
  mics: MediaDeviceInfo[];
};

/** Enumerate cameras and microphones, filtering to audio/video inputs. */
export async function enumerateDevices(): Promise<DeviceList> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return {
      cameras: devices.filter((d) => d.kind === "videoinput"),
      mics: devices.filter((d) => d.kind === "audioinput"),
    };
  } catch (err) {
    // enumerateDevices may be blocked before permission grant or unsupported.
    console.debug("[enumerateDevices] Failed to enumerate media devices:", err);
    return { cameras: [], mics: [] };
  }
}

/** Friendly label for a device, falling back to a localized default. */
export function deviceLabel(info: MediaDeviceInfo | undefined, fallback: string): string {
  if (!info) return fallback;
  return info.label?.trim() || fallback;
}

/** Compute target canvas dimensions from screen track settings and quality cap. */
export function computeCanvasSize(
  trackWidth: number,
  trackHeight: number,
  quality: OutputQuality,
): { width: number; height: number } {
  if (!trackWidth || !trackHeight) return { width: 1280, height: 720 };
  if (quality === "native") {
    return { width: trackWidth, height: trackHeight };
  }
  const maxHeight = QUALITY_HEIGHTS[quality];
  if (trackHeight <= maxHeight) return { width: trackWidth, height: trackHeight };
  const scale = maxHeight / trackHeight;
  // Keep even dimensions for codec friendliness.
  const w = Math.round((trackWidth * scale) / 2) * 2;
  const h = Math.round((trackHeight * scale) / 2) * 2;
  return { width: w, height: h };
}

/** Clamp a number between min and max. */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Map a quality preset to a sensible video bitrate (bps). */
export function qualityToVideoBitrate(quality: OutputQuality, fps: number): number {
  const base: Record<Exclude<OutputQuality, "native">, number> = {
    "720": 3_500_000,
    "1080": 6_000_000,
    "1440": 10_000_000,
  };
  if (quality === "native") {
    // Estimate by fps; very high native gets a generous ceiling.
    return fps >= 60 ? 16_000_000 : 10_000_000;
  }
  return fps >= 60 ? Math.round(base[quality] * 1.5) : base[quality];
}

/** Round-rect path helper (some browsers lack CanvasRenderingContext2D.roundRect). */
export function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  // Prefer native roundRect when available.
  const anyCtx = ctx as CanvasRenderingContext2D & {
    roundRect?: (x: number, y: number, w: number, h: number, r: number) => void;
  };
  if (typeof anyCtx.roundRect === "function") {
    ctx.beginPath();
    anyCtx.roundRect(x, y, w, h, radius);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
