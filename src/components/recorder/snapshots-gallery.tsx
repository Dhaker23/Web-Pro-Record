"use client";

import { Camera, Download, Trash2, Images, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/recorder-utils";
import type { UseRecorder } from "@/hooks/use-recorder";
import type { Lang } from "@/lib/i18n";

type Props = {
  rec: UseRecorder;
  lang: Lang;
  t: (key: string) => string;
};

export function SnapshotsGallery({ rec, lang, t }: Props) {
  const snaps = rec.snapshots;

  if (snaps.length === 0 && !rec.isRecording && !rec.isPaused) return null;

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
            <Images className="size-4" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">{t("snapshotTitle")}</div>
            <div className="text-[11px] text-muted-foreground">{t("snapshotDesc")}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            {snaps.length} {t("snapshotsCount")}
          </Badge>
          {(rec.isRecording || rec.isPaused) && (
            <Button
              variant="outline"
              size="sm"
              onClick={rec.captureSnapshot}
              className="gap-1.5"
            >
              <Camera className="size-3.5" />
              <span className="hidden sm:inline">{t("captureSnapshot")}</span>
            </Button>
          )}
          {snaps.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-destructive"
              onClick={rec.clearSnapshots}
              aria-label={t("clearSnapshots")}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      {snaps.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/50 py-8 text-center">
          <Camera className="size-5 text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground">{t("snapshotEmpty")}</p>
        </div>
      ) : (
        <div className="scroll-thin flex gap-3 overflow-x-auto pb-2">
          {snaps.map((snap) => (
            <div
              key={snap.id}
              className="group relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-black"
            >
              <img
                src={snap.dataUrl}
                alt={t("snapshot")}
                className="size-full object-cover transition-transform group-hover:scale-105"
              />
              {/* Overlay actions */}
              <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/70 via-transparent to-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => rec.removeSnapshot(snap.id)}
                  className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-md bg-black/60 text-white/90 transition-colors hover:bg-red-600"
                  aria-label={t("clearSnapshots")}
                >
                  <X className="size-3" />
                </button>
                <div className="flex items-center justify-between p-2">
                  <span className="rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9px] font-medium text-white backdrop-blur-sm">
                    {formatDuration(snap.elapsed)}
                  </span>
                  <button
                    type="button"
                    onClick={() => rec.downloadSnapshot(snap)}
                    className="grid size-6 place-items-center rounded-md bg-black/60 text-white/90 transition-colors hover:bg-primary"
                    aria-label={t("downloadSnapshot")}
                  >
                    <Download className="size-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
