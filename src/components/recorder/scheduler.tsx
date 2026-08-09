"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, Timer, Play, X, AlarmClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/recorder-utils";
import type { Lang } from "@/lib/i18n";

type Props = {
  lang: Lang;
  t: (key: string) => string;
  isRecording: boolean;
  isPaused: boolean;
  canStart: boolean;
  onStartNow: () => void;
  onStop: () => void;
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  onAutoStopChange: (ms: number) => void;
  elapsed: number;
};

export function Scheduler({
  lang,
  t,
  isRecording,
  isPaused,
  canStart,
  onStartNow,
  onStop,
  enabled,
  onEnabledChange,
  onAutoStopChange,
  elapsed,
}: Props) {
  const [startAt, setStartAt] = useState<string>("");
  const [maxDuration, setMaxDuration] = useState(0); // 0 = unlimited (minutes)
  const [scheduled, setScheduled] = useState(false);
  const [countdown, setCountdown] = useState<string>("");

  // Countdown display
  useEffect(() => {
    if (!scheduled || !startAt) return;
    const update = () => {
      const target = new Date(startAt).getTime();
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setCountdown("");
        setScheduled(false);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [scheduled, startAt]);

  // Auto-start when countdown reaches zero
  useEffect(() => {
    if (!scheduled || !startAt || isRecording) return;
    const target = new Date(startAt).getTime();
    if (Date.now() >= target && canStart) {
      onStartNow();
      setScheduled(false);
    }
  }, [scheduled, startAt, isRecording, canStart, onStartNow]);

  const handleSchedule = () => {
    if (!startAt) return;
    setScheduled(true);
  };

  const handleCancel = () => {
    setScheduled(false);
    setCountdown("");
  };

  // Generate a datetime-local default (now + 5 min)
  const defaultTime = (() => {
    const d = new Date(Date.now() + 5 * 60000);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  })();

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
            <AlarmClock className="size-4" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">{t("schedulerTitle")}</div>
            <div className="text-[11px] text-muted-foreground">{t("schedulerDesc")}</div>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onEnabledChange}
          disabled={isRecording || isPaused}
          aria-label={t("schedulerEnabled")}
        />
      </div>

      {enabled && (
        <div className="flex flex-col gap-3">
          {/* Scheduled start */}
          <div className="rounded-xl border border-border/50 bg-muted/30 p-3">
            <Label className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="size-3" />
              {t("schedulerStartAt")}
            </Label>
            {scheduled ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5">
                    <Clock className="size-3.5 text-primary" />
                    <span className="font-mono text-sm font-bold tabular-nums text-primary">
                      {countdown}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{t("schedulerStartsIn")}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={handleCancel}
                >
                  <X className="size-3" />
                  {t("schedulerCancel")}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="datetime-local"
                  value={startAt || defaultTime}
                  onChange={(e) => setStartAt(e.target.value)}
                  className="h-8 flex-1 text-xs"
                  disabled={isRecording || isPaused}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={handleSchedule}
                  disabled={isRecording || isPaused}
                >
                  <Calendar className="size-3" />
                  {lang === "ar" ? "جدول" : "Schedule"}
                </Button>
              </div>
            )}
          </div>

          {/* Max duration */}
          <div className="rounded-xl border border-border/50 bg-muted/30 p-3">
            <div className="mb-2 flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Timer className="size-3" />
                {t("schedulerDuration")}
              </Label>
              <span className="font-mono text-xs font-medium tabular-nums text-muted-foreground">
                {maxDuration > 0 ? `${maxDuration} ${t("schedulerMinutes")}` : t("schedulerDurationUnlimited")}
              </span>
            </div>
            <Slider
              value={[maxDuration]}
              min={0}
              max={60}
              step={1}
              onValueChange={(v) => {
                setMaxDuration(v[0]);
                onAutoStopChange(v[0] * 60000);
              }}
              disabled={isRecording || isPaused}
            />
            {maxDuration > 0 && (
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                {t("schedulerAutoStop")} · {maxDuration} {t("schedulerMinutes")}
              </p>
            )}
            {/* Round 9: auto-stop live indicator */}
            {maxDuration > 0 && isRecording && (
              <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2 py-1">
                <Timer className="size-3 text-amber-500" />
                <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                  {t("autoStopIn")} {formatDuration(Math.max(0, maxDuration * 60 - elapsed))}
                </span>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={onStartNow}
              disabled={!canStart}
            >
              <Play className="size-3.5" />
              {t("schedulerNow")}
            </Button>
            {(isRecording || isPaused) && (
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                onClick={onStop}
              >
                <X className="size-3.5" />
                {t("stop")}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
