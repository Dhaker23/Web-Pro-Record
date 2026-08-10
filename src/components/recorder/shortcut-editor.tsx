"use client";

import { useEffect, useState } from "react";
import { Keyboard, RotateCcw, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  type ShortcutMap,
  type ShortcutAction,
  DEFAULT_SHORTCUTS,
  saveShortcuts,
  eventToBinding,
  bindingLabel,
} from "@/lib/shortcuts";
import type { Lang } from "@/lib/i18n";

type Props = {
  lang: Lang;
  t: (key: string) => string;
  shortcuts: ShortcutMap;
  onChange: (map: ShortcutMap) => void;
  /** Triggered by the page to re-read shortcuts after edits. */
  onReset: () => void;
};

type ActionMeta = {
  action: ShortcutAction;
  label: string;
};

export function ShortcutEditor({ lang, t, shortcuts, onChange, onReset }: Props) {
  const [editing, setEditing] = useState<ShortcutAction | null>(null);
  const [conflict, setConflict] = useState(false);
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  const actions: ActionMeta[] = [
    { action: "startStop", label: t("shortcutStart") },
    { action: "pauseResume", label: t("shortcutPause") },
    { action: "reset", label: t("shortcutReset") },
    { action: "toggleLang", label: t("shortcutToggleLang") },
    { action: "toggleTheme", label: t("shortcutToggleTheme") },
    { action: "toggleWebcam", label: t("shortcutToggleWebcam") },
    { action: "toggleMic", label: t("shortcutToggleMic") },
    { action: "toggleAnnotations", label: t("shortcutToggleAnnotations") },
    { action: "toggleScheduler", label: t("shortcutToggleScheduler") },
    { action: "captureSnapshot", label: t("shortcutCaptureSnapshot") },
    { action: "captureClip", label: t("shortcutCaptureClip") },
  ];

  // Capture key presses while editing a binding.
  useEffect(() => {
    if (!editing) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") {
        setEditing(null);
        setConflict(false);
        return;
      }
      // Ignore pure modifier presses.
      if (e.key === "Control" || e.key === "Meta" || e.key === "Shift" || e.key === "Alt") return;
      const binding = eventToBinding(e);
      // Check for conflicts with other actions.
      const conflictWith = Object.entries(shortcuts).find(
        ([a, b]) =>
          a !== editing &&
          b.combo === binding.combo &&
          b.mod === binding.mod,
      );
      if (conflictWith) {
        setConflict(true);
        return;
      }
      setConflict(false);
      const next = { ...shortcuts, [editing]: binding };
      onChange(next);
      saveShortcuts(next);
      setEditing(null);
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [editing, shortcuts, onChange]);

  const handleReset = () => {
    onChange(DEFAULT_SHORTCUTS);
    saveShortcuts(DEFAULT_SHORTCUTS);
    onReset();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 px-2.5"
          aria-label={t("editShortcuts")}
          title={t("editShortcuts")}
        >
          <Keyboard className="size-4" />
          <span className="hidden text-sm font-medium sm:inline">{t("editShortcuts")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="border-b border-border/50 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Keyboard className="size-4 text-primary" />
            {t("editShortcuts")}
          </DialogTitle>
          <DialogDescription className="text-xs">{t("editShortcutsDesc")}</DialogDescription>
        </DialogHeader>
        <div className="scroll-thin max-h-[60vh] overflow-y-auto p-2">
          <ul className="flex flex-col">
            {actions.map(({ action, label }) => {
              const binding = shortcuts[action];
              const isEditing = editing === action;
              return (
                <li
                  key={action}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/50"
                >
                  <span className="text-sm text-muted-foreground">{label}</span>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      {conflict && (
                        <span className="text-[10px] font-medium text-red-500">{t("shortcutConflict")}</span>
                      )}
                      <span className="flex items-center gap-1 rounded-md border border-primary bg-primary/5 px-2 py-1 text-[11px] font-medium text-primary">
                        {t("pressToBind")}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={() => {
                          setEditing(null);
                          setConflict(false);
                        }}
                        aria-label={t("cancelBind")}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(action);
                        setConflict(false);
                      }}
                      className="flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-1 font-mono text-[11px] font-semibold text-foreground transition-colors hover:border-primary hover:bg-accent"
                      dir="ltr"
                    >
                      {bindingLabel(binding, isMac)}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="flex items-center justify-between border-t border-border/50 px-5 py-3">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleReset}>
            <RotateCcw className="size-3" />
            {t("resetShortcuts")}
          </Button>
          <DialogClose asChild>
            <Button size="sm" className="gap-1.5">
              <Check className="size-3.5" />
              {t("shortcutClose")}
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
