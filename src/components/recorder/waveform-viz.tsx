"use client";

import { useEffect, useRef } from "react";
import { AudioLines } from "lucide-react";
import type { WaveformData } from "@/hooks/use-recorder";
import type { Lang } from "@/lib/i18n";

type Props = {
  waveform: WaveformData;
  active: boolean;
  lang: Lang;
  t: (key: string) => string;
};

/** Real-time microphone waveform visualizer drawn on a canvas. */
export function WaveformViz({ waveform, active, lang, t }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    }

    // Background
    ctx.clearRect(0, 0, w, h);

    // Center line
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    if (!active || waveform.samples.length === 0) {
      // Flat line
      ctx.strokeStyle = "rgba(16,185,129,0.3)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
      return;
    }

    // Waveform
    const samples = waveform.samples;
    const stepX = w / samples.length;
    const midY = h / 2;
    const amp = h / 2 - 2;

    // Filled gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "rgba(16,185,129,0.55)");
    grad.addColorStop(0.5, "rgba(16,185,129,0.25)");
    grad.addColorStop(1, "rgba(16,185,129,0.55)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    for (let i = 0; i < samples.length; i++) {
      const v = (samples[i] - 128) / 128; // -1..1
      const y = midY + v * amp;
      ctx.lineTo(i * stepX, y);
    }
    ctx.lineTo(w, midY);
    ctx.closePath();
    ctx.fill();

    // Stroke on top for crispness
    ctx.strokeStyle = "rgba(52,211,153,0.95)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < samples.length; i++) {
      const v = (samples[i] - 128) / 128;
      const y = midY + v * amp;
      if (i === 0) ctx.moveTo(i * stepX, y);
      else ctx.lineTo(i * stepX, y);
    }
    ctx.stroke();
  }, [waveform, active]);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-[#0b0f10] px-2.5 py-1.5">
      <AudioLines
        className={`size-3.5 shrink-0 ${active ? "text-emerald-400" : "text-muted-foreground/40"}`}
      />
      <canvas
        ref={canvasRef}
        className="h-6 flex-1"
        aria-label={t("waveformMic")}
      />
      <span className="font-mono text-[9px] tabular-nums text-muted-foreground">
        {Math.round(waveform.level * 100)}%
      </span>
    </div>
  );
}

// keep Lang referenced for type clarity
void (undefined as unknown as Lang);
