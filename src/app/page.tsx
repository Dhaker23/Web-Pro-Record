"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { AlertTriangle, X, Radio } from "lucide-react";
import { useRecorder } from "@/hooks/use-recorder";
import { useAnnotations } from "@/hooks/use-annotations";
import { canRecordAtAll, canCaptureScreen } from "@/lib/recorder-utils";
import { translate, isRtl, type Lang } from "@/lib/i18n";
import {
  type ShortcutMap,
  DEFAULT_SHORTCUTS,
  loadShortcuts,
  eventToBinding,
} from "@/lib/shortcuts";
import { Header } from "@/components/recorder/header";
import { Hero } from "@/components/recorder/hero";
import { ControlPanel } from "@/components/recorder/control-panel";
import { PresetsBar } from "@/components/recorder/presets-bar";
import { LivePreview } from "@/components/recorder/live-preview";
import { FinalRecording } from "@/components/recorder/final-recording";
import { SnapshotsGallery } from "@/components/recorder/snapshots-gallery";
import { ClipsGallery } from "@/components/recorder/clips-gallery";
import { StatsSummary } from "@/components/recorder/stats-summary";
import { ProfilingPanel } from "@/components/recorder/profiling-panel";
import { HistoryPanel } from "@/components/recorder/history-panel";
import { AnnotationToolbar } from "@/components/recorder/annotation-toolbar";
import { Scheduler } from "@/components/recorder/scheduler";
import { HelpSection } from "@/components/recorder/help-section";
import { Footer } from "@/components/recorder/footer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const LANG_KEY = "wpr-lang-v1";

function loadLang(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    const v = window.localStorage.getItem(LANG_KEY);
    return v === "ar" || v === "en" ? v : "en";
  } catch (err) {
    console.error("[loadLang] Failed to read lang from localStorage:", err);
    return "en";
  }
}

function saveLang(l: Lang): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LANG_KEY, l);
  } catch (err) {
    console.error("[saveLang] Failed to persist lang to localStorage:", err);
  }
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("en");
  const [shortcuts, setShortcuts] = useState<ShortcutMap>(DEFAULT_SHORTCUTS);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const annotations = useAnnotations();
  const rec = useRecorder(lang, canvasRef, annotations.drawAnnotations);
  const { toast } = useToast();
  const { setTheme, resolvedTheme } = useTheme();
  // Round 9: auto-stop + scheduler toggle state
  const [autoStopMs, setAutoStopMs] = useState<number>(0); // 0 = disabled
  const [schedulerEnabled, setSchedulerEnabled] = useState(false);
  // Refs for keyboard handler access
  const annotationsRef = useRef(annotations);
  useEffect(() => {
    annotationsRef.current = annotations;
  }, [annotations]);
  const recRef = useRef(rec);
  useEffect(() => {
    recRef.current = rec;
  }, [rec]);
  // Load persisted language + shortcuts on mount (client-only to avoid hydration mismatch).
  useEffect(() => {
    const persisted = loadLang();
    if (persisted !== "en") setLang(persisted);
    setShortcuts(loadShortcuts());
  }, []);

  const t = useCallback((key: string) => translate(lang, key), [lang]);

  const toggleLang = useCallback(() => {
    setLang((l) => {
      const next = l === "en" ? "ar" : "en";
      saveLang(next);
      return next;
    });
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

  // Keyboard shortcuts (global, configurable). Ignores typing in inputs/selects/textareas.
  // Uses refs for rec/toggleLang/toggleTheme to avoid re-subscribing on every render
  // (rec changes 4x/second during recording due to elapsed timer updates).
  const shortcutsRef = useRef(shortcuts);
  const toggleLangRef = useRef(toggleLang);
  const toggleThemeRef = useRef(toggleTheme);
  useEffect(() => { shortcutsRef.current = shortcuts; }, [shortcuts]);
  useEffect(() => { toggleLangRef.current = toggleLang; }, [toggleLang]);
  useEffect(() => { toggleThemeRef.current = toggleTheme; }, [toggleTheme]);

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

      const r = recRef.current;

      // Escape always stops recording (not customizable).
      if (e.key === "Escape") {
        if (r.isRecording || r.isPaused) {
          r.stopRecording();
        }
        return;
      }

      const binding = eventToBinding(e);
      const matches = (action: keyof ShortcutMap) => {
        const b = shortcutsRef.current[action];
        return b.combo === binding.combo && b.mod === binding.mod;
      };

      if (matches("startStop")) {
        e.preventDefault();
        if (r.isRecording) r.pauseRecording();
        else if (r.isPaused) r.resumeRecording();
        else if (r.canStart) void r.startRecording();
      } else if (matches("pauseResume")) {
        e.preventDefault();
        if (r.isRecording) r.pauseRecording();
        else if (r.isPaused) r.resumeRecording();
      } else if (matches("reset")) {
        e.preventDefault();
        if (!r.isRecording && !r.isPaused) r.resetAll();
      } else if (matches("toggleLang")) {
        e.preventDefault();
        toggleLangRef.current();
      } else if (matches("toggleTheme")) {
        e.preventDefault();
        toggleThemeRef.current();
      } else if (matches("toggleWebcam")) {
        e.preventDefault();
        r.toggleWebcam(!r.settings.webcamEnabled);
      } else if (matches("toggleMic")) {
        e.preventDefault();
        r.updateSettings("micEnabled", !r.settings.micEnabled);
      } else if (matches("toggleAnnotations")) {
        e.preventDefault();
        if (r.isRecording || r.isPaused) {
          annotationsRef.current.updateSettings("enabled", !annotationsRef.current.settings.enabled);
        }
      } else if (matches("toggleScheduler")) {
        e.preventDefault();
        setSchedulerEnabled((v) => !v);
      } else if (matches("captureSnapshot")) {
        e.preventDefault();
        if (r.isRecording || r.isPaused) r.captureSnapshot();
      } else if (matches("captureClip")) {
        e.preventDefault();
        if (r.isRecording || r.isPaused) r.captureClip();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []); // Stable — uses refs for all mutable values

  // Round 9: auto-stop effect — stop recording when elapsed reaches the limit.
  useEffect(() => {
    if (autoStopMs <= 0 || !rec.isRecording) return;
    if (rec.elapsed * 1000 >= autoStopMs) {
      rec.stopRecording();
      setAutoStopMs(0);
      toast({ description: t("autoStopTriggered") });
    }
  }, [autoStopMs, rec.isRecording, rec.elapsed, rec.stopRecording, t, toast]);

  // Browser recommendation banner
  const [showBanner, setShowBanner] = useState(false);
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const ua = navigator.userAgent;
    const chromium = /Chrom(e|ium)/.test(ua) || /Edg/.test(ua);
    setShowBanner(!chromium);
  }, []);

  // Only block the app if the browser can't do ANY recording at all
  // (no getUserMedia or no MediaRecorder). Screen capture (getDisplayMedia)
  // is optional — we don't pre-block it; the app will show a graceful error
  // at recording time if screen capture is truly unavailable.
  const unsupported =
    rec.features && !canRecordAtAll(rec.features);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header
        lang={lang}
        onToggleLang={toggleLang}
        t={t}
        shortcuts={shortcuts}
        onShortcutsChange={setShortcuts}
        onShortcutsReset={() => setShortcuts(DEFAULT_SHORTCUTS)}
      />

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

      {/* Unsupported blocker — only shown if browser can't do ANY recording */}
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
        {/* Presets bar — full width above the two-column layout */}
        <div className="mb-6">
          <PresetsBar rec={rec} lang={lang} t={t} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(340px,400px)_1fr]">
          {/* Left: control panel + scheduler */}
          <div className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1 scroll-thin">
            <ControlPanel rec={rec} lang={lang} t={t} />
            <div className="mt-4">
              <Scheduler
                lang={lang}
                t={t}
                isRecording={rec.isRecording}
                isPaused={rec.isPaused}
                canStart={rec.canStart}
                onStartNow={() => void rec.startRecording()}
                onStop={() => rec.stopRecording()}
                enabled={schedulerEnabled}
                onEnabledChange={setSchedulerEnabled}
                onAutoStopChange={setAutoStopMs}
                elapsed={rec.elapsed}
              />
            </div>
          </div>

          {/* Right: preview + galleries + final + stats + profiling + history */}
          <div className="flex flex-col gap-6">
            <LivePreview
              rec={rec}
              lang={lang}
              t={t}
              canvasRef={canvasRef}
              annotations={annotations}
            />
            {(rec.isRecording || rec.isPaused) && annotations.settings.enabled && (
              <div className="flex items-center justify-between gap-2">
                <AnnotationToolbar
                  annotations={annotations}
                  lang={lang}
                  t={t}
                  disabled={!annotations.settings.enabled}
                />
              </div>
            )}
            <ProfilingPanel rec={rec} lang={lang} t={t} />
            <ClipsGallery rec={rec} lang={lang} t={t} />
            <SnapshotsGallery rec={rec} lang={lang} t={t} />
            <FinalRecording rec={rec} lang={lang} t={t} />
            <StatsSummary rec={rec} lang={lang} t={t} />
            <HistoryPanel rec={rec} lang={lang} t={t} />
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
