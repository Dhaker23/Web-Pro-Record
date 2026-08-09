"use client";

import { Activity, Cpu, MemoryStick, Monitor, AudioLines, Film, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UseRecorder } from "@/hooks/use-recorder";
import type { Lang } from "@/lib/i18n";

type Props = {
  rec: UseRecorder;
  lang: Lang;
  t: (key: string) => string;
};

export function ProfilingPanel({ rec, lang, t }: Props) {
  const p = rec.profiling;

  if (!rec.showProfiling) return null;

  return (
    <div className="fade-up rounded-2xl border border-border/60 bg-card/40 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
            <Activity className="size-4" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">{t("profilingTitle")}</div>
            <div className="text-[11px] text-muted-foreground">{t("profilingDesc")}</div>
          </div>
        </div>
        <span
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
            rec.isRecording
              ? "bg-emerald-500/15 text-emerald-500"
              : "bg-muted text-muted-foreground",
          )}
        >
          <span className={cn("size-1.5 rounded-full", rec.isRecording ? "bg-emerald-500 rec-dot" : "bg-muted-foreground/40")} />
          {rec.isRecording ? t("profLive") : t("profClosed")}
        </span>
      </div>

      {!p || !rec.isRecording ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/50 py-6 text-center">
          <Activity className="size-5 text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground">{t("profilingEmpty")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric icon={Gauge} label={t("profRenderTime")} value={`${p.renderTime}`} unit={t("profMs")} accent="emerald" />
          <Metric icon={MemoryStick} label={t("profMemory")} value={p.memoryUsed > 0 ? `${p.memoryUsed}` : "—"} unit={p.memoryUsed > 0 ? t("profMb") : ""} accent="blue" />
          <Metric icon={Monitor} label={t("profCanvasSize")} value={`${p.canvasWidth}×${p.canvasHeight}`} unit="" accent="emerald" />
          <Metric icon={Film} label={t("profStreamTracks")} value={`${p.streamTrackCount}`} unit="" accent="amber" />
          <Metric icon={Cpu} label={t("profVideoTrack")} value={stateLabel(p.videoTrackState, t)} unit="" accent="emerald" />
          <Metric icon={AudioLines} label={t("profAudioTrack")} value={stateLabel(p.audioTrackState, t)} unit="" accent="amber" />
          <Metric icon={Activity} label={t("profAudioContext")} value={audioStateLabel(p.audioContextState, t)} unit="" accent="blue" />
        </div>
      )}
    </div>
  );
}

function stateLabel(state: string, t: (k: string) => string): string {
  if (state === "live") return t("profLive");
  if (state === "ended") return t("profEnded");
  return state || "—";
}

function audioStateLabel(state: string, t: (k: string) => string): string {
  if (state === "running") return t("profRunning");
  if (state === "closed") return t("profClosed");
  if (state === "suspended") return t("profClosed");
  return state || "—";
}

function Metric({
  icon: Icon,
  label,
  value,
  unit,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
  accent: "emerald" | "blue" | "amber";
}) {
  const accentClass =
    accent === "emerald"
      ? "bg-emerald-500/10 text-emerald-500"
      : accent === "blue"
        ? "bg-sky-500/10 text-sky-500"
        : "bg-amber-500/10 text-amber-500";
  return (
    <div className="rounded-xl border border-border/50 bg-muted/30 p-2.5">
      <div className="flex items-center gap-1.5">
        <div className={cn("grid size-5 place-items-center rounded", accentClass)}>
          <Icon className="size-3" />
        </div>
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-mono text-sm font-bold tabular-nums">{value}</span>
        {unit && <span className="text-[10px] text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}
