"use client";

import { Gauge, Film, AudioWaveform, Clock, HardDrive, Maximize2, FileVideo } from "lucide-react";
import { formatBytes, formatDuration } from "@/lib/recorder-utils";
import type { UseRecorder } from "@/hooks/use-recorder";
import type { Lang } from "@/lib/i18n";

type Props = {
  rec: UseRecorder;
  lang: Lang;
  t: (key: string) => string;
};

export function StatsSummary({ rec, lang, t }: Props) {
  const s = rec.recordingStats;
  if (!s) return null;

  const stats = [
    { icon: Gauge, label: t("statAvgFps"), value: `${s.avgFps}`, accent: "emerald" },
    { icon: Film, label: t("statTotalFrames"), value: s.totalFrames.toLocaleString(), accent: "blue" },
    {
      icon: AudioWaveform,
      label: t("statPeakAudio"),
      value: `${Math.round(s.peakAudio * 100)}%`,
      accent: "amber",
    },
    { icon: Clock, label: t("statDuration"), value: formatDuration(s.duration), accent: "emerald" },
    { icon: HardDrive, label: t("statFileSize"), value: formatBytes(s.fileSize), accent: "blue" },
    { icon: Maximize2, label: t("statResolution"), value: `${s.width}×${s.height}`, accent: "emerald" },
    { icon: FileVideo, label: t("statCodec"), value: s.codec, accent: "amber" },
  ];

  const accentClass = (a: string) =>
    a === "emerald"
      ? "bg-emerald-500/10 text-emerald-500"
      : a === "blue"
        ? "bg-sky-500/10 text-sky-500"
        : "bg-amber-500/10 text-amber-500";

  return (
    <div className="fade-up rounded-2xl border border-border/60 bg-card/40 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
          <Gauge className="size-4" />
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight">{t("statsSummary")}</div>
          <div className="text-[11px] text-muted-foreground">{t("statsSummaryDesc")}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/50 bg-muted/30 p-2.5 transition-colors hover:bg-accent/30"
          >
            <div className="flex items-center gap-1.5">
              <div className={cnAccent(stat.accent, accentClass)}>
                <stat.icon className="size-3" />
              </div>
              <span className="text-[10px] text-muted-foreground">{stat.label}</span>
            </div>
            <div className="mt-1 truncate font-mono text-sm font-bold tabular-nums">
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// helper to apply the accent class
function cnAccent(accent: string, fn: (a: string) => string) {
  return `grid size-5 place-items-center rounded ${fn(accent)}`;
}
