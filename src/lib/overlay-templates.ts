// Webcam overlay templates — pre-designed border/shadow styles.

export type OverlayTemplateId = "classic" | "neon" | "minimal" | "polaroid";

export type OverlayTemplate = {
  id: OverlayTemplateId;
  /** Settings applied when the template is selected. */
  settings: {
    webcamShape: "rounded" | "circle";
    webcamBorder: boolean;
    webcamShadow: boolean;
    webcamMargin: number;
  };
};

export const OVERLAY_TEMPLATES: OverlayTemplate[] = [
  {
    id: "classic",
    settings: {
      webcamShape: "rounded",
      webcamBorder: true,
      webcamShadow: true,
      webcamMargin: 24,
    },
  },
  {
    id: "neon",
    settings: {
      webcamShape: "rounded",
      webcamBorder: true,
      webcamShadow: true,
      webcamMargin: 20,
    },
  },
  {
    id: "minimal",
    settings: {
      webcamShape: "rounded",
      webcamBorder: false,
      webcamShadow: true,
      webcamMargin: 28,
    },
  },
  {
    id: "polaroid",
    settings: {
      webcamShape: "rounded",
      webcamBorder: true,
      webcamShadow: true,
      webcamMargin: 32,
    },
  },
];

/** Detect which template (if any) matches the current overlay settings. */
export function detectTemplate(settings: {
  webcamShape: "rounded" | "circle";
  webcamBorder: boolean;
  webcamShadow: boolean;
  webcamMargin: number;
}): OverlayTemplateId | "custom" {
  for (const tpl of OVERLAY_TEMPLATES) {
    const matches = Object.entries(tpl.settings).every(([key, value]) => {
      return settings[key as keyof typeof settings] === value;
    });
    if (matches) return tpl.id;
  }
  return "custom";
}
