"use client";

import { useRef, useState } from "react";
import {
  Download,
  RotateCcw,
  Trash2,
  Film,
  Clock,
  FileVideo,
  HardDrive,
  Maximize,
  Copy,
  Check,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecordingTimeline } from "@/components/recorder/recording-timeline";
import type { UseRecorder } from "@/hooks/use-recorder";
import type { Lang } from "@/lib/i18n";

type Props = {
  rec: UseRecorder;
  lang: Lang;
  t: (key: string) => string;
};

export function FinalRecording({ rec, lang, t }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [copied, setCopied] = useState(false);
  const r = rec.result;

  if (!r) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 border-dashed border-border/60 bg-card/40 p-8 text-center">
        <div className="grid size-12 place-items-center rounded-2xl border border-border/60 bg-muted/40">
          <Film className="size-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">{t("finalEmpty")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {lang === "ar"
              ? "سيظهر الفيديو النهائي هنا بعد إيقاف التسجيل."
              : "Your final video will appear here after you stop recording."}
          </p>
        </div>
      </Card>
    );
  }

  const details = [
    {
      icon: Clock,
      label: t("finalDuration"),
      value: rec.formatDuration(r.duration),
    },
    {
      icon: FileVideo,
      label: t("finalMime"),
      value: rec.mimeToLabel(r.mimeType),
    },
    {
      icon: HardDrive,
      label: t("finalSize"),
      value: rec.formatBytes(r.size),
    },
    {
      icon: Maximize,
      label: t("finalResolution"),
      value: `${r.width} × ${r.height}`,
    },
  ];

  const goFullscreen = () => {
    const v = videoRef.current;
    if (!v) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void v.requestFullscreen?.();
  };

  const handleCopy = async () => {
    const ok = await rec.copyTechnicalDetails();
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="fade-up overflow-hidden border-border/60 p-0 shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border/50 bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="grid size-7 place-items-center rounded-lg bg-emerald-500/15 text-emerald-500">
            <PlayCircle className="size-4" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">{t("finalTitle")}</div>
            <div className="text-[11px] text-muted-foreground">{t("finalDesc")}</div>
          </div>
        </div>
        <Badge className="gap-1.5 border-transparent bg-emerald-600 text-white">
          <Check className="size-3" />
          {t("previewReady")}
        </Badge>
      </div>

      <div className="p-4">
        <div className="relative overflow-hidden rounded-xl border border-border/50 bg-black">
          <video
            ref={videoRef}
            data-recording-player="true"
            src={r.url}
            controls
            playsInline
            className="aspect-video w-full bg-black"
          />
          <Button
            variant="secondary"
            size="icon"
            onClick={goFullscreen}
            className="absolute right-2 top-2 size-8 bg-black/50 text-white hover:bg-black/70"
            aria-label={t("fullscreen")}
          >
            <Maximize className="size-4" />
          </Button>
        </div>

        {/* Timeline with snapshot markers */}
        {rec.snapshots.length > 0 && (
          <div className="mt-4">
            <RecordingTimeline rec={rec} lang={lang} t={t} />
          </div>
        )}

        {/* Details */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {details.map((d) => (
            <div
              key={d.label}
              className="rounded-xl border border-border/50 bg-muted/30 p-3"
            >
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <d.icon className="size-3" />
                {d.label}
              </div>
              <div className="mt-1 truncate text-sm font-semibold">{d.value}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button onClick={rec.downloadVideo} className="gap-2 bg-emerald-600 text-white hover:bg-emerald-600/90" size="lg">
            <Download className="size-4" />
            {t("downloadVideo")}
          </Button>
          <Button onClick={rec.recordAgain} variant="outline" className="gap-2" size="lg">
            <RotateCcw className="size-4" />
            {t("recordAgain")}
          </Button>
          <Button onClick={handleCopy} variant="ghost" className="gap-2" size="lg">
            {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
            {copied ? t("copied") : t("copyDetails")}
          </Button>
          <Button
            onClick={rec.resetAll}
            variant="ghost"
            className="gap-2 text-muted-foreground hover:text-destructive"
            size="lg"
          >
            <Trash2 className="size-4" />
            {t("reset")}
          </Button>
        </div>
      </div>
    </Card>
  );
}
