"use client";

import {
  Monitor,
  Webcam,
  Mic,
  Volume2,
  RefreshCw,
  Play,
  Pause,
  Square,
  RotateCcw,
  Circle,
  Clock,
  Film,
  Settings2,
  Sparkles,
  Info,
  Droplet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { mimeToLabel } from "@/lib/recorder-utils";
import { OverlayTemplates } from "@/components/recorder/overlay-templates";
import type { UseRecorder } from "@/hooks/use-recorder";
import type { Lang, OutputQuality as Q } from "@/lib/i18n";
import type { WebcamPosition, WebcamShape, FrameRate } from "@/lib/i18n";

type Props = {
  rec: UseRecorder;
  lang: Lang;
  t: (key: string) => string;
};

function SectionCard({
  title,
  desc,
  icon: Icon,
  children,
  t,
}: {
  title: string;
  desc?: string;
  icon: React.ElementType;
  children: React.ReactNode;
  t: (k: string) => string;
}) {
  return (
    <Card className="overflow-hidden border-border/60 p-0 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-2.5 border-b border-border/50 bg-muted/30 px-4 py-3">
        <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold leading-tight">{title}</div>
          {desc ? (
            <div className="truncate text-[11px] text-muted-foreground">{desc}</div>
          ) : null}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </Card>
  );
}

function ToggleRow({
  icon: Icon,
  title,
  desc,
  checked,
  onToggle,
  disabled,
  accent = "primary",
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  checked: boolean;
  onToggle: (v: boolean) => void;
  disabled?: boolean;
  accent?: "primary" | "red" | "amber";
}) {
  const accentClass =
    accent === "red"
      ? "text-red-500 bg-red-500/10"
      : accent === "amber"
        ? "text-amber-500 bg-amber-500/10"
        : "text-primary bg-primary/10";
  return (
    <div
      data-checked={checked ? "true" : "false"}
      className={cn(
        "toggle-glow flex items-center justify-between gap-3 rounded-xl border p-3 transition-all duration-200",
        checked
          ? "border-primary/40 bg-primary/5"
          : "border-border/50 bg-card/40 hover:border-border hover:bg-card/70",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-lg transition-transform duration-200",
            accentClass,
            checked && "scale-105",
          )}
        >
          <Icon className="size-[18px]" strokeWidth={2.1} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium leading-tight">{title}</div>
          <div className="text-[11px] leading-snug text-muted-foreground">{desc}</div>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onToggle} disabled={disabled} aria-label={title} />
    </div>
  );
}

export function ControlPanel({ rec, lang, t }: Props) {
  const { settings, features } = rec;
  const disabled = rec.isRecording || rec.isPaused || rec.status === "countdown";

  const positions: WebcamPosition[] = ["top-left", "top-right", "bottom-left", "bottom-right"];

  return (
    <div className="flex flex-col gap-4">
      {/* Sources */}
      <SectionCard title={t("sourcesTitle")} desc={t("controlPanelDesc")} icon={Settings2} t={t}>
        <div className="flex flex-col gap-2.5">
          <ToggleRow
            icon={Monitor}
            title={t("screen")}
            desc={t("screenDesc")}
            checked
            onToggle={() => {}}
            disabled
          />
          <ToggleRow
            icon={Webcam}
            title={t("webcam")}
            desc={t("webcamDesc")}
            checked={settings.webcamEnabled}
            onToggle={(v) => rec.toggleWebcam(v)}
            disabled={disabled}
          />
          <ToggleRow
            icon={Mic}
            title={t("microphone")}
            desc={t("microphoneDesc")}
            checked={settings.micEnabled}
            onToggle={(v) => rec.updateSettings("micEnabled", v)}
            disabled={disabled}
          />
          <ToggleRow
            icon={Volume2}
            title={t("systemAudio")}
            desc={t("systemAudioDesc")}
            checked={settings.systemAudioEnabled}
            onToggle={(v) => rec.updateSettings("systemAudioEnabled", v)}
            disabled={disabled}
            accent="amber"
          />
          <div className="flex items-start gap-2 rounded-lg bg-amber-500/5 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-400/90">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            <span>{t("systemAudioHint")}</span>
          </div>
        </div>
      </SectionCard>

      {/* Devices */}
      <SectionCard title={t("cameraDevice")} desc={t("micDevice")} icon={Webcam} t={t}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => rec.refreshDevices()}
              className="gap-1.5"
            >
              <RefreshCw className="size-3.5" />
              {t("refreshDevices")}
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cam-select" className="text-xs text-muted-foreground">
              {t("cameraDevice")}
            </Label>
            <Select
              value={rec.selectedCameraId || undefined}
              onValueChange={rec.setSelectedCameraId}
              disabled={disabled}
            >
              <SelectTrigger id="cam-select" className="w-full">
                <SelectValue placeholder={t("selectCamera")} />
              </SelectTrigger>
              <SelectContent>
                {rec.devices.cameras.length === 0 ? (
                  <SelectItem value="__none" disabled>
                    {t("noDevices")}
                  </SelectItem>
                ) : (
                  rec.devices.cameras.map((d, i) => (
                    <SelectItem key={d.deviceId || i} value={d.deviceId || `cam-${i}`}>
                      {d.label || `${t("cameraDevice")} ${i + 1}`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mic-select" className="text-xs text-muted-foreground">
              {t("micDevice")}
            </Label>
            <Select
              value={rec.selectedMicId || undefined}
              onValueChange={rec.setSelectedMicId}
              disabled={disabled}
            >
              <SelectTrigger id="mic-select" className="w-full">
                <SelectValue placeholder={t("selectMic")} />
              </SelectTrigger>
              <SelectContent>
                {rec.devices.mics.length === 0 ? (
                  <SelectItem value="__none" disabled>
                    {t("noDevices")}
                  </SelectItem>
                ) : (
                  rec.devices.mics.map((d, i) => (
                    <SelectItem key={d.deviceId || i} value={d.deviceId || `mic-${i}`}>
                      {d.label || `${t("micDevice")} ${i + 1}`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {rec.screenLabel ? (
            <div className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
              <div className="text-[11px] text-muted-foreground">{t("screenSourceInfo")}</div>
              <div className="mt-0.5 truncate text-xs font-medium">{rec.screenLabel}</div>
            </div>
          ) : null}
        </div>
      </SectionCard>

      {/* Output */}
      <SectionCard title={t("outputTitle")} icon={Film} t={t}>
        <div className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t("outputQuality")}</Label>
            <Select
              value={settings.quality}
              onValueChange={(v) => rec.updateSettings("quality", v as Q)}
              disabled={disabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="720">{t("quality720")}</SelectItem>
                <SelectItem value="1080">{t("quality1080")}</SelectItem>
                <SelectItem value="1440">{t("quality1440")}</SelectItem>
                <SelectItem value="native">{t("qualityNative")}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">{t("qualityHint")}</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t("frameRate")}</Label>
            <Select
              value={settings.frameRate}
              onValueChange={(v) => rec.updateSettings("frameRate", v as FrameRate)}
              disabled={disabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24">24 fps</SelectItem>
                <SelectItem value="30">30 fps</SelectItem>
                <SelectItem value="60">60 fps</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">{t("fpsHint")}</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">{t("videoBitrate")}</Label>
              <span className="text-[11px] font-medium text-muted-foreground">
                {settings.videoBitrate ? `${(settings.videoBitrate / 1_000_000).toFixed(1)} Mbps` : t("bitrateAuto")}
              </span>
            </div>
            <Slider
              value={[settings.videoBitrate / 1_000_000]}
              min={0}
              max={20}
              step={0.5}
              onValueChange={(v) => rec.updateSettings("videoBitrate", Math.round(v[0] * 1_000_000))}
              disabled={disabled}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">{t("audioBitrate")}</Label>
              <span className="text-[11px] font-medium text-muted-foreground">
                {settings.audioBitrate ? `${Math.round(settings.audioBitrate / 1000)} kbps` : t("bitrateAuto")}
              </span>
            </div>
            <Slider
              value={[settings.audioBitrate / 1000]}
              min={0}
              max={320}
              step={16}
              onValueChange={(v) => rec.updateSettings("audioBitrate", Math.round(v[0] * 1000))}
              disabled={disabled}
            />
          </div>

          {/* Recording format preview — shows the negotiated codec before recording */}
          {rec.negotiatedMime ? (
            <div className="codec-shimmer relative flex items-center justify-between gap-2 overflow-hidden rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5">
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-muted-foreground">{t("willRecordAs")}</div>
                <div className="mt-0.5 truncate font-mono text-xs font-bold text-primary">
                  {mimeToLabel(rec.negotiatedMime)}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <Film className="size-4 shrink-0 text-primary" />
              </div>
            </div>
          ) : null}

          {/* Adaptive FPS toggle */}
          <label className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-card/40 px-3 py-2">
            <div className="min-w-0">
              <div className="text-xs font-medium">{t("adaptiveFps")}</div>
              <div className="text-[10px] text-muted-foreground">{t("adaptiveFpsHint")}</div>
            </div>
            <Switch
              checked={settings.adaptiveFps}
              onCheckedChange={(v) => rec.updateSettings("adaptiveFps", v)}
              disabled={disabled}
              aria-label={t("adaptiveFps")}
            />
          </label>
        </div>
      </SectionCard>

      {/* Webcam overlay */}
      <SectionCard title={t("overlayTitle")} icon={Webcam} t={t}>
        <div className={cn("flex flex-col gap-4", !settings.webcamEnabled && "pointer-events-none opacity-50")}>
          <OverlayTemplates rec={rec} lang={lang} t={t} />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("webcamShape")}</Label>
              <Select
                value={settings.webcamShape}
                onValueChange={(v) => rec.updateSettings("webcamShape", v as WebcamShape)}
                disabled={disabled || !settings.webcamEnabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rounded">{t("shapeRounded")}</SelectItem>
                  <SelectItem value="circle">{t("shapeCircle")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("cameraPosition")}</Label>
              <Select
                value={settings.webcamPosition}
                onValueChange={(v) => rec.updateSettings("webcamPosition", v as WebcamPosition)}
                disabled={disabled || !settings.webcamEnabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((p) => (
                    <SelectItem key={p} value={p}>
                      {t(`pos${p.replace(/-(.)/g, (_, c) => c.toUpperCase()).replace(/^./, (c) => c.toUpperCase())}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Position grid picker — clicking a preset clears any custom drag position */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {positions.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  rec.updateSettings("webcamPosition", p);
                  rec.setWebcamFreePos(null);
                }}
                disabled={disabled || !settings.webcamEnabled}
                aria-pressed={settings.webcamPosition === p && !rec.freePos}
                className={cn(
                  "relative aspect-[4/3] rounded-lg border bg-card transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  settings.webcamPosition === p && !rec.freePos
                    ? "border-primary ring-1 ring-primary/40"
                    : "border-border/50 hover:border-primary/40",
                )}
              >
                <div
                  className={cn(
                    "absolute size-3 rounded-sm bg-primary/70",
                    p.includes("top") ? "top-1.5" : "bottom-1.5",
                    p.includes("left") ? "left-1.5" : "right-1.5",
                  )}
                />
              </button>
            ))}
          </div>

          {/* Custom position indicator + reset */}
          {rec.freePos ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-primary" />
                <span className="text-xs font-medium text-primary">{t("customPosition")}</span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  ({Math.round(rec.freePos.x * 100)}%, {Math.round(rec.freePos.y * 100)}%)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => rec.setWebcamFreePos(null)}
                disabled={disabled}
              >
                <RotateCcw className="size-3" />
                {t("resetPosition")}
              </Button>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">{t("webcamFreePosHint")}</p>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">{t("cameraSize")}</Label>
              <span className="text-[11px] font-medium text-muted-foreground">{settings.webcamSize}%</span>
            </div>
            <Slider
              value={[settings.webcamSize]}
              min={10}
              max={50}
              step={1}
              onValueChange={(v) => rec.updateSettings("webcamSize", v[0])}
              disabled={disabled || !settings.webcamEnabled}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">{t("overlayMargin")}</Label>
              <span className="text-[11px] font-medium text-muted-foreground">{settings.webcamMargin}px</span>
            </div>
            <Slider
              value={[settings.webcamMargin]}
              min={0}
              max={80}
              step={2}
              onValueChange={(v) => rec.updateSettings("webcamMargin", v[0])}
              disabled={disabled || !settings.webcamEnabled}
            />
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <label className="flex items-center gap-2 text-xs">
              <Switch
                checked={settings.webcamBorder}
                onCheckedChange={(v) => rec.updateSettings("webcamBorder", v)}
                disabled={disabled || !settings.webcamEnabled}
              />
              {t("overlayBorder")}
            </label>
            <label className="flex items-center gap-2 text-xs">
              <Switch
                checked={settings.webcamShadow}
                onCheckedChange={(v) => rec.updateSettings("webcamShadow", v)}
                disabled={disabled || !settings.webcamEnabled}
              />
              {t("overlayShadow")}
            </label>
            <label className="flex items-center gap-2 text-xs">
              <Switch
                checked={settings.countdown}
                onCheckedChange={(v) => rec.updateSettings("countdown", v)}
                disabled={disabled}
              />
              {t("countdown")}
            </label>
          </div>

          {settings.countdown ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">{t("countdownSeconds")}</Label>
                <span className="text-[11px] font-medium text-muted-foreground">{settings.countdownSeconds}{t("secondsShort")}</span>
              </div>
              <Slider
                value={[settings.countdownSeconds]}
                min={1}
                max={10}
                step={1}
                onValueChange={(v) => rec.updateSettings("countdownSeconds", v[0])}
                disabled={disabled}
              />
            </div>
          ) : null}
        </div>
      </SectionCard>

      {/* Round 10: Watermark (independent of webcam) */}
      <SectionCard title={t("watermark")} icon={Droplet} t={t}>
        <div className="flex flex-col gap-3">
          <label className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-card/40 px-3 py-2">
            <span className="text-xs font-medium">{t("watermark")}</span>
            <Switch
              checked={settings.watermark}
              onCheckedChange={(v) => rec.updateSettings("watermark", v)}
              disabled={disabled}
              aria-label={t("watermark")}
            />
          </label>
          {settings.watermark && (
            <div className="space-y-3 rounded-xl border border-border/50 bg-muted/30 p-3">
              <div className="text-[11px] font-medium text-muted-foreground">{t("watermarkCustom")}</div>
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground">{t("watermarkText")}</Label>
                <Input
                  value={settings.watermarkText}
                  onChange={(e) => rec.updateSettings("watermarkText", e.target.value)}
                  placeholder={t("watermarkTextPlaceholder")}
                  disabled={disabled}
                  className="h-8 text-xs"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 px-2 text-[10px] text-muted-foreground"
                  onClick={() => rec.updateSettings("watermarkText", "")}
                  disabled={disabled}
                >
                  {t("watermarkUseApp")}
                </Button>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-muted-foreground">{t("watermarkOpacity")}</Label>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {Math.round(settings.watermarkOpacity * 100)}%
                  </span>
                </div>
                <Slider
                  value={[settings.watermarkOpacity]}
                  min={0.1}
                  max={1}
                  step={0.05}
                  onValueChange={(v) => rec.updateSettings("watermarkOpacity", v[0])}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-muted-foreground">{t("watermarkSize")}</Label>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {Math.round(settings.watermarkSize * 1000)}‰
                  </span>
                </div>
                <Slider
                  value={[settings.watermarkSize]}
                  min={0.01}
                  max={0.06}
                  step={0.002}
                  onValueChange={(v) => rec.updateSettings("watermarkSize", v[0])}
                  disabled={disabled}
                />
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Timer + actions */}
      <SectionCard title={t("recordingTimer")} icon={Clock} t={t}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-center gap-2.5 rounded-xl border border-border/50 bg-muted/30 py-4">
            <Circle
              className={cn(
                "size-2.5",
                rec.isRecording ? "fill-red-500 text-red-500 rec-dot" : "fill-muted-foreground/40 text-muted-foreground/40",
              )}
            />
            <span className="font-mono text-3xl font-bold tabular-nums tracking-tight">
              {rec.formatDuration(rec.elapsed)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {rec.isRecording ? (
              <Button
                variant="outline"
                onClick={rec.pauseRecording}
                className="gap-2"
                size="lg"
              >
                <Pause className="size-4" />
                {t("pause")}
              </Button>
            ) : rec.isPaused ? (
              <Button
                variant="outline"
                onClick={rec.resumeRecording}
                className="gap-2"
                size="lg"
              >
                <Play className="size-4" />
                {t("resume")}
              </Button>
            ) : (
              <Button
                onClick={rec.startRecording}
                disabled={!rec.canStart}
                className="gap-2 bg-red-600 text-white hover:bg-red-600/90"
                size="lg"
              >
                <Circle className="size-3.5 fill-current" />
                {t("startRecording")}
              </Button>
            )}

            {(rec.isRecording || rec.isPaused) && (
              <Button
                onClick={() => rec.stopRecording()}
                variant="destructive"
                className="gap-2"
                size="lg"
              >
                <Square className="size-4 fill-current" />
                {t("stop")}
              </Button>
            )}
            {!(rec.isRecording || rec.isPaused) && (
              <Button
                onClick={rec.resetAll}
                variant="outline"
                className="gap-2"
                size="lg"
                disabled={rec.status === "idle" && !rec.result}
              >
                <RotateCcw className="size-4" />
                {t("reset")}
              </Button>
            )}
          </div>

          {rec.features && !rec.features.getDisplayMedia ? (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-[11px] text-red-600 dark:text-red-400">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              <span>{t("errUnsupported")}</span>
            </div>
          ) : null}
        </div>
      </SectionCard>
    </div>
  );
}
