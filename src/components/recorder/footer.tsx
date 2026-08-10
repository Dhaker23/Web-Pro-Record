"use client";

import { Mail, MessageCircle, Sparkles } from "lucide-react";
import type { Lang } from "@/lib/i18n";

type Props = {
  lang: Lang;
  t: (key: string) => string;
};

export function Footer({ t }: Props) {
  const email = "dhakeramarawork@gmail.com";
  const whatsapp = "+21699495558";
  const whatsappUrl = `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`;

  return (
    <footer className="mt-auto border-t border-border/60 bg-background">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Brand + designer credit */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-fuchsia-500 text-primary-foreground shadow-sm">
                <span className="text-sm font-bold">W</span>
              </div>
              <span className="text-base font-bold tracking-tight">{t("brandName")}</span>
            </div>

            {/* Designer credit line */}
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                {t("footerDesignedBy")}{" "}
                <span className="bg-gradient-to-r from-primary to-fuchsia-500 bg-clip-text font-semibold text-transparent">
                  {t("footerDesignerName")}
                </span>
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground/80">
                {t("footerTagline")}
              </p>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold">{t("footerContact")}</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  <Mail className="size-4" />
                  {email}
                </a>
              </li>
              <li>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  <MessageCircle className="size-4" />
                  {t("footerWhatsapp")}: {whatsapp}
                </a>
              </li>
            </ul>
            <p className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
              <Sparkles className="size-3 text-primary/60" />
              © {new Date().getFullYear()} {t("brandName")}. {t("footerRights")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
