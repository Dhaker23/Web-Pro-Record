"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
};

export function useRecorder(
  lang: "en" | "ar",
  canvasRef: RefObject<HTMLCanvasElement | null>,
) {
  // --- UI state ---
  const [status, setStatus] = useState<RecStatus>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<RecorderError>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [settings, setSettings] = useState<RecorderSettings>(DEFAULT_SETTINGS);
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
      const pos = s.webcamPosition;
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
  }, [canvasRef]);

  const startRenderLoop = useCallback(() => {
    stopRaf();
    const loop = () => {
      renderCompositeFrame();
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();
  }, [stopRaf, renderCompositeFrame]);

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
        // Draw webcam overlay using the same compositor (it reads settingsRef)
        renderCompositeFrame();
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();
  }, [canvasRef, ensureHiddenVideos, stopRaf, renderCompositeFrame]);

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
      if (analyserRef.current) startMicLevelLoop();
    } catch (e) {
      setError({ kind: "generic", message: "errGeneric" });
      cleanupMedia();
    }
  }, [canvasRef, features, ensureHiddenVideos, runCountdown, buildMixedAudio, startRenderLoop, startTimer, startMicLevelLoop, startIdlePreviewLoop, selectedMicId, cleanupMedia]);

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
    }
  }, [pauseTimer, stopMicLevelLoop]);

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
      if (analyserRef.current) startMicLevelLoop();
    }
  }, [resumeTimer, startMicLevelLoop]);

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
