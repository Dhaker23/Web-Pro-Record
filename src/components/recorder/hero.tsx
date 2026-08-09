"use client";

import { ShieldCheck, Cpu, Sparkles, UserRound } from "lucide-react";

type Props = {
  t: (key: string) => string;
};

export function Hero({ t }: Props) {
  const trust = [
    { icon: ShieldCheck, title: t("trustNoUpload"), desc: t("trustNoUploadDesc") },
    { icon: Cpu, title: t("trustLocal"), desc: t("trustLocalDesc") },
    { icon: Sparkles, title: t("trustNoAi"), desc: t("trustNoAiDesc") },
    { icon: UserRound, title: t("trustNoAccount"), desc: t("trustNoAccountDesc") },
  ];

  return (
    <section className="hero-aura relative overflow-hidden border-b border-border/50">
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="glass-chip chip-in inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-primary">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            {t("heroBadge")}
          </span>
          <h1 className="mt-5 text-balance bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl md:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("heroSubtitle")}
          </p>
        </div>

        {/* Trust indicators */}
        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {trust.map((item) => (
            <div
              key={item.title}
              className="group relative overflow-hidden rounded-xl border border-border/60 bg-card/60 p-3.5 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent/40 hover:shadow-md sm:p-4"
            >
              <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <item.icon className="size-5 text-primary transition-transform group-hover:scale-110" strokeWidth={2} />
              <div className="mt-2 text-sm font-semibold">{item.title}</div>
              <div className="mt-0.5 text-xs leading-snug text-muted-foreground">
                {item.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Onboarding steps */}
        <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-border/60 bg-card/40 p-4 backdrop-blur-sm sm:p-5">
          <div className="mb-3 text-sm font-semibold">{t("onboardTitle")}</div>
          <ol className="grid gap-2.5 text-sm text-muted-foreground sm:grid-cols-2">
            {[t("onboardStep1"), t("onboardStep2"), t("onboardStep3"), t("onboardStep4")].map(
              (step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="leading-snug">{step.replace(/^\d+\.\s*/, "")}</span>
                </li>
              ),
            )}
          </ol>
        </div>
      </div>
    </section>
  );
}
