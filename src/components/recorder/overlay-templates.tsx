"use client";

import { Frame, Sparkles, Circle, Square, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { OVERLAY_TEMPLATES, detectTemplate, type OverlayTemplateId } from "@/lib/overlay-templates";
import type { UseRecorder } from "@/hooks/use-recorder";
import type { Lang } from "@/lib/i18n";

type Props = {
  rec: UseRecorder;
  lang: Lang;
  t: (key: string) => string;
};

const TEMPLATE_ICONS: Record<OverlayTemplateId | "custom", React.ElementType> = {
  classic: Square,
  neon: Sparkles,
  minimal: Circle,
  polaroid: Image,
  custom: Frame,
};

export function OverlayTemplates({ rec, t }: Props) {
  const active = detectTemplate(rec.settings);

  const handleClick = (id: OverlayTemplateId) => {
    const tpl = OVERLAY_TEMPLATES.find((tp) => tp.id === id);
    if (tpl) rec.applyPreset(tpl.settings);
  };

  const items: { id: OverlayTemplateId; label: string; desc: string }[] = [
    { id: "classic", label: t("templateClassic"), desc: t("templateClassicDesc") },
    { id: "neon", label: t("templateNeon"), desc: t("templateNeonDesc") },
    { id: "minimal", label: t("templateMinimal"), desc: t("templateMinimalDesc") },
    { id: "polaroid", label: t("templatePolaroid"), desc: t("templatePolaroidDesc") },
  ];

  return (
    <div className={cn("rounded-xl border border-border/50 bg-card/40 p-3", !rec.settings.webcamEnabled && "pointer-events-none opacity-50")}>
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Frame className="size-3.5 text-primary" />
          <span className="text-xs font-semibold">{t("overlayTemplates")}</span>
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
          {active === "custom" ? t("presetCustom") : t(`template${active.charAt(0).toUpperCase()}${active.slice(1)}`)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((item) => {
          const Icon = TEMPLATE_ICONS[item.id];
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleClick(item.id)}
              disabled={rec.isRecording || rec.isPaused || !rec.settings.webcamEnabled}
              aria-pressed={isActive}
              className={cn(
                "group flex flex-col items-center gap-1.5 rounded-lg border p-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
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
                <Icon className="size-3.5" strokeWidth={2.2} />
              </div>
              <div className="text-[11px] font-semibold leading-tight">{item.label}</div>
              <div className="text-[9px] leading-tight text-muted-foreground">{item.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
