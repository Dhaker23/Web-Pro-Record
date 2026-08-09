"use client";

import { Film, Download, Trash2, Clapperboard, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatBytes, formatDuration } from "@/lib/recorder-utils";
import type { UseRecorder } from "@/hooks/use-recorder";
import type { Lang } from "@/lib/i18n";

type Props = {
  rec: UseRecorder;
  lang: Lang;
  t: (key: string) => string;
};

export function ClipsGallery({ rec, lang, t }: Props) {
  const clips = rec.clips;

  if (clips.length === 0 && !rec.isRecording && !rec.isPaused) return null;

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
            <Clapperboard className="size-4" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">{t("clipsTitle")}</div>
            <div className="text-[11px] text-muted-foreground">{t("clipsDesc")}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            {clips.length} {t("clipsCount")}
          </Badge>
          {(rec.isRecording || rec.isPaused) && (
            <Button
              variant="outline"
              size="sm"
              onClick={rec.captureClip}
              disabled={rec.clipRecording}
              className="gap-1.5"
            >
              {rec.clipRecording ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Film className="size-3.5" />
              )}
              <span className="hidden sm:inline">
                {rec.clipRecording ? t("clipRecording") : t("captureClip")}
              </span>
            </Button>
          )}
          {clips.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-destructive"
              onClick={rec.clearClips}
              aria-label={t("clearClips")}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      {clips.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/50 py-8 text-center">
          <Film className="size-5 text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground">{t("clipsEmpty")}</p>
        </div>
      ) : (
        <div className="scroll-thin flex gap-3 overflow-x-auto pb-2">
          {clips.map((clip) => (
            <div
              key={clip.id}
              className="group relative aspect-video w-48 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-black"
            >
              <video
                src={clip.url}
                controls
                playsInline
                className="size-full bg-black object-contain"
              />
              {/* Overlay actions */}
              <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9px] font-medium text-white backdrop-blur-sm">
                  {formatDuration(clip.elapsed)}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => rec.downloadClip(clip)}
                    className="grid size-6 place-items-center rounded-md bg-black/60 text-white/90 transition-colors hover:bg-primary"
                    aria-label={t("downloadClip")}
                  >
                    <Download className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => rec.removeClip(clip.id)}
                    className="grid size-6 place-items-center rounded-md bg-black/60 text-white/90 transition-colors hover:bg-red-600"
                    aria-label={t("clearClips")}
                  >
                    <X className="size-3" />
                  </button>
                </div>
              </div>
              {/* Size badge */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                <span className="rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9px] text-white backdrop-blur-sm">
                  {formatBytes(clip.size)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
