"use client";

import { Monitor, Moon, Sun, Languages, ShieldCheck } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

type Props = {
  lang: "en" | "ar";
  onToggleLang: () => void;
  t: (key: string) => string;
};

export function Header({ lang, onToggleLang, t }: Props) {
  const { setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    const current = resolvedTheme ?? "dark";
    setTheme(current === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="relative grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Monitor className="size-5" strokeWidth={2.2} />
            <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-red-500 ring-2 ring-background" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-bold tracking-tight">
              {t("brandName")}
            </span>
            <span className="hidden text-[11px] text-muted-foreground sm:block">
              {t("privacyNote")}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="mr-1 hidden items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground md:flex">
            <ShieldCheck className="size-3.5 text-primary" />
            <span>{t("privacyNote")}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleLang}
            className="gap-1.5 px-2.5"
            aria-label={lang === "en" ? t("switchToArabic") : t("switchToEnglish")}
          >
            <Languages className="size-4" />
            <span className="text-sm font-semibold">
              {lang === "en" ? "العربية" : "English"}
            </span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="size-9 rounded-lg"
            aria-label={t("toggleTheme")}
          >
            {/* Show Moon in light mode (click -> dark), Sun in dark mode (click -> light) */}
            <Moon className="hidden size-[18px] dark:block" />
            <Sun className="block size-[18px] dark:hidden" />
          </Button>
        </div>
      </div>
    </header>
  );
}
