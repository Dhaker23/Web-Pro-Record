// Recording presets — quick-configure common scenarios.
import type { RecorderSettings } from "@/hooks/use-recorder";
import type { OutputQuality } from "@/lib/recorder-utils";
import type { FrameRate } from "@/lib/i18n";

export type PresetId = "gaming" | "presentation" | "tutorial" | "minimal";

export type Preset = {
  id: PresetId;
  /** Partial settings applied on top of the current settings. */
  settings: Partial<RecorderSettings>;
};

export const PRESETS: Preset[] = [
  {
    id: "gaming",
    settings: {
      quality: "native",
      frameRate: "60",
      videoBitrate: 16_000_000,
      audioBitrate: 192_000,
      webcamEnabled: false,
      micEnabled: true,
      systemAudioEnabled: true,
      adaptiveFps: true,
    },
  },
  {
    id: "presentation",
    settings: {
      quality: "1080",
      frameRate: "30",
      videoBitrate: 6_000_000,
      audioBitrate: 128_000,
      webcamEnabled: false,
      micEnabled: true,
      systemAudioEnabled: false,
      adaptiveFps: false,
    },
  },
  {
    id: "tutorial",
    settings: {
      quality: "1080",
      frameRate: "30",
      videoBitrate: 6_000_000,
      audioBitrate: 128_000,
      webcamEnabled: true,
      micEnabled: true,
      systemAudioEnabled: false,
      webcamShape: "rounded",
      webcamPosition: "bottom-right",
      webcamSize: 22,
      adaptiveFps: false,
    },
  },
  {
    id: "minimal",
    settings: {
      quality: "720",
      frameRate: "24",
      videoBitrate: 3_500_000,
      audioBitrate: 96_000,
      webcamEnabled: false,
      micEnabled: false,
      systemAudioEnabled: false,
      adaptiveFps: false,
    },
  },
];

/** Detect which preset (if any) matches the current settings. */
export function detectPreset(settings: RecorderSettings): PresetId | "custom" {
  for (const preset of PRESETS) {
    const matches = Object.entries(preset.settings).every(([key, value]) => {
      return settings[key as keyof RecorderSettings] === value;
    });
    if (matches) return preset.id;
  }
  return "custom";
}

export { type OutputQuality, type FrameRate };
