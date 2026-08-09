"use client";

import { Keyboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Lang } from "@/lib/i18n";

type Props = {
  lang: Lang;
  t: (key: string) => string;
};

type Shortcut = {
  keys: string[];
  label: string;
};

export function ShortcutsDialog({ lang, t }: Props) {
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const mod = isMac ? "⌘" : "Ctrl";

  const shortcuts: Shortcut[] = [
    { keys: ["Space"], label: t("shortcutStart") },
    { keys: ["P"], label: t("shortcutPause") },
    { keys: ["R"], label: t("shortcutReset") },
    { keys: [mod, "L"], label: t("shortcutToggleLang") },
    { keys: [mod, "D"], label: t("shortcutToggleTheme") },
    { keys: ["W"], label: t("shortcutToggleWebcam") },
    { keys: ["M"], label: t("shortcutToggleMic") },
    { keys: ["?"], label: t("showShortcuts") },
    { keys: ["Esc"], label: t("shortcutClose") },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 px-2.5"
          aria-label={t("showShortcuts")}
          title={t("showShortcuts")}
        >
          <Keyboard className="size-4" />
          <span className="hidden text-sm font-medium sm:inline">{t("shortcutsTitle")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="border-b border-border/50 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Keyboard className="size-4 text-primary" />
            {t("shortcutsTitle")}
          </DialogTitle>
          <DialogDescription className="text-xs">{t("shortcutsDesc")}</DialogDescription>
        </DialogHeader>
        <div className="scroll-thin max-h-[60vh] overflow-y-auto p-2">
          <ul className="flex flex-col">
            {shortcuts.map((s, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/50"
              >
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <span className="flex items-center gap-1" dir="ltr">
                  {s.keys.map((k, j) => (
                    <kbd
                      key={j}
                      className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-border bg-muted px-1.5 font-mono text-[11px] font-semibold text-foreground shadow-[0_1px_0_0_var(--border)]"
                    >
                      {k}
                    </kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
