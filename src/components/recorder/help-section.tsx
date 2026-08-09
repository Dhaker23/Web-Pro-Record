"use client";

import { Check, X, Info, Monitor, Mic, Video, Square, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UseRecorder } from "@/hooks/use-recorder";
import type { Lang } from "@/lib/i18n";

type Props = {
  rec: UseRecorder;
  lang: Lang;
  t: (key: string) => string;
};

export function HelpSection({ rec, lang, t }: Props) {
  const f = rec.features;
  const rows = [
    { icon: Monitor, label: t("helpSupportsDisplay"), ok: !!f?.getDisplayMedia },
    { icon: Mic, label: t("helpSupportsUser"), ok: !!f?.getUserMedia },
    { icon: Video, label: t("helpSupportsRecorder"), ok: !!f?.mediaRecorder },
    { icon: Square, label: t("helpSupportsCanvas"), ok: !!f?.canvasCapture },
  ];
  const notes = [t("helpNote1"), t("helpNote2"), t("helpNote3"), t("helpNote4"), t("helpNote5")];

  return (
    <section className="border-t border-border/60 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Feature support — tech-spec grid */}
          <div>
            <h2 className="text-lg font-semibold">{t("helpTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("helpDesc")}</p>

            <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
              <div className="flex items-center gap-3 border-b border-border/50 bg-muted/40 px-4 py-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("helpSupportsTitle")}
                </span>
              </div>
              <ul className="zebra-list">
                {rows.map((row) => (
                  <li
                    key={row.label}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/30"
                  >
                    <row.icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="mono-label flex-1 text-foreground/90">{row.label}</span>
                    {row.ok ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <Check className="size-3" />
                        {t("helpSupported")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-600 dark:text-red-400">
                        <X className="size-3" />
                        {t("helpUnsupported")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-base font-semibold">{t("helpNotes")}</h3>
            <ul className="mt-3 space-y-2">
              {notes.map((n, i) => (
                <li
                  key={i}
                  className="group flex items-start gap-3 rounded-xl border border-border/50 bg-card/60 p-3 text-sm leading-relaxed transition-colors hover:border-primary/30 hover:bg-accent/30"
                >
                  <Info className="mt-0.5 size-4 shrink-0 text-primary transition-transform group-hover:scale-110" />
                  <span className="text-muted-foreground">{n}</span>
                </li>
              ))}
            </ul>

            {f && !f.isSecureContext && (
              <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <span className="text-amber-700 dark:text-amber-300">
                  {lang === "ar"
                    ? "هذه الصفحة لا تعمل في سياق غير آمن. يجب استخدام HTTPS أو localhost."
                    : "This page won't work in an insecure context. Serve over HTTPS or localhost."}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// keep cn import used (avoids unused lint in some setups)
void cn;
