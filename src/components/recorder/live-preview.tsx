"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import {
  Monitor,
  Webcam,
  Mic,
  Volume2,
  Maximize2,
  Radio,
  Pause,
  Loader2,
  PictureInPicture2,
  Camera,
  Clapperboard,
  PenLine,
  GripVertical,
  Activity,
  HardDrive,
  Timer,
  Gauge,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatBytes, formatDuration } from "@/lib/recorder-utils";
import { WaveformViz } from "@/components/recorder/waveform-viz";
import type { UseRecorder } from "@/hooks/use-recorder";
import type { UseAnnotations } from "@/hooks/use-annotations";
import type { Lang } from "@/lib/i18n";

type Props = {
  rec: UseRecorder;
  lang: Lang;
  t: (key: string) => string;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  annotations?: UseAnnotations;
};

export function LivePreview({ rec, lang, t, canvasRef, annotations }: Props) {
  const directVideoRef = useRef<HTMLVideoElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [textInput, setTextInput] = useState<{ x: number; y: number; value: string } | null>(null);
  // Local CSS position for the draggable idle overlay (px relative to wrapper)
  const [overlayStyle, setOverlayStyle] = useState<{ left: number; top: number } | null>(null);
  // Track wrapper dimensions for overlay sizing (avoid reading refs during render)
  const [wrapperSize, setWrapperSize] = useState({ width: 1280, height: 720 });
  // Track canvas dimensions for annotation coordinate mapping
  const [canvasSize, setCanvasSize] = useState({ width: 1280, height: 720 });

  // Observe wrapper size so the overlay scales responsively
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setWrapperSize({ width: r.width, height: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Track canvas dimensions for annotation coordinate mapping
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const update = () => {
      if (el.width > 0 && el.height > 0) {
        setCanvasSize({ width: el.width, height: el.height });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [canvasRef]);

  // Attach screen stream to direct-mode video element
  useEffect(() => {
    const v = directVideoRef.current;
    if (!v) return;
    if (rec.previewMode === "direct" && rec.screenStream) {
      if (v.srcObject !== rec.screenStream) {
        v.srcObject = rec.screenStream;
        void v.play().catch(() => {});
      }
    } else {
      v.srcObject = null;
    }
  }, [rec.previewMode, rec.screenStream]);

  const showCanvas = rec.previewMode === "composite" || rec.previewMode === "webcam-idle";
  const showDirect = rec.previewMode === "direct";
  const isEmpty = rec.previewMode === "empty";
  const showIdleOverlay = rec.previewMode === "webcam-idle" && rec.webcamStream;

  // Position the idle draggable overlay based on the preset when no free pos is set.
  useEffect(() => {
    if (!showIdleOverlay) {
      setOverlayStyle(null);
      return;
    }
    if (rec.freePos) return; // free pos drives it via drag handlers
    const { width: ww, height: wh } = wrapperSize;
    const sizePct = rec.settings.webcamSize;
    const w = Math.round((Math.min(ww, wh) * sizePct) / 100);
    const margin = rec.settings.webcamMargin;
    const pos = rec.settings.webcamPosition;
    const rtl = lang === "ar";
    const leftMap: Record<string, string> = {
      "top-left": rtl ? "right" : "left",
      "top-right": rtl ? "left" : "right",
      "bottom-left": rtl ? "right" : "left",
      "bottom-right": rtl ? "left" : "right",
    };
    const side = leftMap[pos] || "right";
    const isTop = pos.startsWith("top");
    const left = side === "left" ? margin : ww - w - margin;
    const top = isTop ? margin : wh - (w * 0.75) - margin;
    setOverlayStyle({ left, top });
  }, [showIdleOverlay, rec.freePos, rec.settings.webcamPosition, rec.settings.webcamSize, rec.settings.webcamMargin, lang, wrapperSize]);

  // Pointer drag handlers for the idle webcam overlay
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!showIdleOverlay) return;
      const overlay = overlayRef.current;
      const wrapper = wrapperRef.current;
      if (!overlay || !wrapper) return;
      e.preventDefault();
      setDragging(true);
      overlay.setPointerCapture(e.pointerId);
      const startX = e.clientX;
      const startY = e.clientY;
      const rect = overlay.getBoundingClientRect();
      const startLeft = rect.left - wrapper.getBoundingClientRect().left;
      const startTop = rect.top - wrapper.getBoundingClientRect().top;
      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        const wrapperRect = wrapper.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        const left = Math.max(0, Math.min(wrapperRect.width - w, startLeft + dx));
        const top = Math.max(0, Math.min(wrapperRect.height - h, startTop + dy));
        setOverlayStyle({ left, top });
        // Normalize to 0..1 for the hook
        const maxX = Math.max(1, wrapperRect.width - w);
        const maxY = Math.max(1, wrapperRect.height - h);
        rec.setWebcamFreePos({ x: left / maxX, y: top / maxY });
      };
      const onUp = () => {
        setDragging(false);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [showIdleOverlay, rec],
  );

  const goFullscreen = () => {
    const el = wrapperRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void el.requestFullscreen?.();
    }
  };

  const statusBadge = () => {
    if (rec.status === "countdown") return null;
    if (rec.isRecording)
      return (
        <Badge className="gap-1.5 border-transparent bg-red-600 text-white">
          <span className="rec-dot size-1.5 rounded-full bg-white" />
          {t("recording")}
        </Badge>
      );
    if (rec.isPaused)
      return (
        <Badge variant="secondary" className="gap-1.5">
          <Pause className="size-3" />
          {t("paused")}
        </Badge>
      );
    if (rec.previewMode === "webcam-idle")
      return (
        <Badge variant="outline" className="gap-1.5">
          <Radio className="size-3 text-primary" />
          {t("preview")}
        </Badge>
      );
    return (
      <Badge variant="outline" className="gap-1.5">
        {t("ready")}
      </Badge>
    );
  };

  const pipSupported = typeof document !== "undefined" && "pictureInPictureEnabled" in document;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold leading-tight">{t("livePreviewTitle")}</h2>
          <p className="text-xs text-muted-foreground">{t("livePreviewDesc")}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {statusBadge()}
          {(rec.isRecording || rec.isPaused) && annotations && (
            <Button
              variant="ghost"
              size="icon"
              className={cn("size-8", annotations.settings.enabled && "bg-primary/10 text-primary")}
              onClick={() => annotations.updateSettings("enabled", !annotations.settings.enabled)}
              aria-label={annotations.settings.enabled ? t("annotationDisabled") : t("annotationEnabled")}
              title={annotations.settings.enabled ? t("annotationDisabled") : t("annotationEnabled")}
            >
              <PenLine className="size-4" />
            </Button>
          )}
          {(rec.isRecording || rec.isPaused) && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={rec.captureSnapshot}
              aria-label={t("captureSnapshot")}
              title={t("captureSnapshot")}
            >
              <Camera className="size-4" />
            </Button>
          )}
          {(rec.isRecording || rec.isPaused) && (
            <Button
              variant="ghost"
              size="icon"
              className={cn("size-8", rec.clipRecording && "bg-amber-500/15 text-amber-500")}
              onClick={rec.captureClip}
              disabled={rec.clipRecording}
              aria-label={t("captureClip")}
              title={t("captureClip")}
            >
              {rec.clipRecording ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Clapperboard className="size-4" />
              )}
            </Button>
          )}
          {(rec.isRecording || rec.isPaused) && pipSupported && (
            <Button
              variant="ghost"
              size="icon"
              className={cn("size-8", rec.pipActive && "bg-primary/10 text-primary")}
              onClick={() => void rec.togglePiP()}
              aria-label={t("pictureInPicture")}
              title={t("pictureInPicture")}
            >
              <PictureInPicture2 className="size-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-8", rec.showProfiling && "bg-primary/10 text-primary")}
            onClick={() => rec.setShowProfiling(!rec.showProfiling)}
            aria-label={rec.showProfiling ? t("profHide") : t("profShow")}
            title={rec.showProfiling ? t("profHide") : t("profShow")}
          >
            <Activity className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={goFullscreen}
            aria-label={t("fullscreen")}
            disabled={isEmpty}
          >
            <Maximize2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Preview stage */}
      <div
        ref={wrapperRef}
        role="region"
        aria-label={t("ariaPreview")}
        onPointerDown={(e) => {
          if (!annotations?.settings.enabled || !rec.isRecording) return;
          if (annotations.settings.tool === "text") return; // text handled via click
          const rect = wrapperRef.current?.getBoundingClientRect();
          if (!rect) return;
          const canvas = canvasRef.current;
          if (!canvas) return;
          const scaleX = canvas.width / rect.width;
          const scaleY = canvas.height / rect.height;
          annotations.beginStroke((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
        }}
        onPointerMove={(e) => {
          if (!annotations?.settings.enabled || !rec.isRecording) return;
          if (annotations.settings.tool === "text") return;
          if (!annotations.activeStroke) return;
          const rect = wrapperRef.current?.getBoundingClientRect();
          if (!rect) return;
          const canvas = canvasRef.current;
          if (!canvas) return;
          const scaleX = canvas.width / rect.width;
          const scaleY = canvas.height / rect.height;
          annotations.moveStroke((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
        }}
        onPointerUp={() => {
          if (!annotations?.settings.enabled || !rec.isRecording) return;
          annotations.endStroke();
        }}
        onPointerLeave={() => {
          if (!annotations?.settings.enabled || !rec.isRecording) return;
          annotations.endStroke();
        }}
        onClick={(e) => {
          if (!annotations?.settings.enabled || !rec.isRecording) return;
          if (annotations.settings.tool !== "text") return;
          const rect = wrapperRef.current?.getBoundingClientRect();
          if (!rect) return;
          const canvas = canvasRef.current;
          if (!canvas) return;
          const scaleX = canvas.width / rect.width;
          const scaleY = canvas.height / rect.height;
          const x = (e.clientX - rect.left) * scaleX;
          const y = (e.clientY - rect.top) * scaleY;
          setTextInput({ x, y, value: "" });
        }}
        className={cn(
          "preview-inset relative aspect-video w-full overflow-hidden rounded-2xl border bg-[#0b0f10] transition-shadow",
          rec.isRecording ? "border-red-500/50 rec-glow" : "border-border/60",
          annotations?.settings.enabled && rec.isRecording && "cursor-crosshair",
        )}
      >
        {/* Empty state — recessed viewport with wireframe monitor */}
        {isEmpty && <div className="dot-grid absolute inset-0 opacity-25" />}
        {isEmpty && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <div className="max-w-sm">
              <div className="relative mx-auto mb-4 grid size-16 place-items-center">
                <div className="absolute inset-0 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent" />
                <div className="absolute inset-2 rounded-xl border border-white/[0.06]" />
                <Monitor className="relative size-7 text-muted-foreground/80" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">{t("previewEmpty")}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground/60">
                {lang === "ar"
                  ? "فعّل الكاميرا لمعاينة الطبقة العلوية، أو اضغط ابدأ التسجيل."
                  : "Enable the webcam to preview the overlay, or press Start Recording."}
              </p>
            </div>
          </div>
        )}

        {/* Canvas (always mounted; visible when compositing or showing webcam preview) */}
        <canvas
          ref={canvasRef}
          className={cn(
            "absolute inset-0 size-full object-contain",
            !showCanvas && "hidden",
          )}
          aria-label={t("livePreviewTitle")}
        />

        {/* Direct screen video */}
        {showDirect && (
          <video
            ref={directVideoRef}
            className="absolute inset-0 size-full object-contain"
            muted
            playsInline
            aria-label={t("screen")}
          />
        )}

        {/* Draggable idle webcam overlay (CSS-positioned, separate from canvas) */}
        {showIdleOverlay && rec.webcamStream && overlayStyle && (
          <div
            ref={overlayRef}
            onPointerDown={onPointerDown}
            className={cn(
              "webcam-draggable group absolute z-20 touch-none select-none",
              dragging && "cursor-grabbing",
            )}
            style={{
              left: overlayStyle.left,
              top: overlayStyle.top,
              width: `${(rec.settings.webcamSize * Math.min(wrapperSize.width, wrapperSize.height)) / 100}px`,
            }}
          >
            <IdleWebcamVideo
              stream={rec.webcamStream}
              shape={rec.settings.webcamShape}
              shadow={rec.settings.webcamShadow}
            />
            {/* Drag handle hint */}
            <div
              className={cn(
                "absolute inset-x-0 top-0 flex justify-center transition-opacity",
                rec.settings.webcamShape === "circle" ? "rounded-full" : "rounded-t-xl",
                dragging ? "opacity-100" : "opacity-0 group-hover:opacity-100",
              )}
            >
              <div className="flex items-center gap-1 rounded-b-md bg-black/60 px-2 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
                <GripVertical className="size-2.5" />
                {t("dragToMove")}
              </div>
            </div>
          </div>
        )}

        {/* Countdown overlay */}
        {rec.status === "countdown" && rec.countdownValue != null && (
          <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-sm">
            <div className="text-center">
              <Loader2 className="mx-auto mb-3 size-6 animate-spin text-primary" />
              <div className="text-6xl font-bold tabular-nums text-primary">
                {Math.max(0, rec.countdownValue)}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{t("startRecording")}…</div>
            </div>
          </div>
        )}

        {/* Source chips */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
          {rec.settings.webcamEnabled && <Chip icon={Webcam} label={t("camOn")} tone="emerald" />}
          {rec.settings.micEnabled && <Chip icon={Mic} label={t("micOn")} tone="emerald" />}
          {rec.settings.systemAudioEnabled && (
            <Chip icon={Volume2} label={t("audioOn")} tone="amber" />
          )}
          <Chip icon={Monitor} label={t("screenOn")} tone="emerald" />
        </div>

        {/* Live stats overlay (during recording) */}
        {(rec.isRecording || rec.isPaused) && (
          <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1.5 rounded-lg bg-black/55 px-2.5 py-1.5 backdrop-blur-sm">
            <Stat icon={Timer} label={t("statElapsed")} value={formatDuration(rec.liveStats.elapsed)} />
            <span className="h-3 w-px bg-white/15" />
            <Stat icon={HardDrive} label={t("statSize")} value={formatBytes(rec.liveStats.estimatedBytes)} />
            <span className="h-3 w-px bg-white/15" />
            <Stat
              icon={Gauge}
              label={t("statFps")}
              value={rec.actualFps > 0 ? `${rec.actualFps}` : `${rec.liveStats.fps}`}
            />
            {rec.fpsDowngraded && (
              <span className="flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300">
                <TrendingDown className="size-2.5" />
                {rec.effectiveFps}
              </span>
            )}
          </div>
        )}

        {/* Mic level meter */}
        {rec.isRecording && rec.settings.micEnabled && (
          <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-black/50 px-2.5 py-1.5 backdrop-blur-sm">
            <Mic className="size-3.5 text-white/80" />
            <div className="flex h-3 items-end gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => {
                const threshold = (i + 1) / 5;
                const active = rec.micLevel >= threshold * 0.6;
                return (
                  <span
                    key={i}
                    className={cn(
                      "w-1 rounded-full transition-all",
                      active ? "bg-emerald-400" : "bg-white/20",
                    )}
                    style={{ height: `${6 + i * 3}px` }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Text annotation input overlay */}
        {textInput && annotations?.settings.enabled && (
          <div
            className="absolute z-30"
            style={{
              left: `${(textInput.x / canvasSize.width) * 100}%`,
              top: `${(textInput.y / canvasSize.height) * 100}%`,
            }}
          >
            <input
              autoFocus
              value={textInput.value}
              onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  annotations.commitText(textInput.value);
                  setTextInput(null);
                } else if (e.key === "Escape") {
                  annotations.cancelText();
                  setTextInput(null);
                }
              }}
              onBlur={() => {
                annotations.commitText(textInput.value);
                setTextInput(null);
              }}
              placeholder={t("typeHere")}
              className="w-40 rounded border border-primary bg-black/80 px-1.5 py-0.5 text-xs text-white outline-none backdrop-blur-sm"
              style={{ color: annotations.settings.color }}
            />
          </div>
        )}
      </div>

      {/* Hint line + FPS downgrade notice */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {rec.previewMode === "composite"
            ? t("compositeHint")
            : rec.previewMode === "direct"
              ? t("directHint")
              : rec.previewMode === "webcam-idle"
                ? t("previewWebcamHint")
                : t("previewEmpty")}
        </p>
        {rec.fpsDowngraded && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
            <TrendingDown className="size-3" />
            {t("fpsDowngraded")}
          </span>
        )}
      </div>

      {/* Waveform (during recording with mic) */}
      {(rec.isRecording || rec.isPaused) && rec.settings.micEnabled && (
        <WaveformViz
          waveform={rec.waveform}
          active={rec.isRecording}
          lang={lang}
          t={t}
        />
      )}
    </div>
  );
}

function Chip({
  icon: Icon,
  label,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  tone: "emerald" | "amber";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm",
        tone === "emerald"
          ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30"
          : "bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/30",
      )}
    >
      <Icon className="size-2.5" />
      {label}
    </span>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1 text-white/90" dir="ltr">
      <Icon className="size-3 text-white/60" />
      <span className="font-mono text-[10px] font-semibold tabular-nums">{value}</span>
    </div>
  );
}

/** Webcam video that binds a MediaStream via ref (srcObject is not a React prop). */
function IdleWebcamVideo({
  stream,
  shape,
  shadow,
}: {
  stream: MediaStream;
  shape: "rounded" | "circle";
  shadow: boolean;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (v.srcObject !== stream) {
      v.srcObject = stream;
      void v.play().catch(() => {});
    }
  }, [stream]);
  return (
    <video
      ref={ref}
      autoPlay
      muted
      playsInline
      className={cn(
        "block h-auto w-full bg-black object-cover ring-2 ring-white/80 transition-shadow",
        shape === "circle" ? "rounded-full" : "rounded-xl",
        shadow && "shadow-lg shadow-black/50",
      )}
    />
  );
}
