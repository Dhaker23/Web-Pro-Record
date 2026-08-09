"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, MapPin } from "lucide-react";
import type { UseRecorder } from "@/hooks/use-recorder";
import type { Lang } from "@/lib/i18n";
import { formatDuration } from "@/lib/recorder-utils";

type Props = {
  rec: UseRecorder;
  lang: Lang;
  t: (key: string) => string;
};

/** A recording timeline with snapshot markers. Clicking a marker seeks the player. */
export function RecordingTimeline({ rec, lang, t }: Props) {
  const barRef = useRef<HTMLDivElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);

  // Listen to the final video element to drive the playhead + duration.
  useEffect(() => {
    // CODE-003 FIX: Use a specific data attribute to target the final recording
    // player, not just any video[controls][src] (which could match a clip).
    const video = document.querySelector<HTMLVideoElement>("video[data-recording-player]");
    if (!video) return;
    const onMeta = () => setDuration(video.duration || 0);
    const onTime = () => setCurrent(video.currentTime || 0);
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("durationchange", onMeta);
    video.addEventListener("timeupdate", onTime);
    return () => {
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("durationchange", onMeta);
      video.removeEventListener("timeupdate", onTime);
    };
  }, [rec.result]);

  const snaps = rec.snapshots;
  const dur = duration || rec.result?.duration || 0;
  const progress = dur > 0 ? Math.min(100, (current / dur) * 100) : 0;

  const seekTo = (time: number) => {
    const video = document.querySelector<HTMLVideoElement>("video[data-recording-player]");
    if (video) {
      video.currentTime = time;
      void video.play().catch(() => {});
    }
  };

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dur <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    seekTo(pct * dur);
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock className="size-3.5 text-primary" />
          <span className="text-xs font-medium">{t("timeline")}</span>
        </div>
        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
          {formatDuration(current)} / {formatDuration(dur)}
        </span>
      </div>

      {/* Timeline bar */}
      <div
        ref={barRef}
        onClick={handleBarClick}
        className="relative h-8 cursor-pointer overflow-hidden rounded-md bg-muted/60"
        role="slider"
        aria-label={t("timeline")}
        aria-valuenow={Math.round(current)}
        aria-valuemax={Math.round(dur)}
        aria-valuemin={0}
        tabIndex={0}
      >
        {/* Progress fill */}
        <div
          className="absolute inset-y-0 left-0 bg-primary/20 transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
        {/* Playhead */}
        <div
          className="absolute inset-y-0 w-0.5 bg-primary"
          style={{ left: `${progress}%` }}
        />
        {/* Snapshot markers */}
        {snaps.map((snap) => {
          const left = dur > 0 ? Math.min(100, (snap.elapsed / dur) * 100) : 0;
          return (
            <button
              key={snap.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                seekTo(snap.elapsed);
              }}
              onMouseEnter={() => setHovered(snap.elapsed)}
              onMouseLeave={() => setHovered(null)}
              className="group absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${left}%` }}
              aria-label={`${t("snapshot")} ${formatDuration(snap.elapsed)}`}
            >
              <span className="block size-2.5 rotate-45 rounded-sm bg-amber-400 ring-2 ring-amber-400/30 transition-transform group-hover:scale-125" />
              {hovered === snap.elapsed && (
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 font-mono text-[9px] font-medium text-white">
                  {formatDuration(snap.elapsed)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend / hint */}
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="size-3 text-amber-400" />
          {snaps.length > 0
            ? `${snaps.length} ${t("snapshotsCount")}`
            : t("noSnapshotsOnTimeline")}
        </span>
        <span>{t("timelineHint")}</span>
      </div>
    </div>
  );
}
