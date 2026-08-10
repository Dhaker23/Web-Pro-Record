"use client";

import { useState } from "react";
import { Pen, Highlighter, ArrowUpRight, Type, Eraser, Trash2, Undo2, Palette, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  type AnnotationTool,
  type UseAnnotations,
  ANNOTATION_COLORS,
} from "@/hooks/use-annotations";
import type { Lang } from "@/lib/i18n";

type Props = {
  annotations: UseAnnotations;
  lang: Lang;
  t: (key: string) => string;
  disabled?: boolean;
};

const TOOLS: { id: AnnotationTool; icon: React.ElementType; label: string }[] = [
  { id: "pen", icon: Pen, label: "annotationPen" },
  { id: "highlighter", icon: Highlighter, label: "annotationHighlighter" },
  { id: "arrow", icon: ArrowUpRight, label: "annotationArrow" },
  { id: "text", icon: Type, label: "annotationText" },
  { id: "eraser", icon: Eraser, label: "annotationEraser" },
];

export function AnnotationToolbar({ annotations, t, disabled }: Props) {
  const { settings } = annotations;
  const [showColors, setShowColors] = useState(false);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-xl border border-border/60 bg-card/80 p-1.5 backdrop-blur-md",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      {/* Tool buttons */}
      {TOOLS.map((tool) => {
        const Icon = tool.icon;
        const isActive = settings.tool === tool.id;
        return (
          <Button
            key={tool.id}
            variant={isActive ? "default" : "ghost"}
            size="icon"
            className="size-8"
            onClick={() => annotations.updateSettings("tool", tool.id)}
            aria-label={t(tool.label)}
            aria-pressed={isActive}
            title={t(tool.label)}
          >
            <Icon className="size-4" />
          </Button>
        );
      })}

      <div className="mx-0.5 h-5 w-px bg-border/60" />

      {/* Color picker */}
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => setShowColors((v) => !v)}
          aria-label={t("annotationColor")}
          title={t("annotationColor")}
        >
          <div className="size-4 rounded-full border border-border/60" style={{ backgroundColor: settings.color }} />
        </Button>
        {showColors && (
          <div className="absolute top-9 z-30 flex flex-col gap-2 rounded-lg border border-border/60 bg-popover p-2 shadow-md">
            <div className="flex gap-1">
              {ANNOTATION_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    annotations.updateSettings("color", color);
                    setShowColors(false);
                  }}
                  className={cn(
                    "size-5 rounded-full border transition-transform hover:scale-110",
                    settings.color === color ? "border-primary ring-2 ring-primary/30" : "border-border/60",
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={color}
                />
              ))}
            </div>
            {/* Round 11: custom color picker */}
            <div className="flex items-center gap-1.5 border-t border-border/50 pt-1.5">
              <label className="relative grid size-5 cursor-pointer place-items-center overflow-hidden rounded-full border border-border/60" title={t("customColor")}>
                <input
                  type="color"
                  value={settings.color}
                  onChange={(e) => annotations.updateSettings("color", e.target.value)}
                  className="absolute inset-0 size-full cursor-pointer opacity-0"
                />
                <div className="size-full rounded-full" style={{ backgroundColor: settings.color }} />
              </label>
              <span className="text-[9px] text-muted-foreground">{t("customColor")}</span>
            </div>
          </div>
        )}
      </div>

      {/* Brush size slider */}
      <div className="flex items-center gap-1.5 px-1">
        <Palette className="size-3 text-muted-foreground" />
        <Slider
          value={[settings.size]}
          min={1}
          max={20}
          step={1}
          onValueChange={(v) => annotations.updateSettings("size", v[0])}
          className="w-16"
        />
        <span className="w-5 font-mono text-[10px] tabular-nums text-muted-foreground">{settings.size}</span>
      </div>

      <div className="mx-0.5 h-5 w-px bg-border/60" />

      {/* Undo + Clear */}
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={annotations.undo}
        disabled={annotations.strokes.length === 0}
        aria-label={t("annotationUndo")}
        title={t("annotationUndo")}
      >
        <Undo2 className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-destructive"
        onClick={annotations.clearAll}
        disabled={annotations.strokes.length === 0}
        aria-label={t("annotationClear")}
        title={t("annotationClear")}
      >
        <Trash2 className="size-4" />
      </Button>

      <div className="mx-0.5 h-5 w-px bg-border/60" />

      {/* Round 10: Export / Import */}
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={annotations.downloadJson}
        disabled={annotations.strokes.length === 0}
        aria-label={t("annotationExport")}
        title={t("annotationExport")}
      >
        <Download className="size-4" />
      </Button>
      <label
        className="grid size-8 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        title={t("annotationImport")}
      >
        <Upload className="size-4" />
        <input
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              await annotations.importFromFile(file);
              e.target.value = "";
            }
          }}
        />
      </label>
    </div>
  );
}
