"use client";

import { useEffect, useRef, type RefObject } from "react";
import {
  Monitor,
  Webcam,
  Mic,
  Volume2,
  Maximize2,
  Radio,
  Pause,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UseRecorder } from "@/hooks/use-recorder";
import type { Lang } from "@/lib/i18n";

type Props = {
  rec: UseRecorder;
  lang: Lang;
  t: (key: string) => string;
  canvasRef: RefObject<HTMLCanvasElement | null>;
};

export function LivePreview({ rec, lang, t, canvasRef }: Props) {
  const directVideoRef = useRef<HTMLVideoElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold leading-tight">{t("livePreviewTitle")}</h2>
          <p className="text-xs text-muted-foreground">{t("livePreviewDesc")}</p>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge()}
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
        className="preview-inset relative aspect-video w-full overflow-hidden rounded-2xl border border-border/60 bg-[#0b0f10]"
      >
        {/* Empty state — recessed viewport with wireframe monitor */}
        {isEmpty && (
          <div className="dot-grid absolute inset-0 opacity-25" />
        )}
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
          {rec.settings.webcamEnabled && (
            <Chip icon={Webcam} label={t("camOn")} tone="emerald" />
          )}
          {rec.settings.micEnabled && (
            <Chip icon={Mic} label={t("micOn")} tone="emerald" />
          )}
          {rec.settings.systemAudioEnabled && (
            <Chip icon={Volume2} label={t("audioOn")} tone="amber" />
          )}
          <Chip icon={Monitor} label={t("screenOn")} tone="emerald" />
        </div>

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
      </div>

      {/* Hint line */}
      <p className="text-xs text-muted-foreground">
        {rec.previewMode === "composite"
          ? t("compositeHint")
          : rec.previewMode === "direct"
            ? t("directHint")
            : rec.previewMode === "webcam-idle"
              ? t("previewWebcamHint")
              : t("previewEmpty")}
      </p>
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
