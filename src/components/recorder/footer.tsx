"use client";

import { Youtube, Facebook, Mail, MessageCircle, Code2, Heart } from "lucide-react";
import type { Lang } from "@/lib/i18n";

type Props = {
  lang: Lang;
  t: (key: string) => string;
};

export function Footer({ lang, t }: Props) {
  const youtubeUrl = "https://www.youtube.com/@AbdellatifSaidA";
  const facebookUrl = "https://www.facebook.com/profile.php?id=61574287321015";
  const email = "dhakeramarawork@gmail.com";
  const whatsapp = "+21699495558";
  const whatsappUrl = `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`;

  return (
    <footer className="mt-auto border-t border-border/60 bg-background">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-border/80 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Brand + credit line */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <span className="text-sm font-bold">W</span>
              </div>
              <span className="text-base font-bold tracking-tight">{t("brandName")}</span>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {t("footerText")}{" "}
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                <Youtube className="size-3.5" />
                {t("footerYoutube")}
              </a>
              <span className="mx-1.5 text-muted-foreground/50">|</span>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                <Facebook className="size-3.5" />
                {t("footerFacebook")}
              </a>
            </p>

            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Code2 className="size-3.5" />
              {t("footerCodedBy")}{" "}
              <span className="font-semibold text-foreground">Amara Dhaker</span>
              <span className="mx-1 text-muted-foreground/40">·</span>
              <span className="inline-flex items-center gap-0.5">
                {lang === "ar" ? "صُنع بـ" : "Made with"}
                <Heart className="size-3 fill-red-500 text-red-500" />
              </span>
            </p>
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
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-emerald-500"
                >
                  <MessageCircle className="size-4" />
                  {t("footerWhatsapp")}: {whatsapp}
                </a>
              </li>
            </ul>
            <p className="mt-4 text-[11px] text-muted-foreground/60">
              © {new Date().getFullYear()} {t("brandName")}. {t("footerRights")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
