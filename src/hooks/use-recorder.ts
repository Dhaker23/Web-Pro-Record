"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import {
  type OutputQuality,
  clamp,
  computeCanvasSize,
  detectFeatures,
  drawRoundRect,
  enumerateDevices,
  formatBytes,
  formatDuration,
  mimeToExtension,
  mimeToLabel,
  pickMimeType,
  qualityToVideoBitrate,
  type FeatureSupport,
} from "@/lib/recorder-utils";
import type { WebcamPosition, WebcamShape, FrameRate } from "@/lib/i18n";

export type RecStatus = "idle" | "countdown" | "recording" | "paused" | "stopped";

export type PreviewMode = "empty" | "webcam-idle" | "composite" | "direct";

/** Normalized free webcam overlay position (0..1 relative to canvas). null = use preset. */
export type FreePos = { x: number; y: number } | null;

export type Snapshot = {
  id: string;
  url: string;
  dataUrl: string;
  width: number;
  height: number;
  createdAt: number;
  elapsed: number;
};

export type LiveStats = {
  elapsed: number;
  estimatedBytes: number;
  fps: number;
  audioActive: boolean;
};

/** Time-domain audio samples for waveform rendering (Uint8, 0..255, 128 = silence). */
export type WaveformData = {
  samples: Uint8Array;
  level: number;
};

/** Post-recording performance summary. */
export type RecordingStats = {
  avgFps: number;
  totalFrames: number;
  peakAudio: number;
  duration: number;
  fileSize: number;
  width: number;
  height: number;
  codec: string;
} | null;

/** A short video clip captured during recording. */
export type Clip = {
  id: string;
  url: string;
  blob: Blob;
  duration: number;
  size: number;
  createdAt: number;
  elapsed: number;
};

/** Live performance profiling data for the monitor panel. */
export type ProfilingData = {
  renderTime: number; // ms per frame (avg over last second)
  memoryUsed: number; // MB (if performance.memory available)
  canvasWidth: number;
  canvasHeight: number;
  videoTrackState: string;
  audioTrackState: string;
  audioContextState: string;
  streamTrackCount: number;
};

/** A past recording kept in history (in-memory for the session). */
export type HistoryEntry = {
  id: string;
  url: string;
  blob: Blob;
  duration: number;
  size: number;
  mimeType: string;
  width: number;
  height: number;
  createdAt: number;
  thumbnail: string; // data URL
  codec: string;
};

export type RecordingResult = {
  url: string;
  blob: Blob;
  duration: number;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  createdAt: number;
} | null;

export type RecorderSettings = {
  webcamEnabled: boolean;
  micEnabled: boolean;
  systemAudioEnabled: boolean;
  quality: OutputQuality;
  frameRate: FrameRate;
  webcamShape: WebcamShape;
  webcamPosition: WebcamPosition;
  webcamSize: number; // percent of min(canvas dims), 10..50
  webcamMargin: number; // px
  webcamBorder: boolean;
  webcamShadow: boolean;
  watermark: boolean;
  countdown: boolean;
  countdownSeconds: number;
  videoBitrate: number; // 0 = auto
  audioBitrate: number; // 0 = auto
  adaptiveFps: boolean; // auto-reduce FPS if device can't keep up
};

export type RecorderError = { kind: string; message: string } | null;

const DEFAULT_SETTINGS: RecorderSettings = {
  webcamEnabled: false,
  micEnabled: false,
  systemAudioEnabled: false,
  quality: "1080",
  frameRate: "30",
  webcamShape: "rounded",
  webcamPosition: "bottom-right",
  webcamSize: 22,
  webcamMargin: 24,
  webcamBorder: true,
  webcamShadow: true,
  watermark: false,
  countdown: false,
  countdownSeconds: 3,
  videoBitrate: 0,
  audioBitrate: 0,
  adaptiveFps: true,
};

// --- Safe persistence (localStorage may be blocked; never throw) ---
const PREF_KEY = "wpr-prefs-v1";

type PersistablePrefs = Pick<
  RecorderSettings,
  | "quality"
  | "frameRate"
  | "webcamShape"
  | "webcamPosition"
  | "webcamSize"
  | "webcamMargin"
  | "webcamBorder"
  | "webcamShadow"
  | "watermark"
  | "countdown"
  | "countdownSeconds"
  | "videoBitrate"
  | "audioBitrate"
  | "adaptiveFps"
>;

function loadPrefs(): Partial<PersistablePrefs> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as Partial<PersistablePrefs>;
  } catch {
    return null;
  }
}

function savePrefs(prefs: PersistablePrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  } catch {
    /* storage blocked — ignore silently (in-memory only) */
  }
}

/** Keys that are safe to persist. */
const PERSISTABLE_KEYS: (keyof PersistablePrefs)[] = [
  "quality",
  "frameRate",
  "webcamShape",
  "webcamPosition",
  "webcamSize",
  "webcamMargin",
  "webcamBorder",
  "webcamShadow",
  "watermark",
  "countdown",
  "countdownSeconds",
  "videoBitrate",
  "audioBitrate",
  "adaptiveFps",
];

export function useRecorder(
  lang: "en" | "ar",
  canvasRef: RefObject<HTMLCanvasElement | null>,
  drawAnnotations?: ((ctx: CanvasRenderingContext2D) => void) | null,
) {
  // --- UI state ---
  const [status, setStatus] = useState<RecStatus>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<RecorderError>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [settings, setSettings] = useState<RecorderSettings>(() => {
    const prefs = loadPrefs();
    if (!prefs) return DEFAULT_SETTINGS;
    // Merge persisted prefs over defaults (validate primitive types loosely).
    return { ...DEFAULT_SETTINGS, ...prefs } as RecorderSettings;
  });
  const [result, setResult] = useState<RecordingResult>(null);
  const [devices, setDevices] = useState<{ cameras: MediaDeviceInfo[]; mics: MediaDeviceInfo[] }>({
    cameras: [],
    mics: [],
  });
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [selectedMicId, setSelectedMicId] = useState<string>("");
  const [features, setFeatures] = useState<FeatureSupport | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [screenLabel, setScreenLabel] = useState<string>("");
  // Round 3 state
  const [freePos, setFreePos] = useState<FreePos>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [liveStats, setLiveStats] = useState<LiveStats>({
    elapsed: 0,
    estimatedBytes: 0,
    fps: 0,
    audioActive: false,
  });
  const [pipActive, setPipActive] = useState(false);
  // Round 4 state
  const [waveform, setWaveform] = useState<WaveformData>({ samples: new Uint8Array(0), level: 0 });
  const [actualFps, setActualFps] = useState(0);
  const [fpsDowngraded, setFpsDowngraded] = useState(false);
  const [effectiveFps, setEffectiveFps] = useState<FrameRate | null>(null);
  // Round 5 state
  const [recordingStats, setRecordingStats] = useState<RecordingStats>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [clipRecording, setClipRecording] = useState(false);
  // Round 7 state
  const [profiling, setProfiling] = useState<ProfilingData | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showProfiling, setShowProfiling] = useState(false);

  // Exposed streams for preview elements
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  // --- Refs (media objects) ---
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const combinedStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const rafRef = useRef<number | null>(null);
  const micLevelRafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAccumRef = useRef<number>(0);
  const pauseStartRef = useRef<number>(0);
  const settingsRef = useRef(settings);
  const statusRef = useRef<RecStatus>("idle");
  const resultUrlRef = useRef<string | null>(null);
  const hiddenContainerRef = useRef<HTMLDivElement | null>(null);
  const langRef = useRef(lang);
  // Round 3 refs
  const freePosRef = useRef<FreePos>(null);
  const statsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const frameCountRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(0);
  const lastFpsRef = useRef<number>(0);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);
  // Round 4 refs — real FPS measurement + adaptive downgrade + waveform
  const renderFrameCountRef = useRef<number>(0);
  const fpsMeasureRafRef = useRef<number | null>(null);
  const lastFpsMeasureRef = useRef<number>(0);
  const effectiveFpsRef = useRef<FrameRate | null>(null);
  const downgradeCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waveformRafRef = useRef<number | null>(null);
  // Round 5 refs — stats tracking + clip recorder
  const peakAudioRef = useRef<number>(0);
  const totalFramesRef = useRef<number>(0);
  const fpsSumRef = useRef<number>(0);
  const fpsSamplesRef = useRef<number>(0);
  const clipRecorderRef = useRef<MediaRecorder | null>(null);
  const clipChunksRef = useRef<Blob[]>([]);
  const clipStreamRef = useRef<MediaStream | null>(null);
  // Round 7 refs — profiling render-time measurement
  const renderTimeAccumRef = useRef<number>(0);
  const renderTimeSamplesRef = useRef<number>(0);
  const profilingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  // ---- Feature detection on mount ----
  useEffect(() => {
    setFeatures(detectFeatures());
    // Try enumerating devices (labels may be empty until permission granted).
    enumerateDevices().then(setDevices);
  }, []);

  // Keep status ref in sync for use in async callbacks.
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Negotiated MIME type (best supported by this browser). Stable for the session.
  const negotiatedMime = useMemo(() => pickMimeType(), []);

  // Persist a safe subset of settings to localStorage whenever they change.
  useEffect(() => {
    const prefs: PersistablePrefs = PERSISTABLE_KEYS.reduce(
      (acc, key) => {
        (acc as Record<string, unknown>)[key as string] = settings[key];
        return acc;
      },
      {} as PersistablePrefs,
    );
    savePrefs(prefs);
  }, [settings]);

  // ---------------- Helpers ----------------

  /** Ensure a hidden container with two video elements exists for canvas sources. */
  const ensureHiddenVideos = useCallback(() => {
    if (typeof document === "undefined") return;
    if (!hiddenContainerRef.current) {
      const container = document.createElement("div");
      container.setAttribute("aria-hidden", "true");
      container.style.position = "fixed";
      container.style.width = "2px";
      container.style.height = "2px";
      container.style.overflow = "hidden";
      container.style.opacity = "0";
      container.style.pointerEvents = "none";
      container.style.top = "-9999px";
      container.style.left = "-9999px";
      const sv = document.createElement("video");
      sv.muted = true;
      (sv as HTMLVideoElement & { playsInline?: boolean }).playsInline = true;
      const wv = document.createElement("video");
      wv.muted = true;
      (wv as HTMLVideoElement & { playsInline?: boolean }).playsInline = true;
      container.appendChild(sv);
      container.appendChild(wv);
      document.body.appendChild(container);
      hiddenContainerRef.current = container;
      screenVideoRef.current = sv;
      webcamVideoRef.current = wv;
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopRaf = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const stopMicLevelLoop = useCallback(() => {
    if (micLevelRafRef.current != null) {
      cancelAnimationFrame(micLevelRafRef.current);
      micLevelRafRef.current = null;
    }
    setMicLevel(0);
  }, []);

  /** Stop and detach a stream's tracks. */
  const stopStream = (stream: MediaStream | null) => {
    if (!stream) return;
    stream.getTracks().forEach((tr) => {
      try {
        tr.stop();
      } catch {
        /* ignore */
      }
    });
  };

  /** Tear down everything except the result blob/URL. */
  const cleanupMedia = useCallback(() => {
    stopRaf();
    stopMicLevelLoop();
    clearTimer();
    // Stop live-stats interval
    if (statsTimerRef.current) {
      clearInterval(statsTimerRef.current);
      statsTimerRef.current = null;
    }
    // Round 4: stop FPS measurement, waveform, adaptive check
    if (fpsMeasureRafRef.current != null) {
      cancelAnimationFrame(fpsMeasureRafRef.current);
      fpsMeasureRafRef.current = null;
    }
    if (waveformRafRef.current != null) {
      cancelAnimationFrame(waveformRafRef.current);
      waveformRafRef.current = null;
    }
    if (downgradeCheckRef.current) {
      clearInterval(downgradeCheckRef.current);
      downgradeCheckRef.current = null;
    }
    setActualFps(0);
    setFpsDowngraded(false);
    setEffectiveFps(null);
    effectiveFpsRef.current = null;
    setWaveform({ samples: new Uint8Array(0), level: 0 });
    // Round 7: stop profiling sampler
    if (profilingTimerRef.current) {
      clearInterval(profilingTimerRef.current);
      profilingTimerRef.current = null;
    }
    setProfiling(null);
    // Exit PiP if active
    if (typeof document !== "undefined" && document.pictureInPictureElement) {
      try {
        void document.exitPictureInPicture();
      } catch {
        /* ignore */
      }
    }
    setPipActive(false);
    // Detach PiP video
    if (pipVideoRef.current) {
      pipVideoRef.current.srcObject = null;
    }

    // Stop recorders
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== "inactive") {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    }
    mediaRecorderRef.current = null;

    // Stop tracks
    stopStream(screenStreamRef.current);
    stopStream(webcamStreamRef.current);
    stopStream(micStreamRef.current);
    stopStream(combinedStreamRef.current);
    screenStreamRef.current = null;
    webcamStreamRef.current = null;
    micStreamRef.current = null;
    combinedStreamRef.current = null;

    // Close audio context
    if (audioContextRef.current) {
      try {
        void audioContextRef.current.close();
      } catch {
        /* ignore */
      }
      audioContextRef.current = null;
      audioDestRef.current = null;
      analyserRef.current = null;
    }

    // Detach hidden videos
    if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
    if (webcamVideoRef.current) webcamVideoRef.current.srcObject = null;

    setScreenStream(null);
    setScreenLabel("");
  }, [stopRaf, stopMicLevelLoop, clearTimer]);

  /** Fully reset including result. */
  const cleanupAll = useCallback(() => {
    cleanupMedia();
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }
    setResult(null);
    setWebcamStream(null);
    setStatus("idle");
    setElapsed(0);
    setCountdownValue(null);
    setError(null);
    setWarning(null);
    // Round 3: reset free position + snapshots + live stats
    freePosRef.current = null;
    setFreePos(null);
    setSnapshots([]);
    setLiveStats({ elapsed: 0, estimatedBytes: 0, fps: 0, audioActive: false });
    // Round 5: reset clips + recording stats
    setClips((prev) => {
      prev.forEach((c) => URL.revokeObjectURL(c.url));
      return [];
    });
    setRecordingStats(null);
    setClipRecording(false);
  }, [cleanupMedia]);

  /** Stop the MediaRecorder; the onstop handler finalizes the blob + cleans tracks. */
  const stopRecording = useCallback(
    (preserve = true) => {
      const rec = mediaRecorderRef.current;
      if (!rec || rec.state === "inactive") {
        if (!preserve) cleanupMedia();
        return;
      }
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
      // onstop handles state + cleanup of tracks
    },
    [cleanupMedia],
  );

  // ---------------- Webcam preview (idle) ----------------

  const stopWebcamPreview = useCallback(() => {
    stopStream(webcamStreamRef.current);
    webcamStreamRef.current = null;
    setWebcamStream(null);
    stopRaf();
  }, [stopRaf]);

  const enableWebcam = useCallback(async () => {
    setError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: selectedCameraId
          ? { deviceId: { exact: selectedCameraId } }
          : { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      // If no device was selected, capture the actual deviceId now.
      const track = stream.getVideoTracks()[0];
      if (track) {
        const settings = track.getSettings();
        if (settings.deviceId && !selectedCameraId) {
          setSelectedCameraId(settings.deviceId);
        }
      }
      webcamStreamRef.current = stream;
      setWebcamStream(stream);
      // Refresh device labels now that permission is granted.
      enumerateDevices().then(setDevices);
    } catch (e) {
      const err = e as DOMException;
      if (err.name === "NotAllowedError" || err.name === "SecurityError") {
        setError({ kind: "cam-denied", message: "errCamDenied" });
      } else {
        setError({ kind: "cam", message: "warnCamNoStream" });
      }
      setSettings((s) => ({ ...s, webcamEnabled: false }));
    }
  }, [selectedCameraId]);

  const disableWebcam = useCallback(() => {
    stopWebcamPreview();
    setSettings((s) => ({ ...s, webcamEnabled: false }));
  }, [stopWebcamPreview]);

  const toggleWebcam = useCallback(
    (enabled: boolean) => {
      if (enabled) {
        setSettings((s) => ({ ...s, webcamEnabled: true }));
        void enableWebcam();
      } else {
        disableWebcam();
      }
    },
    [enableWebcam, disableWebcam],
  );

  // Re-acquire webcam if device changes while enabled & idle
  useEffect(() => {
    if (settings.webcamEnabled && status === "idle" && webcamStreamRef.current) {
      const track = webcamStreamRef.current.getVideoTracks()[0];
      const currentId = track?.getSettings().deviceId;
      if (currentId && currentId !== selectedCameraId && selectedCameraId) {
        void enableWebcam();
      }
    }
  }, [selectedCameraId]);

  // ---------------- Devices ----------------

  const refreshDevices = useCallback(async () => {
    const list = await enumerateDevices();
    setDevices(list);
    if (!selectedCameraId && list.cameras[0]) setSelectedCameraId(list.cameras[0].deviceId);
    if (!selectedMicId && list.mics[0]) setSelectedMicId(list.mics[0].deviceId);
  }, [selectedCameraId, selectedMicId]);

  // ---------------- Composite render ----------------

  const drawWatermark = (ctx: CanvasRenderingContext2D, w: number, h: number, rtl: boolean) => {
    const text = "Web Pro Record";
    ctx.save();
    const fontSize = Math.max(12, Math.round(h * 0.022));
    ctx.font = `600 ${fontSize}px var(--font-geist-sans), sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = Math.max(1, fontSize / 6);
    ctx.textBaseline = "bottom";
    const margin = Math.round(h * 0.02);
    const x = rtl ? margin : w - margin;
    ctx.textAlign = rtl ? "left" : "right";
    ctx.strokeText(text, x, h - margin);
    ctx.fillText(text, x, h - margin);
    ctx.restore();
  };

  /** Render one frame of the composite (screen + webcam overlay). */
  const renderCompositeFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const sVideo = screenVideoRef.current;
    const wVideo = webcamVideoRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = settingsRef.current;
    const W = canvas.width;
    const H = canvas.height;
    const rtl = langRef.current === "ar";

    // Base layer: screen (cover-fit to canvas to preserve aspect without bars)
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    if (sVideo && sVideo.readyState >= 2 && sVideo.videoWidth > 0) {
      // Draw screen "contain" to avoid cropping content
      const sw = sVideo.videoWidth;
      const sh = sVideo.videoHeight;
      const scale = Math.min(W / sw, H / sh);
      const dw = sw * scale;
      const dh = sh * scale;
      const dx = (W - dw) / 2;
      const dy = (H - dh) / 2;
      ctx.drawImage(sVideo, dx, dy, dw, dh);
    }

    // Webcam overlay
    if (s.webcamEnabled && wVideo && wVideo.readyState >= 2 && wVideo.videoWidth > 0) {
      const wv = wVideo.videoWidth;
      const wh = wVideo.videoHeight;
      const baseDim = Math.min(W, H);
      const targetW = Math.round((baseDim * s.webcamSize) / 100);
      const targetH = Math.round((targetW * wh) / wv);
      const margin = s.webcamMargin;
      let x: number, y: number;
      const fp = freePosRef.current;
      const pos = s.webcamPosition;
      if (fp) {
        // Free position: normalized 0..1 of available area (canvas minus overlay size).
        const maxX = Math.max(0, W - targetW);
        const maxY = Math.max(0, H - targetH);
        x = Math.round(fp.x * maxX);
        y = Math.round(fp.y * maxY);
      } else {
        // Mirror horizontally for RTL? Keep position logical: in RTL we mirror left/right.
        const mirror = rtl;
        const tl = mirror ? "top-right" : "top-left";
        const tr = mirror ? "top-left" : "top-right";
        const bl = mirror ? "bottom-right" : "bottom-left";
        const br = mirror ? "bottom-left" : "bottom-right";
        if (pos === tl || pos === tr) y = margin;
        else y = H - targetH - margin;
        if (pos === tl || pos === bl) x = margin;
        else x = W - targetW - margin;
      }

      ctx.save();
      // Clip shape
      if (s.webcamShape === "circle") {
        const cx = x + targetW / 2;
        const cy = y + targetH / 2;
        const r = Math.min(targetW, targetH) / 2;
        // Recompute box to square for circle
        const side = Math.min(targetW, targetH);
        const sx = x + (targetW - side) / 2;
        const sy = y + (targetH - side) / 2;
        ctx.beginPath();
        ctx.arc(sx + side / 2, sy + side / 2, side / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(wVideo, sx, sy, side, side);
        // restore then draw circle border (border outside clip)
        ctx.restore();
        ctx.save();
        if (s.webcamBorder) {
          ctx.lineWidth = Math.max(2, side * 0.012);
          ctx.strokeStyle = "rgba(255,255,255,0.9)";
          ctx.beginPath();
          ctx.arc(sx + side / 2, sy + side / 2, side / 2 - ctx.lineWidth / 2, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
        void cx; void cy; void r;
      } else {
        const radius = Math.round(targetW * 0.12);
        if (s.webcamShadow) {
          ctx.save();
          ctx.shadowColor = "rgba(0,0,0,0.45)";
          ctx.shadowBlur = Math.round(targetW * 0.06);
          ctx.shadowOffsetY = Math.round(targetW * 0.02);
          drawRoundRect(ctx, x, y, targetW, targetH, radius);
          ctx.fillStyle = "#000";
          ctx.fill();
          ctx.restore();
        }
        ctx.save();
        drawRoundRect(ctx, x, y, targetW, targetH, radius);
        ctx.clip();
        ctx.drawImage(wVideo, x, y, targetW, targetH);
        ctx.restore();
        if (s.webcamBorder) {
          ctx.save();
          ctx.lineWidth = Math.max(2, targetW * 0.012);
          ctx.strokeStyle = "rgba(255,255,255,0.9)";
          drawRoundRect(ctx, x, y, targetW, targetH, radius);
          ctx.stroke();
          ctx.restore();
        }
      }
      ctx.restore();
    }

    if (s.watermark) drawWatermark(ctx, W, H, rtl);

    // Round 8: draw annotations on top of everything.
    if (drawAnnotations) {
      try {
        drawAnnotations(ctx);
      } catch {
        /* ignore annotation errors */
      }
    }
  }, [canvasRef, drawAnnotations]);

  const startRenderLoop = useCallback(() => {
    stopRaf();
    renderFrameCountRef.current = 0;
    lastFpsMeasureRef.current = performance.now();
    // Throttle drawing to the effective FPS (adaptive downgrade support).
    let lastDraw = 0;
    const loop = (now: number) => {
      const targetFps = Number(effectiveFpsRef.current ?? settingsRef.current.frameRate);
      const interval = 1000 / targetFps;
      if (now - lastDraw >= interval) {
        const t0 = performance.now();
        renderCompositeFrame();
        // Round 7: accumulate render time for profiling.
        renderTimeAccumRef.current += performance.now() - t0;
        renderTimeSamplesRef.current += 1;
        renderFrameCountRef.current += 1;
        lastDraw = now;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [stopRaf, renderCompositeFrame]);

  /** Round 7: Start the profiling data sampler (updates every 1s). */
  const startProfiling = useCallback(() => {
    if (profilingTimerRef.current) return;
    profilingTimerRef.current = setInterval(() => {
      if (statusRef.current !== "recording") return;
      const avgRender =
        renderTimeSamplesRef.current > 0
          ? renderTimeAccumRef.current / renderTimeSamplesRef.current
          : 0;
      // Reset accumulators for the next window.
      renderTimeAccumRef.current = 0;
      renderTimeSamplesRef.current = 0;
      // Memory (Chromium-only).
      const perfWithMemory = performance as Performance & {
        memory?: { usedJSHeapSize: number };
      };
      const memMb = perfWithMemory.memory
        ? perfWithMemory.memory.usedJSHeapSize / (1024 * 1024)
        : 0;
      const canvas = canvasRef.current;
      const vTrack = screenStreamRef.current?.getVideoTracks()[0];
      const aTracks = combinedStreamRef.current?.getAudioTracks() ?? [];
      setProfiling({
        renderTime: Math.round(avgRender * 10) / 10,
        memoryUsed: Math.round(memMb * 10) / 10,
        canvasWidth: canvas?.width ?? 0,
        canvasHeight: canvas?.height ?? 0,
        videoTrackState: vTrack?.readyState ?? "—",
        audioTrackState: aTracks[0]?.readyState ?? "—",
        audioContextState: audioContextRef.current?.state ?? "closed",
        streamTrackCount: combinedStreamRef.current?.getTracks().length ?? 0,
      });
    }, 1000);
  }, [canvasRef]);

  /** Round 7: Stop the profiling data sampler. */
  const stopProfiling = useCallback(() => {
    if (profilingTimerRef.current) {
      clearInterval(profilingTimerRef.current);
      profilingTimerRef.current = null;
    }
    setProfiling(null);
  }, []);

  /** Measure actual render FPS over a 1s window via a separate rAF. */
  const startFpsMeasurement = useCallback(() => {
    if (fpsMeasureRafRef.current != null) return;
    const measure = () => {
      const now = performance.now();
      const elapsed = now - lastFpsMeasureRef.current;
      if (elapsed >= 1000) {
        const fps = Math.round((renderFrameCountRef.current * 1000) / elapsed);
        setActualFps(fps);
        lastFpsRef.current = fps;
        // Round 5: accumulate stats for the post-recording summary.
        totalFramesRef.current += renderFrameCountRef.current;
        fpsSumRef.current += fps;
        fpsSamplesRef.current += 1;
        renderFrameCountRef.current = 0;
        lastFpsMeasureRef.current = now;
      }
      fpsMeasureRafRef.current = requestAnimationFrame(measure);
    };
    fpsMeasureRafRef.current = requestAnimationFrame(measure);
  }, []);

  /** Stop FPS measurement. */
  const stopFpsMeasurement = useCallback(() => {
    if (fpsMeasureRafRef.current != null) {
      cancelAnimationFrame(fpsMeasureRafRef.current);
      fpsMeasureRafRef.current = null;
    }
    setActualFps(0);
  }, []);

  /** Check if FPS is too low and auto-downgrade the effective frame rate. */
  const checkAdaptiveFps = useCallback(() => {
    const s = settingsRef.current;
    if (!s.adaptiveFps) return;
    const target = Number(effectiveFpsRef.current ?? s.frameRate);
    const measured = lastFpsRef.current;
    // If we're achieving less than 70% of target and target > 24, downgrade.
    if (target > 24 && measured > 0 && measured < target * 0.7) {
      const downgraded: FrameRate = target >= 60 ? "30" : "24";
      if (effectiveFpsRef.current !== downgraded) {
        effectiveFpsRef.current = downgraded;
        setEffectiveFps(downgraded);
        setFpsDowngraded(true);
      }
    }
  }, []);

  // Idle webcam preview: draw a placeholder + webcam to the canvas so the user
  // sees overlay positioning. Only when webcam enabled and not recording.
  const startIdlePreviewLoop = useCallback(() => {
    ensureHiddenVideos();
    const wVideo = webcamVideoRef.current;
    const stream = webcamStreamRef.current;
    if (wVideo && stream && wVideo.srcObject !== stream) {
      wVideo.srcObject = stream;
      void wVideo.play().catch(() => {});
    }
    // Ensure canvas has a sensible default size for idle preview
    const canvas = canvasRef.current;
    if (canvas && (canvas.width === 0 || canvas.width === 300)) {
      canvas.width = 1280;
      canvas.height = 720;
    }
    stopRaf();
    const loop = () => {
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        const W = canvas.width;
        const H = canvas.height;
        // Placeholder background
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = "#0b0f10";
        ctx.fillRect(0, 0, W, H);
        // dot grid
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        const gap = 26;
        for (let y = gap; y < H; y += gap) {
          for (let x = gap; x < W; x += gap) {
            ctx.beginPath();
            ctx.arc(x, y, 1.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        // placeholder text
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = `600 ${Math.round(H * 0.04)}px var(--font-geist-sans), sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(langRef.current === "ar" ? "معاينة الكاميرا" : "Webcam preview", W / 2, H / 2 - 10);
        ctx.font = `400 ${Math.round(H * 0.026)}px var(--font-geist-sans), sans-serif`;
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fillText(langRef.current === "ar" ? "اضغط ابدأ التسجيل لالتقاط الشاشة" : "Press Start to capture your screen", W / 2, H / 2 + 24);
        // Note: the webcam overlay is rendered as a separate draggable CSS element in idle mode,
        // so we do NOT call renderCompositeFrame() here (it would double-draw the webcam).
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();
  }, [canvasRef, ensureHiddenVideos, stopRaf]);

  // Start/stop idle preview based on settings + status
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (settings.webcamEnabled && status === "idle" && webcamStream) {
      startIdlePreviewLoop();
    } else if (!settings.webcamEnabled && status === "idle") {
      stopRaf();
      // Clear canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = 1280;
          canvas.height = 720;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    }
    return () => {
      if (status === "idle") stopRaf();
    };
  }, [settings.webcamEnabled, status, webcamStream, startIdlePreviewLoop, stopRaf]);

  // ---------------- Mic level meter ----------------

  const startMicLevelLoop = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.fftSize);
    const loop = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      setMicLevel(clamp(rms * 2.2, 0, 1));
      micLevelRafRef.current = requestAnimationFrame(loop);
    };
    loop();
  }, []);

  /** Round 4: waveform loop — captures time-domain samples for visualization. */
  const startWaveformLoop = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    // Downsample to 64 samples for a compact waveform.
    const targetSize = 64;
    const buf = new Uint8Array(analyser.fftSize);
    const loop = () => {
      analyser.getByteTimeDomainData(buf);
      // Resample to targetSize by averaging.
      const out = new Uint8Array(targetSize);
      const step = Math.floor(buf.length / targetSize);
      let maxLevel = 0;
      for (let i = 0; i < targetSize; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) {
          sum += buf[i * step + j];
        }
        const avg = sum / step;
        out[i] = avg;
        const dev = Math.abs(avg - 128) / 128;
        if (dev > maxLevel) maxLevel = dev;
      }
      setWaveform({ samples: out, level: maxLevel });
      // Round 5: track peak audio level for the post-recording summary.
      if (maxLevel > peakAudioRef.current) peakAudioRef.current = maxLevel;
      waveformRafRef.current = requestAnimationFrame(loop);
    };
    loop();
  }, []);

  const stopWaveformLoop = useCallback(() => {
    if (waveformRafRef.current != null) {
      cancelAnimationFrame(waveformRafRef.current);
      waveformRafRef.current = null;
    }
    setWaveform({ samples: new Uint8Array(0), level: 0 });
  }, []);

  // ---------------- Audio mixing ----------------

  const buildMixedAudio = useCallback((): MediaStreamTrack[] => {
    const s = settingsRef.current;
    const AC: typeof AudioContext =
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!;
    if (!AC) return [];
    const ctx = new AC();
    audioContextRef.current = ctx;
    const dest = ctx.createMediaStreamDestination();
    audioDestRef.current = dest;

    const screenAudioTracks = screenStreamRef.current?.getAudioTracks() ?? [];
    const micTracks = micStreamRef.current?.getAudioTracks() ?? [];
    const hasScreenAudio = s.systemAudioEnabled && screenAudioTracks.length > 0;
    const hasMic = s.micEnabled && micTracks.length > 0;

    if (!hasScreenAudio && !hasMic) {
      return [];
    }

    if (hasScreenAudio) {
      try {
        const src = ctx.createMediaStreamSource(screenStreamRef.current!);
        src.connect(dest);
      } catch {
        /* ignore */
      }
    }
    if (hasMic) {
      try {
        const src = ctx.createMediaStreamSource(micStreamRef.current!);
        src.connect(dest);
        // Analyser for level meter
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        src.connect(analyser);
        analyserRef.current = analyser;
      } catch {
        /* ignore */
      }
    }
    return dest.stream.getAudioTracks();
  }, []);

  // ---------------- Timer ----------------

  const startTimer = useCallback(() => {
    clearTimer();
    startTimeRef.current = performance.now();
    pausedAccumRef.current = 0;
    pauseStartRef.current = 0;
    setElapsed(0);
    timerRef.current = setInterval(() => {
      if (statusRef.current !== "recording") return;
      const now = performance.now();
      const e = (now - startTimeRef.current - pausedAccumRef.current) / 1000;
      setElapsed(e);
    }, 250);
  }, [clearTimer]);

  const pauseTimer = useCallback(() => {
    pauseStartRef.current = performance.now();
  }, []);

  const resumeTimer = useCallback(() => {
    if (pauseStartRef.current) {
      pausedAccumRef.current += performance.now() - pauseStartRef.current;
      pauseStartRef.current = 0;
    }
  }, []);

  // ---------------- Countdown ----------------

  const runCountdown = useCallback(
    (seconds: number) =>
      new Promise<void>((resolve) => {
        setCountdownValue(seconds);
        setStatus("countdown");
        let remaining = seconds;
        const tick = () => {
          setCountdownValue(remaining);
          if (remaining <= 0) {
            setCountdownValue(null);
            resolve();
            return;
          }
          remaining -= 1;
          setTimeout(tick, 1000);
        };
        tick();
      }),
    [],
  );

  // ---------------- Round 3: free position, snapshots, PiP, live stats ----------------
  // (declared before startRecording so they can be referenced in its deps)

  /** Set a normalized free position (0..1). null resets to the preset position. */
  const setWebcamFreePos = useCallback((pos: FreePos) => {
    freePosRef.current = pos;
    setFreePos(pos);
  }, []);

  /** Capture a still frame from the current canvas (snapshot during recording). */
  const captureSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const id = `snap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const snap: Snapshot = {
        id,
        url: dataUrl,
        dataUrl,
        width: canvas.width,
        height: canvas.height,
        createdAt: Date.now(),
        elapsed:
          (performance.now() - startTimeRef.current - pausedAccumRef.current) / 1000,
      };
      setSnapshots((prev) => [snap, ...prev].slice(0, 24));
    } catch {
      /* canvas.toDataURL may throw if tainted; ignore */
    }
  }, [canvasRef]);

  const removeSnapshot = useCallback((id: string) => {
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clearSnapshots = useCallback(() => {
    setSnapshots([]);
  }, []);

  /** Download a snapshot as PNG. */
  const downloadSnapshot = useCallback((snap: Snapshot) => {
    const a = document.createElement("a");
    a.href = snap.url;
    a.download = `wpr-snapshot-${Math.round(snap.elapsed)}s.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  // ---------------- Round 5: clip capture + preset application ----------------

  /** Capture a short (5s) video clip from the live composite stream. */
  const captureClip = useCallback(() => {
    if (clipRecording) return;
    const source = combinedStreamRef.current;
    if (!source) return;
    setClipRecording(true);
    clipChunksRef.current = [];
    // Clone the stream so stopping the clip doesn't affect the main recording.
    const clone = source.clone();
    clipStreamRef.current = clone;
    const mime = pickMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(clone, mime ? { mimeType: mime } : {});
    } catch {
      recorder = new MediaRecorder(clone);
    }
    clipRecorderRef.current = recorder;
    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) clipChunksRef.current.push(ev.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(clipChunksRef.current, { type: mime || "video/webm" });
      const url = URL.createObjectURL(blob);
      const clip: Clip = {
        id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        url,
        blob,
        duration: 5,
        size: blob.size,
        createdAt: Date.now(),
        elapsed: (performance.now() - startTimeRef.current - pausedAccumRef.current) / 1000,
      };
      setClips((prev) => [clip, ...prev].slice(0, 12));
      stopStream(clone);
      clipStreamRef.current = null;
      clipRecorderRef.current = null;
      clipChunksRef.current = [];
      setClipRecording(false);
    };
    recorder.start();
    // Auto-stop after 5 seconds.
    setTimeout(() => {
      if (recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          /* ignore */
        }
      }
    }, 5000);
  }, [clipRecording]);

  const removeClip = useCallback((id: string) => {
    setClips((prev) => {
      const clip = prev.find((c) => c.id === id);
      if (clip) URL.revokeObjectURL(clip.url);
      return prev.filter((c) => c.id !== id);
    });
  }, []);

  const clearClips = useCallback(() => {
    setClips((prev) => {
      prev.forEach((c) => URL.revokeObjectURL(c.url));
      return [];
    });
  }, []);

  const downloadClip = useCallback((clip: Clip) => {
    const a = document.createElement("a");
    a.href = clip.url;
    const ext = mimeToExtension(pickMimeType());
    a.download = `wpr-clip-${Math.round(clip.elapsed)}s.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  /** Apply a recording preset (partial settings merge). */
  const applyPreset = useCallback((partial: Partial<RecorderSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  // ---------------- Round 7: history management ----------------

  /** Remove a single history entry by id (revokes its URL). */
  const removeHistoryEntry = useCallback((id: string) => {
    setHistory((prev) => {
      const entry = prev.find((e) => e.id === id);
      // Don't revoke if it's the current result URL (still in use by the player).
      if (entry && entry.url !== resultUrlRef.current) {
        URL.revokeObjectURL(entry.url);
      }
      return prev.filter((e) => e.id !== id);
    });
  }, []);

  /** Clear all history entries (revokes URLs that aren't the current result). */
  const clearHistory = useCallback(() => {
    setHistory((prev) => {
      prev.forEach((e) => {
        if (e.url !== resultUrlRef.current) URL.revokeObjectURL(e.url);
      });
      return [];
    });
  }, []);

  /** Restore a history entry to the player (sets it as the current result). */
  const restoreHistoryEntry = useCallback((id: string) => {
    setHistory((prev) => {
      const entry = prev.find((e) => e.id === id);
      if (!entry) return prev;
      // Set as current result so the player + stats show it.
      if (resultUrlRef.current && resultUrlRef.current !== entry.url) {
        URL.revokeObjectURL(resultUrlRef.current);
      }
      resultUrlRef.current = entry.url;
      setResult({
        url: entry.url,
        blob: entry.blob,
        duration: entry.duration,
        mimeType: entry.mimeType,
        size: entry.size,
        width: entry.width,
        height: entry.height,
        createdAt: entry.createdAt,
      });
      setRecordingStats({
        avgFps: 0,
        totalFrames: 0,
        peakAudio: 0,
        duration: entry.duration,
        fileSize: entry.size,
        width: entry.width,
        height: entry.height,
        codec: entry.codec,
      });
      setStatus("stopped");
      return prev;
    });
  }, []);

  /** Download a history entry's video. */
  const downloadHistoryEntry = useCallback((entry: HistoryEntry) => {
    const ext = mimeToExtension(entry.mimeType);
    const a = document.createElement("a");
    a.href = entry.url;
    const ts = new Date(entry.createdAt).toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.download = `web-pro-record-${ts}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  /** Ensure a hidden <video> exists for PiP (must be in DOM & playing for PiP). */
  const ensurePipVideo = useCallback(() => {
    if (typeof document === "undefined") return;
    if (!pipVideoRef.current) {
      const v = document.createElement("video");
      v.muted = true;
      (v as HTMLVideoElement & { playsInline?: boolean }).playsInline = true;
      v.style.position = "fixed";
      v.style.width = "2px";
      v.style.height = "2px";
      v.style.opacity = "0";
      v.style.pointerEvents = "none";
      v.style.top = "-9999px";
      v.style.left = "-9999px";
      document.body.appendChild(v);
      v.addEventListener("enterpictureinpicture", () => setPipActive(true));
      v.addEventListener("leavepictureinpicture", () => setPipActive(false));
      pipVideoRef.current = v;
    }
  }, []);

  /** Toggle Picture-in-Picture on a dedicated hidden video bound to the combined stream. */
  const togglePiP = useCallback(async () => {
    const video = pipVideoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setPipActive(false);
      } else {
        const stream = combinedStreamRef.current;
        if (stream && video.srcObject !== stream) {
          video.srcObject = stream;
        }
        await video.play().catch(() => {});
        await video.requestPictureInPicture?.();
        setPipActive(true);
      }
    } catch {
      /* PiP not supported or denied — ignore */
    }
  }, []);

  /** Start the live-stats interval (updates elapsed/est-size/fps every 500ms). */
  const startStatsLoop = useCallback(() => {
    if (statsTimerRef.current) return;
    const fps = Number(settingsRef.current.frameRate);
    const vbr = settingsRef.current.videoBitrate || qualityToVideoBitrate(settingsRef.current.quality, fps);
    const abr = settingsRef.current.audioBitrate || 128_000;
    const bytesPerSec = (vbr + abr) / 8;
    lastFpsTimeRef.current = performance.now();
    frameCountRef.current = 0;
    statsTimerRef.current = setInterval(() => {
      if (statusRef.current !== "recording") return;
      const now = performance.now();
      const e = (now - startTimeRef.current - pausedAccumRef.current) / 1000;
      setLiveStats({
        elapsed: e,
        estimatedBytes: Math.round(e * bytesPerSec),
        fps: lastFpsRef.current || fps,
        audioActive: !!analyserRef.current,
      });
    }, 500);
  }, []);

  /** Stop the live-stats interval. */
  const stopStatsLoop = useCallback(() => {
    if (statsTimerRef.current) {
      clearInterval(statsTimerRef.current);
      statsTimerRef.current = null;
    }
  }, []);

  // ---------------- Start / pause / resume / stop ----------------

  const startRecording = useCallback(async () => {
    const s = settingsRef.current;
    setError(null);
    setWarning(null);

    if (!features?.getDisplayMedia || !features?.mediaRecorder) {
      setError({ kind: "unsupported", message: "errUnsupported" });
      return;
    }
    if (!s.webcamEnabled && !s.micEnabled) {
      // Screen is always required; mic/webcam optional. Screen alone is valid.
    }

    // Countdown
    if (s.countdown && s.countdownSeconds > 0) {
      await runCountdown(s.countdownSeconds);
      if (statusRef.current !== "countdown") return; // user cancelled
    }

    ensureHiddenVideos();
    chunksRef.current = [];

    try {
      // 1) Screen capture
      const displayConstraints: DisplayMediaStreamOptions = {
        video: {
          frameRate: { ideal: Number(s.frameRate) },
        } as MediaTrackConstraints,
        audio: s.systemAudioEnabled,
      };
      let screen: MediaStream;
      try {
        screen = await navigator.mediaDevices.getDisplayMedia(displayConstraints);
      } catch (e) {
        const err = e as DOMException;
        if (err.name === "NotAllowedError") {
          setError({ kind: "screen-denied", message: "errScreenDenied" });
        } else {
          setError({ kind: "screen", message: "errScreenDenied" });
        }
        return;
      }
      screenStreamRef.current = screen;
      setScreenStream(screen);
      const vTrack = screen.getVideoTracks()[0];
      const label = vTrack?.label || "";
      setScreenLabel(label);

      // Detect if system audio actually came through
      const gotSystemAudio = screen.getAudioTracks().length > 0;
      if (s.systemAudioEnabled && !gotSystemAudio) {
        setWarning("systemAudioHint");
      }

      // Handle user stopping screen share from browser UI
      vTrack?.addEventListener("ended", () => {
        if (statusRef.current === "recording" || statusRef.current === "paused") {
          setWarning("errScreenEnded");
          void stopRecording(true);
        }
      });

      // 2) Microphone
      if (s.micEnabled) {
        try {
          const micConstraints: MediaStreamConstraints = {
            audio: selectedMicId
              ? { deviceId: { exact: selectedMicId } }
              : { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            video: false,
          };
          const mic = await navigator.mediaDevices.getUserMedia(micConstraints);
          micStreamRef.current = mic;
          const mt = mic.getAudioTracks()[0];
          if (mt) {
            const ms = mt.getSettings();
            if (ms.deviceId && !selectedMicId) setSelectedMicId(ms.deviceId);
          }
        } catch (e) {
          const err = e as DOMException;
          if (err.name === "NotAllowedError") {
            setWarning("errMicDenied");
          } else {
            setWarning("errMicDenied");
          }
          // Continue without mic
        }
      }

      // Refresh device labels after permissions
      enumerateDevices().then(setDevices);

      // 3) Set up screen video element
      const sVideo = screenVideoRef.current!;
      sVideo.srcObject = screen;
      await sVideo.play().catch(() => {});
      // Wait for dimensions
      if (!sVideo.videoWidth) {
        await new Promise<void>((resolve) => {
          const onLoaded = () => {
            sVideo.removeEventListener("loadedmetadata", onLoaded);
            resolve();
          };
          sVideo.addEventListener("loadedmetadata", onLoaded);
          setTimeout(resolve, 800);
        });
      }

      // 4) Webcam video element
      if (s.webcamEnabled && webcamStreamRef.current) {
        const wVideo = webcamVideoRef.current!;
        wVideo.srcObject = webcamStreamRef.current;
        await wVideo.play().catch(() => {});
      }

      // 5) Build combined stream
      const fps = Number(s.frameRate);
      const trackSettings = vTrack?.getSettings();
      const trackW = trackSettings?.width ?? sVideo.videoWidth ?? 1280;
      const trackH = trackSettings?.height ?? sVideo.videoHeight ?? 720;
      const { width, height } = computeCanvasSize(trackW, trackH, s.quality);

      let videoTracks: MediaStreamTrack[];
      const useCanvas = s.webcamEnabled && features.canvasCapture && !!canvasRef.current;

      if (useCanvas) {
        const canvas = canvasRef.current!;
        canvas.width = width;
        canvas.height = height;
        startRenderLoop();
        const canvasStream = canvas.captureStream(fps);
        videoTracks = canvasStream.getVideoTracks();
      } else {
        videoTracks = vTrack ? [vTrack] : [];
      }

      // 6) Audio mix
      const audioTracks = buildMixedAudio();

      // 7) Combined stream
      const combined = new MediaStream([...videoTracks, ...audioTracks]);
      combinedStreamRef.current = combined;

      // 8) MediaRecorder
      const mimeType = pickMimeType();
      const recorderOptions: MediaRecorderOptions = {};
      if (mimeType) recorderOptions.mimeType = mimeType;
      const vbr = s.videoBitrate || qualityToVideoBitrate(s.quality, fps);
      recorderOptions.videoBitsPerSecond = vbr;
      if (s.audioBitrate) recorderOptions.audioBitsPerSecond = s.audioBitrate;

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(combined, recorderOptions);
      } catch {
        // Fallback without options
        recorder = new MediaRecorder(combined);
      }
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          chunksRef.current.push(ev.data);
        }
      };
      recorder.onerror = () => {
        setError({ kind: "recorder", message: "errRecorder" });
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || "video/webm",
        });
        const finalMime = blob.type || mimeType || "video/webm";
        // Revoke previous URL
        if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
        const url = URL.createObjectURL(blob);
        resultUrlRef.current = url;
        const duration =
          (performance.now() - startTimeRef.current - pausedAccumRef.current) / 1000;
        setResult({
          url,
          blob,
          duration: Math.max(0, duration),
          mimeType: finalMime,
          size: blob.size,
          width,
          height,
          createdAt: Date.now(),
        });
        // Round 5: compute post-recording stats summary.
        const avgFps = fpsSamplesRef.current > 0
          ? Math.round(fpsSumRef.current / fpsSamplesRef.current)
          : Number(settingsRef.current.frameRate);
        setRecordingStats({
          avgFps,
          totalFrames: totalFramesRef.current,
          peakAudio: peakAudioRef.current,
          duration: Math.max(0, duration),
          fileSize: blob.size,
          width,
          height,
          codec: mimeToLabel(finalMime),
        });
        // Round 7: add to recording history with a thumbnail.
        try {
          const thumbCanvas = canvasRef.current;
          const thumb =
            thumbCanvas && thumbCanvas.width > 0
              ? thumbCanvas.toDataURL("image/jpeg", 0.6)
              : "";
          const entry: HistoryEntry = {
            id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            url,
            blob,
            duration: Math.max(0, duration),
            size: blob.size,
            mimeType: finalMime,
            width,
            height,
            createdAt: Date.now(),
            thumbnail: thumb,
            codec: mimeToLabel(finalMime),
          };
          setHistory((prev) => [entry, ...prev].slice(0, 12));
        } catch {
          /* thumbnail may fail if canvas tainted; ignore */
        }
        setStatus("stopped");
        setElapsed(Math.max(0, duration));
        // Cleanup media tracks but keep result
        // Stop tracks except keep webcam for potential idle preview
        stopStream(screenStreamRef.current);
        stopStream(micStreamRef.current);
        stopStream(combinedStreamRef.current);
        screenStreamRef.current = null;
        micStreamRef.current = null;
        combinedStreamRef.current = null;
        setScreenStream(null);
        if (audioContextRef.current) {
          try {
            void audioContextRef.current.close();
          } catch {
            /* ignore */
          }
          audioContextRef.current = null;
          audioDestRef.current = null;
          analyserRef.current = null;
        }
        stopRaf();
        stopMicLevelLoop();
        clearTimer();
        if (statsTimerRef.current) {
          clearInterval(statsTimerRef.current);
          statsTimerRef.current = null;
        }
        if (fpsMeasureRafRef.current != null) {
          cancelAnimationFrame(fpsMeasureRafRef.current);
          fpsMeasureRafRef.current = null;
        }
        if (waveformRafRef.current != null) {
          cancelAnimationFrame(waveformRafRef.current);
          waveformRafRef.current = null;
        }
        if (downgradeCheckRef.current) {
          clearInterval(downgradeCheckRef.current);
          downgradeCheckRef.current = null;
        }
        setActualFps(0);
        setFpsDowngraded(false);
        setEffectiveFps(null);
        effectiveFpsRef.current = null;
        setWaveform({ samples: new Uint8Array(0), level: 0 });
        if (sVideo) sVideo.srcObject = null;
        // Restart idle webcam preview if still enabled
        if (settingsRef.current.webcamEnabled && webcamStreamRef.current) {
          // trigger idle preview
          setTimeout(() => {
            if (settingsRef.current.webcamEnabled && statusRef.current !== "recording") {
              startIdlePreviewLoop();
            }
          }, 100);
        }
      };

      recorder.start(1000); // collect data every second
      setStatus("recording");
      startTimer();
      // Round 5: reset stats accumulators at recording start.
      peakAudioRef.current = 0;
      totalFramesRef.current = 0;
      fpsSumRef.current = 0;
      fpsSamplesRef.current = 0;
      ensurePipVideo();
      startStatsLoop();
      // Round 7: start profiling sampler
      startProfiling();
      // Round 4: FPS measurement + adaptive downgrade + waveform
      if (useCanvas) {
        startFpsMeasurement();
        // Check adaptive FPS every 3s after a 4s warmup.
        downgradeCheckRef.current = setInterval(() => {
          checkAdaptiveFps();
        }, 3000);
      }
      if (analyserRef.current) {
        startMicLevelLoop();
        startWaveformLoop();
      }
    } catch (e) {
      setError({ kind: "generic", message: "errGeneric" });
      cleanupMedia();
    }
  }, [canvasRef, features, ensureHiddenVideos, runCountdown, buildMixedAudio, startRenderLoop, startTimer, startMicLevelLoop, startWaveformLoop, startIdlePreviewLoop, selectedMicId, cleanupMedia, ensurePipVideo, startStatsLoop, startFpsMeasurement, checkAdaptiveFps, startProfiling]);

  const pauseRecording = useCallback(() => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state === "recording") {
      try {
        rec.pause();
      } catch {
        /* ignore */
      }
      setStatus("paused");
      pauseTimer();
      stopMicLevelLoop();
      stopStatsLoop();
      stopWaveformLoop();
      stopFpsMeasurement();
      stopProfiling();
    }
  }, [pauseTimer, stopMicLevelLoop, stopStatsLoop, stopWaveformLoop, stopFpsMeasurement, stopProfiling]);

  const resumeRecording = useCallback(() => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state === "paused") {
      try {
        rec.resume();
      } catch {
        /* ignore */
      }
      setStatus("recording");
      resumeTimer();
      startStatsLoop();
      startFpsMeasurement();
      startProfiling();
      if (analyserRef.current) {
        startMicLevelLoop();
        startWaveformLoop();
      }
    }
  }, [resumeTimer, startMicLevelLoop, startStatsLoop, startWaveformLoop, startFpsMeasurement, startProfiling]);

  // ---------------- Reset / actions ----------------

  const resetAll = useCallback(() => {
    cleanupAll();
  }, [cleanupAll]);

  const recordAgain = useCallback(() => {
    // Clear previous result, keep settings & webcam preview
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }
    setResult(null);
    setElapsed(0);
    setError(null);
    setWarning(null);
    setStatus("idle");
    setCountdownValue(null);
    if (settingsRef.current.webcamEnabled && webcamStreamRef.current) {
      startIdlePreviewLoop();
    }
  }, [startIdlePreviewLoop]);

  const cancelCountdown = useCallback(() => {
    setCountdownValue(null);
    setStatus("idle");
  }, []);

  const downloadVideo = useCallback(() => {
    if (!result) return;
    const ext = mimeToExtension(result.mimeType);
    const a = document.createElement("a");
    a.href = result.url;
    const ts = new Date(result.createdAt).toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.download = `web-pro-record-${ts}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [result]);

  const copyTechnicalDetails = useCallback(async () => {
    if (!result) return;
    const details = [
      `Web Pro Record — Technical details`,
      `Created: ${new Date(result.createdAt).toISOString()}`,
      `Duration: ${formatDuration(result.duration)} (${result.duration.toFixed(2)}s)`,
      `MIME: ${result.mimeType}`,
      `Format: ${mimeToLabel(result.mimeType)}`,
      `Size: ${formatBytes(result.size)} (${result.size} bytes)`,
      `Resolution: ${result.width} × ${result.height}`,
      `Language: ${langRef.current}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(details);
      return true;
    } catch {
      return false;
    }
  }, [result]);

  /** Round 6: Export recording stats as a JSON string. */
  const exportStatsJson = useCallback((): string => {
    const payload = {
      app: "Web Pro Record",
      createdAt: result ? new Date(result.createdAt).toISOString() : null,
      stats: recordingStats,
      recording: result
        ? {
            duration: result.duration,
            mimeType: result.mimeType,
            format: mimeToLabel(result.mimeType),
            size: result.size,
            width: result.width,
            height: result.height,
          }
        : null,
      settings: {
        quality: settingsRef.current.quality,
        frameRate: settingsRef.current.frameRate,
        videoBitrate: settingsRef.current.videoBitrate,
        audioBitrate: settingsRef.current.audioBitrate,
        adaptiveFps: settingsRef.current.adaptiveFps,
      },
      language: langRef.current,
    };
    return JSON.stringify(payload, null, 2);
  }, [result, recordingStats]);

  /** Download the stats JSON as a file. */
  const downloadStatsJson = useCallback(() => {
    const json = exportStatsJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ts = result ? new Date(result.createdAt).toISOString().slice(0, 19).replace(/[:T]/g, "-") : Date.now().toString();
    a.download = `wpr-stats-${ts}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportStatsJson, result]);

  /** Copy the stats JSON to the clipboard. */
  const copyStatsJson = useCallback(async (): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(exportStatsJson());
      return true;
    } catch {
      return false;
    }
  }, [exportStatsJson]);

  // ---------------- Derived ----------------

  const previewMode: PreviewMode = (() => {
    if (status === "recording" || status === "paused") {
      return settings.webcamEnabled && features?.canvasCapture ? "composite" : "direct";
    }
    if (status === "idle" && settings.webcamEnabled && webcamStream) return "webcam-idle";
    if (status === "stopped") return "empty";
    return "empty";
  })();

  const isRecording = status === "recording";
  const isPaused = status === "paused";
  const canStart =
    !!features?.getDisplayMedia &&
    !!features?.mediaRecorder &&
    (status === "idle" || status === "stopped");

  const updateSettings = useCallback(<K extends keyof RecorderSettings>(key: K, value: RecorderSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Unmount cleanup — runs once (cleanupAll is stable).
  useEffect(() => {
    return () => {
      cleanupAll();
    };
  }, [cleanupAll]);

  return {
    // state
    status,
    elapsed,
    error,
    warning,
    settings,
    result,
    devices,
    selectedCameraId,
    selectedMicId,
    features,
    micLevel,
    countdownValue,
    screenLabel,
    webcamStream,
    screenStream,
    previewMode,
    negotiatedMime,
    // Round 3 state
    freePos,
    snapshots,
    liveStats,
    pipActive,
    // Round 4 state
    waveform,
    actualFps,
    fpsDowngraded,
    effectiveFps,
    // Round 5 state
    recordingStats,
    clips,
    clipRecording,
    // Round 3 actions
    setWebcamFreePos,
    captureSnapshot,
    removeSnapshot,
    clearSnapshots,
    downloadSnapshot,
    togglePiP,
    // Round 5 actions
    captureClip,
    removeClip,
    clearClips,
    downloadClip,
    applyPreset,
    // Round 6 actions
    exportStatsJson,
    downloadStatsJson,
    copyStatsJson,
    // Round 7 state
    profiling,
    showProfiling,
    history,
    // Round 7 actions
    setShowProfiling,
    removeHistoryEntry,
    clearHistory,
    restoreHistoryEntry,
    downloadHistoryEntry,
    isRecording,
    isPaused,
    canStart,
    // actions
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetAll,
    recordAgain,
    cancelCountdown,
    downloadVideo,
    copyTechnicalDetails,
    refreshDevices,
    enableWebcam,
    disableWebcam,
    toggleWebcam,
    updateSettings,
    setSelectedCameraId,
    setSelectedMicId,
    setError,
    setWarning,
    clearError: () => setError(null),
    clearWarning: () => setWarning(null),
    // helpers for display
    formatDuration,
    formatBytes,
    mimeToLabel,
  };
}

export type UseRecorder = ReturnType<typeof useRecorder>;
