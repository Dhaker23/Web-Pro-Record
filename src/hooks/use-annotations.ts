"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AnnotationTool = "pen" | "highlighter" | "arrow" | "text" | "eraser";

export type AnnotationStroke = {
  tool: AnnotationTool;
  color: string;
  size: number;
  points: { x: number; y: number }[];
  text?: string;
};

export type AnnotationSettings = {
  enabled: boolean;
  tool: AnnotationTool;
  color: string;
  size: number;
};

export const DEFAULT_ANNOTATION_SETTINGS: AnnotationSettings = {
  enabled: false,
  tool: "pen",
  color: "#ef4444",
  size: 4,
};

export const ANNOTATION_COLORS = [
  "#ef4444", // red
  "#f59e0b", // amber
  "#10b981", // emerald
  "#3b82f6", // blue
  "#a855f7", // purple
  "#ffffff", // white
  "#000000", // black
];

/** Hook managing annotation state + drawing on a canvas context.
 *  Coordinates are in canvas pixels (0..canvas.width / 0..canvas.height). */
export function useAnnotations() {
  const [settings, setSettings] = useState<AnnotationSettings>(DEFAULT_ANNOTATION_SETTINGS);
  const [strokes, setStrokes] = useState<AnnotationStroke[]>([]);
  const [activeStroke, setActiveStroke] = useState<AnnotationStroke | null>(null);
  const [textCursor, setTextCursor] = useState<{ x: number; y: number } | null>(null);
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const updateSettings = useCallback(<K extends keyof AnnotationSettings>(key: K, value: AnnotationSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearAll = useCallback(() => {
    setStrokes([]);
    setActiveStroke(null);
    setTextCursor(null);
  }, []);

  const undo = useCallback(() => {
    setStrokes((prev) => prev.slice(0, -1));
  }, []);

  /** Start a new stroke at the given point (canvas coords). */
  const beginStroke = useCallback((x: number, y: number) => {
    const s = settingsRef.current;
    if (!s.enabled) return;
    if (s.tool === "text") {
      setTextCursor({ x, y });
      return;
    }
    const stroke: AnnotationStroke = {
      tool: s.tool,
      color: s.color,
      size: s.size,
      points: [{ x, y }],
    };
    setActiveStroke(stroke);
  }, []);

  /** Continue the active stroke (pen/highlighter/eraser). */
  const moveStroke = useCallback((x: number, y: number) => {
    const s = settingsRef.current;
    if (!s.enabled || s.tool === "text") return;
    setActiveStroke((prev) => {
      if (!prev) return prev;
      return { ...prev, points: [...prev.points, { x, y }] };
    });
  }, []);

  /** End the active stroke and commit it. */
  const endStroke = useCallback(() => {
    setActiveStroke((prev) => {
      if (prev && prev.points.length > 0) {
        setStrokes((cur) => [...cur, prev]);
      }
      return null;
    });
  }, []);

  /** Commit typed text at the cursor position. */
  const commitText = useCallback((text: string) => {
    if (!textCursor || !text.trim()) {
      setTextCursor(null);
      return;
    }
    const s = settingsRef.current;
    const stroke: AnnotationStroke = {
      tool: "text",
      color: s.color,
      size: s.size,
      points: [textCursor],
      text: text.trim(),
    };
    setStrokes((cur) => [...cur, stroke]);
    setTextCursor(null);
  }, [textCursor]);

  const cancelText = useCallback(() => {
    setTextCursor(null);
  }, []);

  /** Draw all committed strokes + the active one onto a canvas context. */
  const drawAnnotations = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const all = activeStroke ? [...strokes, activeStroke] : strokes;
      for (const stroke of all) {
        if (stroke.points.length === 0) continue;
        ctx.save();
        if (stroke.tool === "highlighter") {
          ctx.globalAlpha = 0.35;
          ctx.lineWidth = stroke.size * 3;
          ctx.strokeStyle = stroke.color;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          const p0 = stroke.points[0];
          ctx.moveTo(p0.x, p0.y);
          for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
          }
          ctx.stroke();
        } else if (stroke.tool === "pen") {
          ctx.globalAlpha = 1;
          ctx.lineWidth = stroke.size;
          ctx.strokeStyle = stroke.color;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          const p0 = stroke.points[0];
          ctx.moveTo(p0.x, p0.y);
          for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
          }
          ctx.stroke();
        } else if (stroke.tool === "eraser") {
          ctx.globalCompositeOperation = "destination-out";
          ctx.lineWidth = stroke.size * 4;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          const p0 = stroke.points[0];
          ctx.moveTo(p0.x, p0.y);
          for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
          }
          ctx.stroke();
        } else if (stroke.tool === "arrow") {
          ctx.globalAlpha = 1;
          ctx.lineWidth = stroke.size;
          ctx.strokeStyle = stroke.color;
          ctx.fillStyle = stroke.color;
          ctx.lineCap = "round";
          if (stroke.points.length >= 2) {
            const p0 = stroke.points[0];
            const p1 = stroke.points[stroke.points.length - 1];
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.stroke();
            // Arrowhead
            const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
            const headLen = Math.max(12, stroke.size * 4);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(
              p1.x - headLen * Math.cos(angle - Math.PI / 6),
              p1.y - headLen * Math.sin(angle - Math.PI / 6),
            );
            ctx.lineTo(
              p1.x - headLen * Math.cos(angle + Math.PI / 6),
              p1.y - headLen * Math.sin(angle + Math.PI / 6),
            );
            ctx.closePath();
            ctx.fill();
          }
        } else if (stroke.tool === "text" && stroke.text) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = stroke.color;
          const fontSize = Math.max(16, stroke.size * 6);
          ctx.font = `600 ${fontSize}px var(--font-geist-sans), sans-serif`;
          ctx.textBaseline = "top";
          ctx.fillText(stroke.text, stroke.points[0].x, stroke.points[0].y);
        }
        ctx.restore();
      }
      // Draw text cursor indicator
      if (textCursor) {
        ctx.save();
        ctx.fillStyle = settingsRef.current.color;
        ctx.fillRect(textCursor.x, textCursor.y, 2, Math.max(16, settingsRef.current.size * 6));
        ctx.restore();
      }
    },
    [strokes, activeStroke, textCursor],
  );

  /** Round 10: Export all strokes as a JSON string. */
  const exportJson = useCallback((): string => {
    return JSON.stringify(
      {
        app: "Web Pro Record",
        type: "annotations",
        exportedAt: new Date().toISOString(),
        strokeCount: strokes.length,
        strokes,
      },
      null,
      2,
    );
  }, [strokes]);

  /** Round 10: Download annotations as a JSON file. */
  const downloadJson = useCallback(() => {
    const json = exportJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.download = `wpr-annotations-${ts}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportJson]);

  /** Round 10: Import annotations from a JSON string. Returns true on success. */
  const importJson = useCallback((json: string): boolean => {
    try {
      const parsed = JSON.parse(json) as { strokes?: AnnotationStroke[] };
      if (!parsed.strokes || !Array.isArray(parsed.strokes)) return false;
      // Basic validation of stroke shape.
      const valid = parsed.strokes.filter(
        (st) =>
          st &&
          typeof st.tool === "string" &&
          typeof st.color === "string" &&
          typeof st.size === "number" &&
          Array.isArray(st.points),
      ) as AnnotationStroke[];
      setStrokes(valid);
      return valid.length > 0;
    } catch {
      return false;
    }
  }, []);

  /** Round 10: Import annotations from a File (e.g., from an <input type=file>). */
  const importFromFile = useCallback(async (file: File): Promise<boolean> => {
    try {
      const text = await file.text();
      return importJson(text);
    } catch {
      return false;
    }
  }, [importJson]);

  return {
    settings,
    strokes,
    activeStroke,
    textCursor,
    updateSettings,
    clearAll,
    undo,
    beginStroke,
    moveStroke,
    endStroke,
    commitText,
    cancelText,
    drawAnnotations,
    exportJson,
    downloadJson,
    importJson,
    importFromFile,
  };
}

export type UseAnnotations = ReturnType<typeof useAnnotations>;
