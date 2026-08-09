"use client";

import { Gamepad2, Presentation, GraduationCap, Minimize2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRESETS, detectPreset, type PresetId } from "@/lib/presets";
import type { UseRecorder } from "@/hooks/use-recorder";
import type { Lang } from "@/lib/i18n";

type Props = {
  rec: UseRecorder;
  lang: Lang;
  t: (key: string) => string;
};

const PRESET_ICONS: Record<PresetId | "custom", React.ElementType> = {
  gaming: Gamepad2,
  presentation: Presentation,
  tutorial: GraduationCap,
  minimal: Minimize2,
  custom: Sparkles,
};

export function PresetsBar({ rec, lang, t }: Props) {
  const active = detectPreset(rec.settings);

  const handleClick = (id: PresetId) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (preset) rec.applyPreset(preset.settings);
  };

  const items: { id: PresetId; label: string; desc: string }[] = [
    { id: "gaming", label: t("presetGaming"), desc: t("presetGamingDesc") },
    { id: "presentation", label: t("presetPresentation"), desc: t("presetPresentationDesc") },
    { id: "tutorial", label: t("presetTutorial"), desc: t("presetTutorialDesc") },
    { id: "minimal", label: t("presetMinimal"), desc: t("presetMinimalDesc") },
  ];

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-3 backdrop-blur-sm">
      <div className="mb-2.5 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold leading-tight">{t("presetsTitle")}</div>
          <div className="text-[11px] text-muted-foreground">{t("presetsDesc")}</div>
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
          {active === "custom" ? t("presetCustom") : t(`preset${active.charAt(0).toUpperCase()}${active.slice(1)}`)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((item) => {
          const Icon = PRESET_ICONS[item.id];
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleClick(item.id)}
              disabled={rec.isRecording || rec.isPaused}
              aria-pressed={isActive}
              className={cn(
                "group relative flex flex-col items-start gap-1.5 overflow-hidden rounded-xl border p-2.5 text-start transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                isActive
                  ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                  : "border-border/50 bg-card/60 hover:border-primary/40 hover:bg-accent/40",
              )}
            >
              <div
                className={cn(
                  "grid size-7 place-items-center rounded-lg transition-transform group-hover:scale-110",
                  isActive ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
                )}
              >
                <Icon className="size-4" strokeWidth={2.2} />
              </div>
              <div className="text-xs font-semibold leading-tight">{item.label}</div>
              <div className="text-[10px] leading-tight text-muted-foreground">{item.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
