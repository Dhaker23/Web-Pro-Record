"use client";

import { History, Download, Trash2, Play, RotateCcw, HardDrive, Film, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatBytes, formatDuration, mimeToLabel } from "@/lib/recorder-utils";
import { useToast } from "@/hooks/use-toast";
import type { UseRecorder } from "@/hooks/use-recorder";
import type { Lang } from "@/lib/i18n";

type Props = {
  rec: UseRecorder;
  lang: Lang;
  t: (key: string) => string;
};

export function HistoryPanel({ rec, lang, t }: Props) {
  const entries = rec.history;
  const { toast } = useToast();

  if (entries.length === 0) return null;

  return (
    <div className="fade-up rounded-2xl border border-border/60 bg-card/40 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
            <History className="size-4" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">{t("historyTitle")}</div>
            <div className="text-[11px] text-muted-foreground">{t("historyDesc")}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            {entries.length} {t("historyCount")}
          </Badge>
          {/* Round 9: manifest export */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={async () => {
                const ok = await rec.copyManifest();
                toast({ description: ok ? t("manifestCopied") : t("manifestEmpty") });
              }}
              disabled={entries.length === 0}
              title={t("manifestCopy")}
            >
              <Copy className="size-3" />
              <span className="hidden sm:inline">{t("manifestCopy")}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={rec.downloadManifest}
              disabled={entries.length === 0}
              title={t("manifestDownload")}
            >
              <Download className="size-3" />
              <span className="hidden sm:inline">{t("manifestDownload")}</span>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
            onClick={rec.clearHistory}
            aria-label={t("historyClear")}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="scroll-thin grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="group overflow-hidden rounded-xl border border-border/60 bg-card/60 transition-colors hover:border-primary/40"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-black">
              {entry.thumbnail ? (
                <img
                  src={entry.thumbnail}
                  alt={t("historyTitle")}
                  className="size-full object-cover"
                />
              ) : (
                <div className="grid size-full place-items-center">
                  <Film className="size-6 text-muted-foreground/40" />
                </div>
              )}
              {/* Duration badge */}
              <div className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[9px] font-medium text-white backdrop-blur-sm">
                {formatDuration(entry.duration)}
              </div>
              {/* Hover actions */}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => rec.restoreHistoryEntry(entry.id)}
                  className="grid size-8 place-items-center rounded-full bg-white/90 text-black transition-colors hover:bg-white"
                  aria-label={t("historyRestore")}
                  title={t("historyRestore")}
                >
                  <RotateCcw className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => rec.downloadHistoryEntry(entry)}
                  className="grid size-8 place-items-center rounded-full bg-white/90 text-black transition-colors hover:bg-white"
                  aria-label={t("historyDownload")}
                  title={t("historyDownload")}
                >
                  <Download className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => rec.removeHistoryEntry(entry.id)}
                  className="grid size-8 place-items-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-700"
                  aria-label={t("historyDelete")}
                  title={t("historyDelete")}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
            {/* Details */}
            <div className="p-2.5">
              <div className="flex items-center justify-between gap-1.5">
                <span className="truncate font-mono text-[10px] text-muted-foreground" title={entry.codec}>
                  {mimeToLabel(entry.mimeType)}
                </span>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <HardDrive className="size-2.5" />
                  {formatBytes(entry.size)}
                </span>
                <span className="flex items-center gap-1">
                  <Play className="size-2.5" />
                  {entry.width}×{entry.height}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
