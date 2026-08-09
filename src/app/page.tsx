"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { AlertTriangle, X, Radio } from "lucide-react";
import { useRecorder } from "@/hooks/use-recorder";
import { translate, isRtl, type Lang } from "@/lib/i18n";
import { Header } from "@/components/recorder/header";
import { Hero } from "@/components/recorder/hero";
import { ControlPanel } from "@/components/recorder/control-panel";
import { LivePreview } from "@/components/recorder/live-preview";
import { FinalRecording } from "@/components/recorder/final-recording";
import { SnapshotsGallery } from "@/components/recorder/snapshots-gallery";
import { HelpSection } from "@/components/recorder/help-section";
import { Footer } from "@/components/recorder/footer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [lang, setLang] = useState<Lang>("en");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rec = useRecorder(lang, canvasRef);
  const { toast } = useToast();
  const { setTheme, resolvedTheme } = useTheme();

  const t = useCallback((key: string) => translate(lang, key), [lang]);

  const toggleLang = useCallback(() => {
    setLang((l) => (l === "en" ? "ar" : "en"));
  }, []);

  const toggleTheme = useCallback(() => {
    const current = resolvedTheme ?? "dark";
    setTheme(current === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  // Sync document direction + lang attribute
  useEffect(() => {
    const rtl = isRtl(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = rtl ? "rtl" : "ltr";
  }, [lang]);

  // Surface errors/warnings as toasts
  useEffect(() => {
    if (rec.error) {
      toast({
        variant: "destructive",
        title: lang === "ar" ? "حدث خطأ" : "Something went wrong",
        description: t(rec.error.message),
      });
    }
  }, [rec.error, lang, t, toast]);

  useEffect(() => {
    if (rec.warning) {
      toast({
        description: t(rec.warning),
      });
      const w = rec.warning;
      const id = setTimeout(() => {
        if (rec.warning === w) rec.clearWarning();
      }, 6000);
      return () => clearTimeout(id);
    }
  }, [rec.warning, t, toast]);

  // Keyboard shortcuts (global). Ignores typing in inputs/selects/textareas.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isEditable =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable;
      if (isEditable) return;

      const mod = e.metaKey || e.ctrlKey;

      // Ctrl/Cmd + L → toggle language
      if (mod && e.key.toLowerCase() === "l") {
        e.preventDefault();
        toggleLang();
        return;
      }
      // Ctrl/Cmd + D → toggle theme
      if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        toggleTheme();
        return;
      }
      if (mod) return; // other combos handled by browser

      switch (e.key) {
        case " ":
        case "Spacebar": {
          e.preventDefault();
          if (rec.isRecording) {
            rec.pauseRecording();
          } else if (rec.isPaused) {
            rec.resumeRecording();
          } else if (rec.canStart) {
            void rec.startRecording();
          }
          break;
        }
        case "Escape": {
          if (rec.isRecording || rec.isPaused) {
            rec.stopRecording();
          }
          break;
        }
        case "p":
        case "P": {
          if (rec.isRecording) rec.pauseRecording();
          else if (rec.isPaused) rec.resumeRecording();
          break;
        }
        case "r":
        case "R": {
          if (!rec.isRecording && !rec.isPaused) rec.resetAll();
          break;
        }
        case "w":
        case "W": {
          rec.toggleWebcam(!rec.settings.webcamEnabled);
          break;
        }
        case "m":
        case "M": {
          rec.updateSettings("micEnabled", !rec.settings.micEnabled);
          break;
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    rec,
    toggleLang,
    toggleTheme,
  ]);

  // Browser recommendation banner
  const [showBanner, setShowBanner] = useState(false);
  const [isChromium, setIsChromium] = useState(true);
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const ua = navigator.userAgent;
    const chromium = /Chrom(e|ium)/.test(ua) || /Edg/.test(ua);
    setIsChromium(chromium);
    setShowBanner(!chromium);
  }, []);

  const unsupported =
    rec.features && (!rec.features.getDisplayMedia || !rec.features.mediaRecorder || !rec.features.canvasCapture);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header lang={lang} onToggleLang={toggleLang} t={t} />

      <Hero t={t} />

      {/* Browser recommendation banner */}
      {showBanner && !unsupported && (
        <div className="border-b border-amber-500/30 bg-amber-500/10">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6">
            <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="flex-1 text-xs text-amber-700 dark:text-amber-300">{t("browserBanner")}</p>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
              onClick={() => setShowBanner(false)}
              aria-label={t("dismiss")}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Unsupported blocker */}
      {unsupported && (
        <div className="border-b border-red-500/30 bg-red-500/10">
          <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-4 sm:px-6">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                {t("unsupportedBrowser")}
              </p>
              <p className="mt-0.5 text-xs text-red-700/80 dark:text-red-300/80">
                {t("errUnsupported")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main studio */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(340px,400px)_1fr]">
          {/* Left: control panel */}
          <div className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1 scroll-thin">
            <ControlPanel rec={rec} lang={lang} t={t} />
          </div>

          {/* Right: preview + final */}
          <div className="flex flex-col gap-6">
            <LivePreview rec={rec} lang={lang} t={t} canvasRef={canvasRef} />
            <SnapshotsGallery rec={rec} lang={lang} t={t} />
            <FinalRecording rec={rec} lang={lang} t={t} />
          </div>
        </div>
      </main>

      <HelpSection rec={rec} lang={lang} t={t} />

      <Footer lang={lang} t={t} />

      {/* Floating recording status chip */}
      {(rec.isRecording || rec.isPaused) && (
        <FloatingStatusChip rec={rec} t={t} lang={lang} />
      )}
    </div>
  );
}

function FloatingStatusChip({
  rec,
  t,
  lang,
}: {
  rec: ReturnType<typeof useRecorder>;
  t: (k: string) => string;
  lang: Lang;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-border/60 bg-background/90 px-4 py-2 shadow-lg backdrop-blur-md">
        <span className="relative flex size-2.5">
          {rec.isRecording && (
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500/70" />
          )}
          <span
            className={`relative inline-flex size-2.5 rounded-full ${
              rec.isRecording ? "bg-red-500" : "bg-amber-500"
            }`}
          />
        </span>
        <span className="text-xs font-medium">
          {rec.isRecording ? t("recording") : t("paused")}
        </span>
        <span className="font-mono text-sm font-bold tabular-nums">
          {rec.formatDuration(rec.elapsed)}
        </span>
        <Radio className="size-3.5 text-muted-foreground" />
        <span className="sr-only">
          {lang === "ar" ? "الوقت المنقضي" : "Elapsed time"} {rec.formatDuration(rec.elapsed)}
        </span>
      </div>
    </div>
  );
}
