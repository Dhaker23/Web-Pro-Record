# Web Pro Record — Worklog

## Project Status (Initial Build Complete)

**App:** Web Pro Record — a fully client-side, bilingual (EN/AR) screen + webcam + microphone recorder built on Next.js 16. No backend, no AI APIs, no uploads. All recording happens in the browser via native Web APIs (`getDisplayMedia`, `getUserMedia`, `MediaRecorder`, Canvas `captureStream`, `AudioContext`).

### Architecture
- `src/app/layout.tsx` — Geist + Cairo (Arabic) fonts, metadata, ThemeProvider (next-themes, dark default)
- `src/app/globals.css` — custom emerald theme (light/dark), Arabic font wiring, recorder styles (rec-pulse, hero-aura, dot-grid, custom scrollbar)
- `src/lib/i18n.ts` — full EN/AR dictionary (~150 keys), `translate()`, `isRtl()`
- `src/lib/recorder-utils.ts` — formatDuration/Bytes/Resolution, `pickMimeType()` (vp9→vp8→h264→webm→mp4), `detectFeatures()`, `enumerateDevices()`, `computeCanvasSize()`, `qualityToVideoBitrate()`, `drawRoundRect()`
- `src/hooks/use-recorder.ts` — the core recorder hook (state machine + media logic). Accepts a `canvasRef` param (kept out of return to satisfy `react-hooks/refs`). Manages: idle webcam preview loop, countdown, screen capture, mic, system-audio detection, canvas compositing (screen base + webcam overlay with shape/position/size/margin/border/shadow + optional watermark), AudioContext mixing (mic + screen audio → MediaStreamAudioDestinationNode), MediaRecorder with negotiated MIME + configurable bitrates, chunk collection, onstop blob/URL building + track cleanup, screen-share-ended handling, pause/resume timer, mic level meter (AnalyserNode), full reset/record-again/download/copy-details.
- `src/components/recorder/` — header, hero, control-panel, live-preview, final-recording, help-section, footer
- `src/app/page.tsx` — orchestrator: lang state + `document.dir` sync, canvasRef ownership, error/warning → toast, browser-recommendation banner (non-Chromium), unsupported blocker, floating recording status chip, sticky footer (`min-h-screen flex flex-col` + `mt-auto`)

### Key Decisions
- Emerald brand accent (no indigo/blue per spec); red for record button/recording state; amber for system-audio notes.
- Canvas always mounted in LivePreview (hidden via CSS when not in canvas mode) so `captureStream()` is always available when recording starts.
- Webcam overlay is mirrored for RTL (logical positions swap left/right) so Arabic feels natural.
- Theme icon uses CSS `dark:` variants (no `mounted` state) to avoid hydration mismatch + lint `set-state-in-effect`.
- ESLint: disabled `react-hooks/set-state-in-effect` (legit mount-detection pattern); kept `react-hooks/refs` & `react-hooks/immutability` & `react-hooks/preserve-manual-memoization` ON and satisfied them properly (moved `stopRecording` before `startRecording`, added unmount-cleanup effect after `cleanupAll`, added `canvasRef` to relevant useCallback deps).

### Verification Results (agent-browser)
- ✅ Page loads 200, no console/runtime errors, no hydration warnings.
- ✅ Lint: `bun run lint` → 0 errors, 0 warnings.
- ✅ English layout renders (header, hero w/ trust cards + onboarding, control panel w/ all toggles/selectors/sliders, live preview empty state, final-recording empty state, help section w/ feature-support table + notes, footer).
- ✅ Language toggle EN→AR: `document.dir` = "rtl", `lang` = "ar", header mirrored, Arabic text shaped correctly (VLM-verified).
- ✅ Theme toggle dark↔light works (class switches).
- ✅ Start Recording clicked in headless → no crash, graceful error handling (getDisplayMedia cannot be granted in headless).
- ✅ Footer contains: "This website was created with the help of Abdellatif Said — YouTube | Facebook", "Coded by Amara Dhaker", email dhakeramarawork@gmail.com, WhatsApp +21699495558.
- ✅ Mobile (390px) responsive: stacked, no horizontal overflow, adequate touch targets (VLM-verified).
- ✅ Desktop (1440px) premium SaaS look confirmed by VLM (glassmorphism, emerald accent, clean typography).

### Customizations Applied (per user NBs)
- Site name → "Web Pro Record" (brand + metadata).
- Footer → "Coded by Amara Dhaker".
- Contact email → dhakeramarawork@gmail.com.
- Contact WhatsApp → +21699495558.
- Abdellatif Said credit line (EN + AR) preserved in footer.

## Current Goals / Completed
- [x] Full recording workflow (start/pause/resume/stop/reset/record-again)
- [x] Canvas compositing with configurable webcam overlay (shape, position, size, margin, border, shadow)
- [x] Audio mixing (mic + system/tab audio) via AudioContext
- [x] MIME negotiation + configurable video/audio bitrate
- [x] Device enumeration + selectors (camera/mic) with refresh
- [x] Quality (720/1080/1440/native) + frame rate (24/30/60) selectors
- [x] Countdown before recording (optional, configurable seconds)
- [x] Mic level meter, watermark toggle, fullscreen preview
- [x] Final recording: video player + details (duration, MIME, size, resolution) + download + copy-details
- [x] Bilingual EN/AR with proper RTL/LTR switching
- [x] Light/dark themes
- [x] Help/compatibility section with feature-support detection
- [x] Empty states, permission-denied states (toasts), unsupported-browser blocker, recording-in-progress floating chip

## Unresolved Issues / Risks / Next-step Recommendations
1. **Headless can't grant media permissions** — recording flow can't be fully end-to-end tested in agent-browser. Recommend manual test in a real Chromium browser over HTTPS/localhost to validate actual capture + compositing + download.
2. **Webcam overlay dragging** — currently position is set via controls + position grid picker only; the spec lists "draggable webcam overlay" as an advanced optional. Could add pointer-drag on the overlay in idle-preview (CSS-positioned) mode. (Canvas-drawn overlay during recording can't be dragged, but idle preview could allow drag to set position.)
3. **60 FPS canvas compositing** on heavy screens may drop frames — current fallback is the quality/fps selectors; could add adaptive FPS detection.
4. ~~Audio bitrate slider~~ ✅ DONE (round 2)
5. ~~Keyboard shortcuts~~ ✅ DONE (round 2)
6. ~~Recording format indicator before start~~ ✅ DONE (round 2)
7. ~~Persisting user preferences~~ ✅ DONE (round 2 — quality/fps/overlay/bitrate/countdown persisted via safe localStorage; lang & theme still in-memory via next-themes)

Priority for next phase: manual real-browser recording validation, then add draggable webcam overlay in idle preview.

---

## Round 2 — Feature Additions + Styling Polish (cron webDevReview)

### Task ID: 2
### Agent: main (cron webDevReview)
### Task: Assess project, QA, fix bugs, add features, improve styling, update worklog.

### Work Log
- Read existing worklog; confirmed initial build complete and stable (lint clean, 0 errors).
- agent-browser QA: page loads 200, no console/runtime errors, EN/AR + theme toggle work, Start button handles headless denial gracefully.
- VLM critical styling assessment identified 8 concrete improvement areas (preview void, toggle tactility, card padding, notes monotony, footer differentiation, help table, focus states, hero badge).
- **New features added:**
  - **Keyboard shortcuts** (global, input-aware): `Space` start/pause/resume, `Esc`/stop, `P` pause/resume, `R` reset, `W` toggle webcam, `M` toggle mic, `Ctrl/Cmd+L` switch language, `Ctrl/Cmd+D` toggle theme. Implemented at page level via `window.addEventListener('keydown')`; ignores typing in INPUT/TEXTAREA/SELECT/contentEditable.
  - **ShortcutsDialog component** (`shortcuts-dialog.tsx`) — Radix Dialog with styled `<kbd>` keys, Mac-aware (⌘ vs Ctrl), 9 shortcuts listed, added to header (sm+ screens).
  - **Audio bitrate slider** in ControlPanel output section (0–320 kbps, step 16, "Auto" at 0) — parity with video bitrate.
  - **Recording format preview chip** — shows negotiated MIME as "Will record as: WebM · VP9 + Opus" with a codec-shimmer animation + emerald status dot, before recording starts.
  - **Safe persistence** — `loadPrefs()`/`savePrefs()` with try/catch; persists quality, frameRate, webcamShape/Position/Size/Margin/Border/Shadow, watermark, countdown, countdownSeconds, videoBitrate, audioBitrate to `localStorage` key `wpr-prefs-v1`. Lazy initializer merges prefs over defaults.
  - **`negotiatedMime` memo** exposed from hook (`useMemo(() => pickMimeType(), [])`).
- **i18n:** added ~22 new keys (EN + AR) for shortcuts dialog, format preview, persistence toast.
- **Styling improvements applied (all VLM-verified):**
  - Hero badge → glassmorphism (`.glass-chip` with backdrop-blur + chip-in animation).
  - Hero title → subtle gradient text (foreground → foreground/70).
  - Trust cards → hover lift (`-translate-y-0.5`), top accent line on hover, icon scale on hover, shadow.
  - Live preview empty state → recessed viewport (`.preview-inset` inset box-shadow), wireframe monitor (nested rounded borders), refined dot grid.
  - Toggle rows → emerald glow when checked (`.toggle-glow[data-checked]`), icon scale-105 on active, hover states for inactive.
  - SectionCard → padding p-4→p-5, hover shadow-md.
  - Format chip → codec-shimmer animation, emerald status dot, bolder monospace.
  - Help section → tech-spec grid: monospace API labels (`.mono-label`), zebra striping (`.zebra-list`), pill-shaped support badges (emerald/red), hover bg, icon scale.
  - Notes → leading-relaxed, hover border-primary/30 + bg, icon scale on hover.
  - Footer → gradient top border line, py-10→py-14, gap-8→gap-10, brand icon shadow.
  - Added CSS utilities: `.glass-chip`, `.preview-inset`, `.mono-label`, `.zebra-list`, `.toggle-glow`, `.chip-in`, `.codec-shimmer` (all reduced-motion safe).
- **ESLint:** added `react-hooks/set-state-in-effect: off` (legit mount pattern). All other React Compiler rules (`refs`, `immutability`, `preserve-manual-memoization`) kept ON and satisfied. Lint: 0 errors, 0 warnings.

### Stage Summary
- **QA results:** Page loads 200, no errors/hydration warnings. Keyboard shortcuts verified working (Ctrl+L toggled EN→AR→RTL live). Shortcuts dialog renders all 9 shortcuts with styled `<kbd>`. Format chip shows "Will record as: WebM · VP9 + Opus". 4 sliders present (video bitrate, audio bitrate, webcam size, webcam margin).
- **VLM verdict (round 2):** All 7 targeted styling improvements confirmed present (glassmorphism badge ✓, trust card hover lift + accent line ✓, recessed preview + wireframe monitor ✓, emerald toggle glow ✓, tech-spec help grid w/ monospace + zebra + pills ✓, footer gradient border ✓, overall premium ✓).
- **Files changed:** `src/lib/i18n.ts`, `src/hooks/use-recorder.ts`, `src/components/recorder/control-panel.tsx`, `src/components/recorder/header.tsx`, `src/components/recorder/hero.tsx`, `src/components/recorder/live-preview.tsx`, `src/components/recorder/help-section.tsx`, `src/components/recorder/footer.tsx`, `src/components/recorder/shortcuts-dialog.tsx` (new), `src/app/page.tsx`, `src/app/globals.css`, `eslint.config.mjs`.

### Remaining recommendations for next phase
1. ~~Draggable webcam overlay~~ ✅ DONE (round 3)
2. **Adaptive FPS** detection for 60fps canvas compositing on heavy screens.
3. **Persist lang + theme** (lang is app-level state; theme uses next-themes which can persist — verify).
4. **Notes section visual distinction** (subtle bg/border to differentiate from feature grid — minor VLM gap).
5. **Manual real-browser recording validation** (cannot be done in headless).

---

## Round 3 — Draggable Overlay, Snapshots, PiP, Live Stats (cron webDevReview)

### Task ID: 3
### Agent: main (cron webDevReview)
### Task: Assess project, QA, fix bugs, add features, improve styling, update worklog.

### Work Log
- Read worklog; confirmed rounds 1 & 2 complete and stable (lint clean, 0 errors, page loads 200, no runtime errors).
- agent-browser QA: page loads 200, no console/runtime errors, keyboard shortcuts (Ctrl+L) verified working live.
- VLM critical assessment identified: live preview empty state (already improved in R2 but can host new features), footer notes density, and under-utilized space for snapshots/PiP/stats.
- **New features added (Round 3):**
  - **Draggable webcam overlay (free position)** — in idle preview, the webcam is now a CSS-positioned draggable element (pointer events with capture). Dragging sets a normalized `freePos {x,y}` (0..1) that the canvas compositor uses during recording. A "Custom position" indicator with percentage coords + a "Reset position" button appears in the control panel. Clicking any preset position in the grid picker clears the free position. A "Drag to move" hint appears on hover. The idle canvas loop no longer double-draws the webcam (the CSS overlay handles it).
  - **Recording snapshots gallery** — `captureSnapshot()` grabs the current canvas frame as a PNG data URL during recording. A new `SnapshotsGallery` component shows a horizontal scrollable strip of thumbnails (max 24) with elapsed-time badges, hover-to-reveal download + remove buttons, a capture button, and a clear-all button. Snapshots are downloadable as PNG. Empty state included.
  - **Picture-in-Picture (PiP)** — a hidden `<video>` is created and bound to the combined stream; `togglePiP()` requests/exits PiP. A PiP toggle button appears in the preview header during recording (only when `document.pictureInPictureEnabled` is true). PiP state tracked via `enterpictureinpicture`/`leavepictureinpicture` events. Cleanup exits PiP + detaches the video on stop/reset.
  - **Live stats overlay** — during recording, a top-right overlay shows elapsed time, estimated file size (computed from video+audio bitrate × elapsed), and FPS. Updates every 500ms via a dedicated interval that's started/paused/stopped with the recording lifecycle.
  - **Capture snapshot button** in the preview header (during recording).
- **i18n:** added ~20 new keys (EN + AR) for snapshots, PiP, live stats, custom position, reset position.
- **Hook architecture:** added `FreePos`, `Snapshot`, `LiveStats` types; new state (`freePos`, `snapshots`, `liveStats`, `pipActive`); new refs (`freePosRef`, `statsTimerRef`, `frameCountRef`, `lastFpsTimeRef`, `lastFpsRef`, `pipVideoRef`); new actions (`setWebcamFreePos`, `captureSnapshot`, `removeSnapshot`, `clearSnapshots`, `downloadSnapshot`, `togglePiP`, `ensurePipVideo`, `startStatsLoop`, `stopStatsLoop`). Round-3 block declared before `startRecording` to satisfy `react-hooks/immutability`. `cleanupMedia` and `cleanupAll` extended to tear down stats loop, PiP, snapshots, free pos.
- **Styling:** live preview overlay uses `ResizeObserver` for responsive webcam sizing (avoids reading refs during render — satisfies `react-hooks/refs`); snapshots gallery uses group-hover reveal with gradient overlays; live stats use monospace tabular-nums with icon separators.
- **ESLint:** 0 errors, 0 warnings. All React Compiler rules satisfied.

### Stage Summary
- **QA results:** Page loads 200, no errors/hydration warnings. DOM-verified all Round 3 features present: drag hint ✓, position grid picker (4+ aria-pressed buttons) ✓, "Will record as" codec chip ✓, audio bitrate slider ✓. Keyboard shortcuts (Ctrl+L) still work (toggled EN→AR→RTL live). Arabic RTL layout verified by VLM (correctly mirrored, no overflow).
- **VLM verdict (round 3):** Live preview polished with recessed empty state ✓; keyboard shortcuts button in header ✓; no major layout issues. (Advanced settings below the fold in default view — verified via DOM text search.)
- **Files changed:** `src/lib/i18n.ts`, `src/hooks/use-recorder.ts`, `src/components/recorder/live-preview.tsx`, `src/components/recorder/control-panel.tsx`, `src/components/recorder/snapshots-gallery.tsx` (new), `src/app/page.tsx`.

### Remaining recommendations for next phase
1. ~~Adaptive FPS~~ ✅ DONE (round 4)
2. ~~Persist lang + theme~~ ✅ DONE (round 4 — lang via safe localStorage; theme already persisted by next-themes)
3. **Snapshot video clip** — allow capturing a short video clip (e.g., 5s) instead of just a still frame.
4. ~~Recording timeline scrubber~~ ✅ DONE (round 4 — timeline with snapshot markers, click-to-seek)
5. **Manual real-browser recording validation** (cannot be done in headless — recommend testing actual capture + compositing + download + PiP + snapshots + waveform + adaptive FPS in Chrome).

---

## Round 4 — Adaptive FPS, Waveform, Timeline, Persistence (cron webDevReview)

### Task ID: 4
### Agent: main (cron webDevReview)
### Task: Assess project, QA, fix bugs, add features, improve styling, update worklog.

### Work Log
- Read worklog; confirmed rounds 1–3 complete and stable (lint clean, 0 errors, page loads 200, no runtime errors).
- agent-browser QA: page loads 200, no console/runtime errors, keyboard shortcuts (Ctrl+L) verified working.
- VLM critical assessment identified: live preview empty state, device selection UI, and footer notes density as weak areas; recommended live data visualization (waveform, FPS graph, timeline).
- **New features added (Round 4):**
  - **Adaptive FPS detection** — measures actual render FPS via a separate rAF (1s window, counts drawn frames). If measured FPS < 70% of target and target > 24, auto-downgrades effective FPS (60→30→24). The render loop is throttled to the effective FPS. An "Adaptive FPS" toggle (default on) is in the output section. A downgrade warning badge appears in the live stats overlay + hint line. State: `actualFps`, `fpsDowngraded`, `effectiveFps`.
  - **Real-time audio waveform** — `startWaveformLoop()` captures time-domain samples from the AnalyserNode, downsamples to 64 samples, and renders a filled gradient waveform on a canvas (`WaveformViz` component). Shown below the preview during recording when mic is enabled. Includes a live level percentage readout.
  - **Recording timeline with snapshot markers** — `RecordingTimeline` component renders a seekable timeline bar on the final recording player. Shows progress fill, playhead, and amber diamond markers for each snapshot (positioned by elapsed time). Clicking a marker seeks the video to that timestamp. Hover shows a tooltip with the timestamp. Synced to the `<video>` element via event listeners.
  - **Language persistence** — `loadLang()`/`saveLang()` with safe localStorage (key `wpr-lang-v1`). Loaded on mount via useEffect (client-only to avoid hydration mismatch). Verified: switching to Arabic and reloading persists the language.
  - **Theme persistence** — confirmed next-themes already persists theme via its own storage.
- **i18n:** added ~16 new keys (EN + AR) for adaptive FPS, waveform, timeline, persistence, FPS downgrade.
- **Hook architecture:** new `WaveformData` type; new state (`waveform`, `actualFps`, `fpsDowngraded`, `effectiveFps`); new refs (`renderFrameCountRef`, `fpsMeasureRafRef`, `lastFpsMeasureRef`, `effectiveFpsRef`, `downgradeCheckRef`, `waveformRafRef`); new actions (`startFpsMeasurement`, `stopFpsMeasurement`, `checkAdaptiveFps`, `startWaveformLoop`, `stopWaveformLoop`). Render loop throttled to effective FPS. `adaptiveFps` added to settings + persistable prefs. Full cleanup integration (FPS measurement, waveform, downgrade timer all torn down on pause/stop/reset).
- **Styling improvements:** recording stage gets a pulsing red glow (`.rec-glow`) while recording; final recording card fades in (`.fade-up`); waveform uses emerald gradient fill; FPS downgrade badge in amber; live stats overlay now shows actual measured FPS via Gauge icon; new CSS utilities `rec-glow`, `wave-bar`, `fade-up` (all reduced-motion safe).
- **ESLint:** 0 errors, 0 warnings. All React Compiler rules satisfied.

### Stage Summary
- **QA results:** Page loads 200, no errors/hydration warnings. DOM-verified all Round 4 features present: Adaptive FPS toggle ✓, "Will record as" codec chip ✓, audio bitrate slider ✓, frame rate selector ✓. Language persistence verified live (switched to Arabic, reloaded, language persisted). Keyboard shortcuts still work.
- **VLM verdict (round 4):** Overall design polished and premium ✓; clean dark-mode aesthetic with clear hierarchy and professional typography. (VLM couldn't verify scrolled output-section features visually, but DOM verification confirmed all present.)
- **Files changed:** `src/lib/i18n.ts`, `src/hooks/use-recorder.ts`, `src/components/recorder/live-preview.tsx`, `src/components/recorder/control-panel.tsx`, `src/components/recorder/final-recording.tsx`, `src/components/recorder/waveform-viz.tsx` (new), `src/components/recorder/recording-timeline.tsx` (new), `src/app/page.tsx`, `src/app/globals.css`.

### Remaining recommendations for next phase
1. ~~Snapshot video clip~~ ✅ DONE (round 5 — clip capture)
2. ~~Recording stats summary~~ ✅ DONE (round 5 — stats summary card)
3. **Custom keyboard shortcut editor** — let users rebind shortcuts.
4. **Manual real-browser recording validation** — test actual capture + compositing + download + PiP + snapshots + waveform + adaptive FPS + clips + presets in Chrome (cannot be done in headless).
5. **Performance profiling** — add a debug panel showing render time per frame, memory usage, track state.

---

## Round 5 — Presets, Stats Summary, Clip Capture (cron webDevReview)

### Task ID: 5
### Agent: main (cron webDevReview)
### Task: Assess project, QA, fix bugs, add features, improve styling, update worklog.

### Work Log
- Read worklog; confirmed rounds 1–4 complete and stable (lint clean, 0 errors, page loads 200, no runtime errors).
- agent-browser QA: page loads 200, no console/runtime errors, keyboard shortcuts (Ctrl+L) verified working.
- VLM critical assessment identified: live preview empty state, device selection UI, footer notes density as weak areas; recommended presets, templates, stats summary, clip capture as new features.
- **New features added (Round 5):**
  - **Recording presets** — `presets.ts` defines 4 presets (Gaming: 60fps/native/high-bitrate/system-audio; Presentation: 30fps/1080p/mic; Tutorial: 30fps/1080p/webcam+mic; Minimal: 24fps/720p/screen-only). `PresetsBar` component renders a 4-card grid above the main studio with icons, labels, descriptions, and active-state detection (`detectPreset` compares current settings to each preset). Clicking a preset applies its settings via `applyPreset`. Disabled during recording. The active preset is shown as a badge.
  - **Post-recording stats summary** — `RecordingStats` type tracks avg FPS, total frames, peak audio level, duration, file size, resolution, and codec. Accumulated during recording (total frames + FPS sum + samples in the FPS measurement loop; peak audio in the waveform loop). Computed in the onstop handler and displayed in a `StatsSummary` card with 7 stat tiles (color-coded emerald/blue/amber icons, monospace values). Fades in with the `fade-up` animation.
  - **Clip capture** — `captureClip()` clones the combined stream, creates a separate MediaRecorder, records for 5 seconds, then auto-stops and produces a downloadable video clip. `ClipsGallery` component shows a horizontal scrollable strip of clip thumbnails (video players) with elapsed-time badges, size badges, hover-to-reveal download + remove buttons, a capture button (with spinner while recording), and clear-all. A clip capture button (Clapperboard icon) is also in the LivePreview header during recording. Clips are downloadable as WebM.
- **i18n:** added ~30 new keys (EN + AR) for presets, stats summary, clip capture.
- **Hook architecture:** new `RecordingStats`, `Clip` types; new state (`recordingStats`, `clips`, `clipRecording`); new refs (`peakAudioRef`, `totalFramesRef`, `fpsSumRef`, `fpsSamplesRef`, `clipRecorderRef`, `clipChunksRef`, `clipStreamRef`); new actions (`captureClip`, `removeClip`, `clearClips`, `downloadClip`, `applyPreset`). Stats accumulators reset at recording start; stats computed in onstop; clips + stats cleared on full reset.
- **Styling:** presets bar with 4 icon cards (active state with emerald ring), stats summary with 7 color-coded tiles + fade-up animation, clips gallery with video thumbnails + hover overlays, clip capture button with spinner state. All reduced-motion safe.
- **ESLint:** 0 errors, 0 warnings. All React Compiler rules satisfied.

### Stage Summary
- **QA results:** Page loads 200, no errors/hydration warnings. DOM-verified all Round 5 features present: Presets ✓ (Gaming, Presentation, Tutorial, Minimal, Custom), active preset detection ✓. Keyboard shortcuts still work. Arabic RTL verified by VLM (presets labels in Arabic: الألعاب، عرض تقديمي، شرح، بسيط; layout correctly mirrored; no breaks).
- **VLM verdict (round 5):** Presets bar with 4 cards + active indication confirmed ✓; overall layout polished and premium ✓; cohesive dark theme with clear visual hierarchy and professional typography.
- **Files changed:** `src/lib/i18n.ts`, `src/lib/presets.ts` (new), `src/hooks/use-recorder.ts`, `src/components/recorder/presets-bar.tsx` (new), `src/components/recorder/stats-summary.tsx` (new), `src/components/recorder/clips-gallery.tsx` (new), `src/components/recorder/live-preview.tsx`, `src/app/page.tsx`.

### Remaining recommendations for next phase
1. ~~Custom keyboard shortcut editor~~ ✅ DONE (round 6)
2. ~~Recording templates for webcam overlays~~ ✅ DONE (round 6 — overlay templates)
3. ~~Export/share stats~~ ✅ DONE (round 6 — JSON export + copy)
4. **Manual real-browser recording validation** — test actual capture + compositing + download + PiP + snapshots + waveform + adaptive FPS + clips + presets + shortcut editor + templates in Chrome (cannot be done in headless).
5. **Performance profiling** — add a debug panel showing render time per frame, memory usage, track state.

---

## Round 6 — Shortcut Editor, Overlay Templates, Export Stats (cron webDevReview)

### Task ID: 6
### Agent: main (cron webDevReview)
### Task: Assess project, QA, fix bugs, add features, improve styling, update worklog.

### Work Log
- Read worklog; confirmed rounds 1–5 complete and stable (lint clean, 0 errors, page loads 200, no runtime errors).
- agent-browser QA: page loads 200, no console/runtime errors, keyboard shortcuts (Ctrl+L) verified working.
- VLM critical assessment identified: live preview empty state, device selection UI, footer notes density as weak areas; recommended shortcut editor, overlay templates, export stats as new features.
- **New features added (Round 6):**
  - **Custom keyboard shortcut editor** — `shortcuts.ts` defines `ShortcutMap` (7 actions: startStop, pauseResume, reset, toggleLang, toggleTheme, toggleWebcam, toggleMic) with default bindings, `loadShortcuts()`/`saveShortcuts()` persistence, `eventToBinding()` to convert KeyboardEvents, and `bindingLabel()` for human-readable labels (Mac-aware ⌘ vs Ctrl). `ShortcutEditor` dialog component lets users click any shortcut to enter bind mode, press a new key to rebind (with conflict detection — duplicate keys rejected with a warning), Escape to cancel, and a "Reset to defaults" button. The page's keyboard handler was rewritten to use the configurable `shortcuts` state via `eventToBinding` matching instead of hardcoded switch cases. Shortcuts persist to localStorage (`wpr-shortcuts-v1`) and load on mount. Verified live: rebound P→T, persisted across reload, reset to defaults works.
  - **Webcam overlay templates** — `overlay-templates.ts` defines 4 templates (Classic: rounded+border+shadow; Neon: rounded+border+shadow+tight margin; Minimal: rounded+shadow+no border; Polaroid: rounded+border+shadow+wide margin). `OverlayTemplates` component renders a 4-card grid inside the webcam overlay section with icons (Square, Sparkles, Circle, Image), labels, descriptions, and active-state detection (`detectTemplate`). Clicking a template applies its settings via `applyPreset`. Disabled when webcam off or during recording.
  - **Export/share recording stats** — `exportStatsJson()` builds a JSON payload (app name, createdAt, recording stats, recording details, settings, language). `downloadStatsJson()` downloads it as a `.json` file. `copyStatsJson()` copies it to the clipboard. The `StatsSummary` card now has two buttons in its header: "Copy JSON" (with copied confirmation) and "Download JSON".
- **i18n:** added ~30 new keys (EN + AR) for shortcut editor, overlay templates, export stats.
- **Hook architecture:** new actions (`exportStatsJson`, `downloadStatsJson`, `copyStatsJson`). Header now accepts `shortcuts` + `onShortcutsChange` + `onShortcutsReset` props. Page manages `shortcuts` state (loaded from localStorage on mount) and passes to both Header and the keyboard handler.
- **Styling:** shortcut editor with bind-mode highlighting + conflict warning + reset button; overlay templates with 4 icon cards (active state with emerald ring); export stats buttons with copied confirmation. All reduced-motion safe.
- **ESLint:** 0 errors, 0 warnings. All React Compiler rules satisfied.

### Stage Summary
- **QA results:** Page loads 200, no errors/hydration warnings. DOM-verified all Round 6 features present: Edit shortcuts button ✓, Overlay templates (Classic, Neon, Minimal, Polaroid) ✓, export stats buttons (in StatsSummary, only visible after recording) ✓. Shortcut editor verified live: opened dialog, rebound P→T, persisted across reload, reset to defaults works. Configurable keyboard handler verified (Ctrl+L via eventToBinding matching toggled EN→AR→RTL). Arabic RTL works.
- **VLM verdict (round 6):** Edit shortcuts button in header confirmed ✓; overall layout polished and premium ✓; clean dark theme, consistent typography, well-organized sections with clear icons, professional aesthetic, no visual bugs.
- **Files changed:** `src/lib/i18n.ts`, `src/lib/shortcuts.ts` (new), `src/lib/overlay-templates.ts` (new), `src/hooks/use-recorder.ts`, `src/components/recorder/header.tsx`, `src/components/recorder/shortcut-editor.tsx` (new), `src/components/recorder/overlay-templates.tsx` (new), `src/components/recorder/control-panel.tsx`, `src/components/recorder/stats-summary.tsx`, `src/app/page.tsx`.

### Remaining recommendations for next phase
1. ~~Performance profiling panel~~ ✅ DONE (round 7)
2. ~~Multi-recording history~~ ✅ DONE (round 7 — in-memory with thumbnails)
3. **Annotation tools** — draw on the canvas during recording (text, arrows, highlights).
4. **Recording scheduler** — schedule a recording to start at a specific time.
5. **Manual real-browser recording validation** — test actual capture + compositing + download + PiP + snapshots + waveform + adaptive FPS + clips + presets + shortcut editor + templates + export stats + profiling + history in Chrome (cannot be done in headless).

---

## Round 7 — Performance Profiling + Recording History (cron webDevReview)

### Task ID: 7
### Agent: main (cron webDevReview)
### Task: Assess project, QA, fix bugs, add features, improve styling, update worklog.

### Work Log
- Read worklog; confirmed rounds 1–6 complete and stable (lint clean, 0 errors, page loads 200, no runtime errors).
- agent-browser QA: page loads 200, no console/runtime errors, keyboard shortcuts (Ctrl+L) verified working.
- VLM critical assessment identified: live preview empty state, footer notes density as weak areas; recommended history, profiling, annotation as new features.
- **New features added (Round 7):**
  - **Performance profiling panel** — `ProfilingData` type tracks render time (ms/frame avg), memory used (MB via `performance.memory`, Chromium-only), canvas dimensions, video/audio track readyState, audio context state, and stream track count. The render loop now measures per-frame render time (accumulates `performance.now()` delta around `renderCompositeFrame`). A `startProfiling` interval samples every 1s, resets accumulators, and reads live track/context states. `ProfilingPanel` component renders a 7-metric grid (color-coded emerald/blue/amber) with a live/recording status badge and empty state. Toggleable via an Activity button in the LivePreview header (persists per session via `showProfiling` state). Full lifecycle integration (started on recording start, paused/resumed with recording, stopped + cleared on cleanup).
  - **Recording history** — `HistoryEntry` type stores id, url, blob, duration, size, mimeType, dimensions, createdAt, thumbnail (JPEG data URL), and codec. On recording stop, a thumbnail is captured from the canvas via `toDataURL("image/jpeg", 0.6)` and the entry is added to history (max 12, in-memory for the session). `HistoryPanel` component renders a responsive grid of recording cards with thumbnails, duration badges, hover-to-reveal action buttons (restore to player, download, delete), codec labels, file sizes, and timestamps. Actions: `removeHistoryEntry` (revokes URL unless it's the current player source), `clearHistory`, `restoreHistoryEntry` (loads to player + stats), `downloadHistoryEntry`. URL safety: never revokes the URL currently in use by the player.
- **i18n:** added ~40 new keys (EN + AR) for profiling (title, metrics, states, units) and history (title, actions, labels).
- **Hook architecture:** new `ProfilingData`, `HistoryEntry` types; new state (`profiling`, `history`, `showProfiling`); new refs (`renderTimeAccumRef`, `renderTimeSamplesRef`, `profilingTimerRef`); new actions (`startProfiling`, `stopProfiling`, `removeHistoryEntry`, `clearHistory`, `restoreHistoryEntry`, `downloadHistoryEntry`, `setShowProfiling`). Render loop instruments render-time measurement. Full lifecycle integration (profiling started/paused/stopped with recording; history entry created on stop).
- **Styling:** profiling panel with 7 color-coded metric tiles + live status badge + empty state; history panel with thumbnail grid + hover action overlays + duration/size/codec badges; Activity toggle button in preview header with active state. All reduced-motion safe (fade-up animations).
- **ESLint:** 0 errors, 0 warnings. All React Compiler rules satisfied.

### Stage Summary
- **QA results:** Page loads 200, no errors/hydration warnings. DOM-verified all Round 7 features present: Performance monitor panel ✓ (toggleable, empty state visible), Activity toggle button in preview header ✓, history panel (only renders when recordings exist — none in headless) ✓. Keyboard shortcuts (Ctrl+L) still work (toggled EN→AR→RTL live).
- **VLM verdict (round 7):** Performance monitor panel visible with empty state ✓; Activity toggle button in preview header ✓; overall layout polished and premium ✓; sophisticated dark theme with clear visual hierarchy, consistent glassmorphism, professional color palette; no visible bugs or layout issues.
- **Files changed:** `src/lib/i18n.ts`, `src/hooks/use-recorder.ts`, `src/components/recorder/profiling-panel.tsx` (new), `src/components/recorder/history-panel.tsx` (new), `src/components/recorder/live-preview.tsx`, `src/app/page.tsx`.

### Remaining recommendations for next phase
1. ~~Annotation tools~~ ✅ DONE (round 8 — pen, highlighter, arrow, text, eraser)
2. ~~Recording scheduler~~ ✅ DONE (round 8 — start-at + max duration + auto-stop)
3. **Persist history to IndexedDB** — currently in-memory only; could persist across sessions with IndexedDB.
4. **Manual real-browser recording validation** — test actual capture + compositing + download + PiP + snapshots + waveform + adaptive FPS + clips + presets + shortcut editor + templates + export stats + profiling + history + annotations + scheduler in Chrome (cannot be done in headless).
5. **Export history manifest** — export the history list as a JSON manifest for record-keeping.

---

## Round 8 — Annotation Tools + Recording Scheduler (cron webDevReview)

### Task ID: 8
### Agent: main (cron webDevReview)
### Task: Assess project, QA, fix bugs, add features, improve styling, update worklog.

### Work Log
- Read worklog; confirmed rounds 1–7 complete and stable (lint clean, 0 errors, page loads 200, no runtime errors).
- agent-browser QA: page loads 200, no console/runtime errors, keyboard shortcuts (Ctrl+L) verified working.
- VLM critical assessment identified: live preview empty state, footer notes density as weak areas; recommended annotation toolbar and scheduler as new features.
- **New features added (Round 8):**
  - **Canvas annotation tools** — `useAnnotations` hook manages annotation state (5 tools: pen, highlighter, arrow, text, eraser; 7 colors; brush size 1–20). Supports strokes (freehand pen/highlighter/eraser), arrows (with computed arrowhead), text (click-to-place with inline input), and an eraser (uses `destination-out` composite). `drawAnnotations(ctx)` is called by the recorder's render loop after the watermark, so annotations are composited into the final recording. The LivePreview handles pointer events (pointerdown/move/up/leave) mapping screen coords to canvas coords via scale factors; text tool shows an inline `<input>` overlay positioned at the click point (Enter to commit, Escape to cancel). An `AnnotationToolbar` component (pen/highlighter/arrow/text/eraser buttons, color picker popover, brush size slider, undo, clear-all) appears below the preview when annotations are enabled during recording. A PenLine toggle button in the LivePreview header enables/disables annotations. `settingsRef` kept in sync via useEffect (satisfies `react-hooks/refs`). Canvas dimensions tracked via ResizeObserver + state (avoids reading refs during render for the text input positioning).
  - **Recording scheduler** — `Scheduler` component with a toggle, datetime-local input for "Start at", a max-duration slider (0=unlimited, 1–60 min), and a "Start now" button. When scheduled, shows a live countdown (HH:MM:SS) with a cancel button. Auto-starts recording when the countdown reaches zero (checked via useEffect). Max duration is informational (auto-stop integration ready). Disabled during recording. Placed in the left column below the control panel.
- **i18n:** added ~40 new keys (EN + AR) for annotations (title, tools, colors, actions, hint) and scheduler (title, fields, states, actions).
- **Architecture:** new `useAnnotations` hook (state machine + drawing logic, independent of recorder); recorder hook accepts optional `drawAnnotations` callback param; LivePreview accepts optional `annotations` prop and handles pointer events; AnnotationToolbar and Scheduler are standalone components.
- **Styling:** annotation toolbar with tool buttons + color popover + brush slider + undo/clear; scheduler card with toggle + datetime + duration slider + countdown + start-now; PenLine toggle button in preview header with active state. All reduced-motion safe.
- **ESLint:** 0 errors, 0 warnings. All React Compiler rules satisfied (refs accessed only in event handlers/effects, not during render).

### Stage Summary
- **QA results:** Page loads 200, no errors/hydration warnings. DOM-verified all Round 8 features present: Scheduler ✓ (toggle, start-at, max duration, start now, unlimited), annotation toggle button in preview header ✓ (only during recording). Scheduler toggle verified live: toggled on, UI expanded with all fields. Keyboard shortcuts (Ctrl+L) still work (toggled EN→AR→RTL live).
- **VLM verdict (round 8):** Scheduler card in left column with toggle + datetime + duration slider + start-now confirmed ✓; overall layout highly polished and premium ✓; sophisticated dark theme with subtle gradients, consistent spacing, clear typography, professional UI components; no visible bugs or layout issues.
- **Files changed:** `src/lib/i18n.ts`, `src/hooks/use-annotations.ts` (new), `src/hooks/use-recorder.ts`, `src/components/recorder/annotation-toolbar.tsx` (new), `src/components/recorder/scheduler.tsx` (new), `src/components/recorder/live-preview.tsx`, `src/app/page.tsx`.

### Remaining recommendations for next phase
1. **Persist history to IndexedDB** — currently in-memory only; could persist across sessions with IndexedDB.
2. ~~Auto-stop integration~~ ✅ DONE (round 9 — scheduler max-duration wired to auto-stop)
3. **Annotation persistence** — persist annotations across recordings or allow exporting them.
4. **Manual real-browser recording validation** — test actual capture + compositing + download + PiP + snapshots + waveform + adaptive FPS + clips + presets + shortcut editor + templates + export stats + profiling + history + annotations + scheduler + auto-stop + manifest + new shortcuts in Chrome (cannot be done in headless).
5. ~~Export history manifest~~ ✅ DONE (round 9 — JSON manifest export + copy)

---

## Round 9 — Auto-Stop, Manifest Export, New Shortcuts (cron webDevReview)

### Task ID: 9
### Agent: main (cron webDevReview)
### Task: Assess project, QA, fix bugs, add features, improve styling, update worklog.

### Work Log
- Read worklog; confirmed rounds 1–8 complete and stable (lint clean, 0 errors, page loads 200, no runtime errors).
- agent-browser QA: page loads 200, no console/runtime errors, keyboard shortcuts (Ctrl+L) verified working.
- VLM critical assessment identified: live preview empty state, device selection UI as weak areas; recommended auto-stop, manifest export, new shortcuts as features.
- **New features added (Round 9):**
  - **Scheduler auto-stop integration** — The Scheduler's max-duration slider now calls `onAutoStopChange(ms)` which sets `autoStopMs` state in the page. A useEffect watches `rec.elapsed` and auto-stops recording when `elapsed * 1000 >= autoStopMs`, showing a toast "Auto-stop: duration limit reached". A live "Auto-stop in MM:SS" countdown indicator appears in the Scheduler during recording when a duration limit is set. The Scheduler is now controlled (`enabled` + `onEnabledChange` props from page state) so the 'S' keyboard shortcut can toggle it.
  - **Export history manifest** — `exportManifestJson()` builds a JSON payload (app name, exportedAt, language, recording count, and an array of all history recordings with id, createdAt, duration, size, mimeType, codec, dimensions). `downloadManifest()` downloads it as `wpr-manifest-{timestamp}.json`. `copyManifest()` copies to clipboard. The HistoryPanel now has "Copy manifest" and "Download manifest" buttons (disabled when history is empty) with toast feedback.
  - **New keyboard shortcuts** — Added 4 new customizable shortcuts: `toggleAnnotations` (A), `toggleScheduler` (S), `captureSnapshot` (C), `captureClip` (V). The `ShortcutAction` type, `DEFAULT_SHORTCUTS`, shortcut editor dialog, and read-only shortcuts dialog were all updated with the new actions. The page keyboard handler handles all 4 new shortcuts (annotations toggle only works during recording; scheduler toggle works anytime; snapshot/clip only during recording). Refs (`annotationsRef`, `recRef`) kept in sync via useEffect for handler access.
- **i18n:** added ~16 new keys (EN + AR) for auto-stop, manifest export, and new shortcut labels.
- **Architecture:** new hook actions (`exportManifestJson`, `downloadManifest`, `copyManifest`); Scheduler now controlled component; page manages `autoStopMs` + `schedulerEnabled` state; auto-stop effect watches elapsed; 4 new shortcut actions in the shortcuts system.
- **Styling:** manifest export buttons in history panel header; auto-stop live countdown indicator in scheduler; all new shortcuts in editor with styled `<kbd>` keys. All reduced-motion safe.
- **ESLint:** 0 errors, 0 warnings. All React Compiler rules satisfied (refs synced via useEffect, not during render).

### Stage Summary
- **QA results:** Page loads 200, no errors/hydration warnings. DOM-verified all Round 9 features present: Scheduler with auto-stop ✓ (Start at, Max duration visible), new shortcuts in editor ✓ (Toggle annotations, Toggle scheduler, Capture snapshot, Capture clip all present), manifest buttons in history panel (only when history exists). 'S' shortcut verified live: toggled scheduler on, "Scheduler" title appeared. Ctrl+L shortcut still works (toggled EN→AR→RTL live). All 11 shortcuts now in the editor (Space, P, R, Ctrl+L, Ctrl+D, W, M, A, S, C, V).
- **VLM verdict (round 9):** Overall layout very polished, modern, and premium ✓; clean dark theme, consistent spacing, clear typography, professional UI structure; no visible bugs or layout breaks.
- **Files changed:** `src/lib/i18n.ts`, `src/lib/shortcuts.ts`, `src/hooks/use-recorder.ts`, `src/components/recorder/scheduler.tsx`, `src/components/recorder/shortcut-editor.tsx`, `src/components/recorder/shortcuts-dialog.tsx`, `src/components/recorder/history-panel.tsx`, `src/app/page.tsx`.

### Remaining recommendations for next phase
1. **Persist history to IndexedDB** — currently in-memory only; could persist across sessions with IndexedDB.
2. ~~Annotation persistence~~ ✅ DONE (round 10 — export/import JSON)
3. **Manual real-browser recording validation** — test the full workflow in Chrome (cannot be done in headless).
4. ~~Custom watermark text/logo~~ ✅ DONE (round 10 — custom text + opacity + size)
5. **Recording format conversion** — client-side WebM→MP4 conversion (if feasible without backend).

---

## Round 10 — Custom Watermark + Annotation Export (cron webDevReview)

### Task ID: 10
### Agent: main (cron webDevReview)
### Task: Assess project, QA, fix bugs, add features, improve styling, update worklog.

### Work Log
- Read worklog; confirmed rounds 1–9 complete and stable (lint clean, 0 errors, page loads 200, no runtime errors).
- agent-browser QA: page loads 200, no console/runtime errors, keyboard shortcuts (Ctrl+L) verified working.
- VLM critical assessment identified: live preview empty state, footer density as weak areas; recommended custom watermark and annotation export as new features.
- **New features added (Round 10):**
  - **Custom watermark** — Added `watermarkText`, `watermarkOpacity`, and `watermarkSize` to RecorderSettings (persisted). The `drawWatermark` function now uses the custom text (falls back to "Web Pro Record" if empty), custom opacity (0.1–1), and custom size (0.01–0.06 fraction of canvas height). The watermark toggle was moved out of the webcam-gated section into its own independent SectionCard (it's now always accessible, not gated by webcam being enabled). When watermark is on, a custom settings panel appears with a text input (with "Use app name" reset button), an opacity slider (10–100%), and a size slider (10–60‰). All settings are persisted to localStorage.
  - **Annotation export/import** — Added `exportJson()`, `downloadJson()`, `importJson(json)`, and `importFromFile(file)` to the `useAnnotations` hook. Export builds a JSON payload (app name, type, exportedAt, stroke count, and the full strokes array). Import validates the JSON structure (checks `strokes` array with required fields) and loads valid strokes. The AnnotationToolbar now has Export (Download icon) and Import (Upload icon with hidden file input) buttons after the undo/clear buttons, separated by a divider.
- **i18n:** added ~20 new keys (EN + AR) for custom watermark (text, opacity, size, position, preview, use app name) and annotation export/import (export, import, descriptions, success/failure messages).
- **Architecture:** new RecorderSettings fields (`watermarkText`, `watermarkOpacity`, `watermarkSize`) + persistable; `drawWatermark` reads from `settingsRef`; watermark SectionCard independent of webcam gating; new annotation hook functions (`exportJson`, `downloadJson`, `importJson`, `importFromFile`) with validation.
- **Styling:** watermark SectionCard with Droplet icon; custom settings panel with text input + opacity/size sliders + use-app-name button; annotation toolbar with export/import buttons (Download/Upload icons) separated by divider. All reduced-motion safe.
- **ESLint:** 0 errors, 0 warnings. All React Compiler rules satisfied.

### Stage Summary
- **QA results:** Page loads 200, no errors/hydration warnings. DOM-verified all Round 10 features present: Watermark section ✓ (independent of webcam), custom watermark UI ✓ (Custom watermark, Watermark text, Opacity, Size, Use app name all visible after toggling). Watermark toggle verified live: toggled on, custom settings panel appeared. Keyboard shortcuts (Ctrl+L) still work (toggled EN→AR→RTL live).
- **VLM verdict (round 10):** Watermark section with toggle + text input + opacity slider (70%) + size slider (22‰) confirmed ✓; overall layout highly polished and premium ✓; sophisticated dark-mode aesthetic with consistent spacing, clear typography hierarchy, professional accent colors; no visible bugs or layout issues.
- **Files changed:** `src/lib/i18n.ts`, `src/hooks/use-recorder.ts`, `src/hooks/use-annotations.ts`, `src/components/recorder/control-panel.tsx`, `src/components/recorder/annotation-toolbar.tsx`.

### Remaining recommendations for next phase
1. **Persist history to IndexedDB** — currently in-memory only; could persist across sessions with IndexedDB.
2. **Recording format conversion** — client-side WebM→MP4 conversion (if feasible without backend).
3. ~~Watermark logo upload~~ ✅ DONE (round 11 — image upload + 3 modes)
4. **Manual real-browser recording validation** — test the full workflow in Chrome (cannot be done in headless).
5. ~~Custom annotation colors palette~~ ✅ DONE (round 11 — native color input)

---

## Round 11 — Custom Color Picker + Watermark Logo Upload (cron webDevReview)

### Task ID: 11
### Agent: main (cron webDevReview)
### Task: Assess project, QA, fix bugs, add features, improve styling, update worklog.

### Work Log
- Read worklog; confirmed rounds 1–10 complete and stable (lint clean, 0 errors, page loads 200, no runtime errors).
- agent-browser QA: page loads 200, no console/runtime errors, keyboard shortcuts (Ctrl+L) verified working.
- VLM critical assessment identified: live preview empty state, toggle styling as weak areas; recommended custom color picker and logo upload as new features.
- **New features added (Round 11):**
  - **Custom annotation color picker** — The annotation toolbar's color popover now includes a native HTML5 `<input type="color">` below the 7 preset colors, separated by a divider. Users can pick any custom color (full hex range) which updates `settings.color` live. The color swatch preview reflects the current color. The native color input is overlaid on a circular swatch with opacity-0 to make it clickable while showing the color.
  - **Watermark logo upload** — Added `watermarkLogoDataUrl`, `watermarkMode` ("text" | "logo" | "both"), and `watermarkLogoSize` to RecorderSettings. The `drawWatermark` function now supports 3 modes: text-only (existing), logo-only (draws the uploaded image), and text+logo (draws both, with text positioned above the logo). A `watermarkLogoImgRef` + `watermarkLogoReadyRef` load the image via `new Image()` when the data URL changes. The ControlPanel watermark section now has a mode selector (Text only / Logo only / Text + logo) and, when logo mode is active, an upload button (FileReader → data URL), a remove button, a logo preview thumbnail, and a logo size slider (2–15% of canvas height). Logo data URL is intentionally NOT persisted (could be large); mode + size are persisted.
- **i18n:** added ~16 new keys (EN + AR) for custom color picker and watermark logo (mode, upload, remove, size, opacity, descriptions, error).
- **Architecture:** new RecorderSettings fields (`watermarkLogoDataUrl`, `watermarkMode`, `watermarkLogoSize`); `drawWatermark` refactored to support 3 modes; logo image loaded via effect + refs; annotation color picker uses native `<input type="color">`.
- **Styling:** watermark mode selector with 3 options; logo upload card with upload button + remove + preview + size slider; annotation color popover with custom color section (divider + native color input + label). All reduced-motion safe.
- **ESLint:** 0 errors, 0 warnings. All React Compiler rules satisfied.

### Stage Summary
- **QA results:** Page loads 200, no errors/hydration warnings. DOM-verified all Round 11 features present: Watermark mode selector ✓ (Text only / Logo only / Text + logo), logo upload UI ✓ (Upload logo, Watermark logo, upload description visible after selecting Logo only mode). Mode change verified live: selected "Logo only", upload UI appeared. Keyboard shortcuts (Ctrl+L) still work (toggled EN→AR→RTL live).
- **VLM verdict (round 11):** Watermark section with mode dropdown (set to "Logo only") ✓; Upload logo button clearly visible ✓; overall layout very polished and premium ✓; dark theme, consistent spacing, modern UI components, clear typography; no visible bugs or layout issues.
- **Files changed:** `src/lib/i18n.ts`, `src/hooks/use-recorder.ts`, `src/components/recorder/control-panel.tsx`, `src/components/recorder/annotation-toolbar.tsx`.

### Remaining recommendations for next phase
1. **Persist history to IndexedDB** — currently in-memory only; could persist across sessions with IndexedDB.
2. **Recording format conversion** — client-side WebM→MP4 conversion (if feasible without backend).
3. **Manual real-browser recording validation** — test the full workflow in Chrome (cannot be done in headless).
4. **Custom UI accent color** — let users change the app's accent color (currently emerald).
5. **Recording templates manager** — save/load custom recording configurations as named profiles.

---

## Round 12 — Security Audit (SEC-1)

### Task ID: SEC-1
### Agent: Security Auditor
### Task: Application security audit of Web Pro Record — secrets scan, XSS, input validation, localStorage, dependencies, file upload, CSP/headers, media API, git, code injection.

### Scope & Methodology
Audited the full repo under `/home/z/my-project` (8,094 LOC across `src/components/recorder/`, `src/hooks/`, `src/lib/`, `src/app/`) plus deployment files (`next.config.ts`, `Caddyfile`, `package.json`, `examples/`, `upload/`). Ran `bun audit` (80 vulnerabilities), `git ls-files` for sensitive-file tracking, and grep-based scans for secret patterns, XSS sinks (`dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, `document.write`, string-arg `setTimeout`), localStorage usage, `FileReader`/`URL.createObjectURL`, and media-stream lifecycle.

### Executive Summary
The recorder **core (client-side media logic) is well-built and safe** — no `eval`, no string-arg `setTimeout`, no `innerHTML`, all canvas text drawn via `ctx.fillText` (XSS-safe), all media streams properly stopped in `cleanupMedia()`/`cleanupAll()`, all object URLs revoked. **No hardcoded secrets** were found. The `.env` is **not** git-tracked (`.gitignore:34` correctly excludes `.env*`).

However, there are **20 findings** spanning deployment config (CRITICAL open reverse-proxy in `Caddyfile`), missing CSP, vulnerable dependencies (1 critical + 42 high), missing file-upload validation (SVG XSS footgun), and missing localStorage schema validation. **No fixes were applied** per task scope — this is a report only.

### Findings (20 total: 1 CRITICAL, 3 HIGH, 9 MEDIUM, 4 LOW, 3 INFO)

---

#### SEC-001 — CRITICAL — Caddyfile open reverse-proxy (SSRF)
- **File:** `Caddyfile:6-13`
- **Problem:** The Caddyfile accepts any request with query parameter `?XTransformPort=<port>` and reverse-proxies it to `localhost:<port>`. An external attacker can craft URLs like `https://<deployed-host>/?XTransformPort=5432` to reach PostgreSQL, `XTransformPort=6379` for Redis, `XTransformPort=9000` for PHP-FPM, internal admin panels, the Prisma SQLite RPC, metadata services, etc. — any TCP listener on the host.
- **Root cause:** The `@transform_port_query` matcher + `reverse_proxy localhost:{query.XTransformPort}` block trusts a user-controlled query parameter as the upstream target with no allowlist.
- **Impact:** Full SSRF — attackers can pivot into every local service, exfiltrate database contents, hit cloud-metadata endpoints (169.254.169.254), scan internal network, bypass firewalls. This is the single most severe finding in the audit, and it is in the deployment config that ships with the repo.
- **Recommended fix:** Remove the dynamic-port block entirely, or replace it with an explicit allowlist (e.g. `:3000`, `:3003` only). At minimum, restrict to known safe ports:
  ```caddyfile
  @allowed_port query XTransformPort=3000
  query XTransformPort=3003
  handle @allowed_port { reverse_proxy localhost:{query.XTransformPort} }
  ```

---

#### SEC-002 — HIGH — No Content-Security-Policy or security headers
- **File:** `next.config.ts:3-10`
- **Problem:** `next.config.ts` defines only `output: "standalone"`, `typescript.ignoreBuildErrors`, and `reactStrictMode: false`. There is **no `headers()` configuration**, so the deployed app ships with **no** `Content-Security-Policy`, no `X-Frame-Options`/`frame-ancestors`, no `X-Content-Type-Options: nosniff`, no `Referrer-Policy`, no `Permissions-Policy`. The app calls `getDisplayMedia`/`getUserMedia` — without a `Permissions-Policy` that explicitly allows them only on this origin, third-party iframes/ embedders can attempt to frame the page and request camera/mic/screen.
- **Root cause:** Default Next.js config doesn't add security headers; developer must opt in.
- **Impact:** (1) If any XSS is ever introduced (now or by a future dependency), there is no CSP to contain it. (2) Clickjacking — page can be iframed by attackers. (3) MIME-sniffing attacks. (4) Permission prompts can be triggered from framed contexts.
- **Recommended fix:** Add a `headers()` block to `next.config.ts`:
  ```ts
  const nextConfig: NextConfig = {
    async headers() {
      return [{
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), display-capture=(self), geolocation=(), clipboard-write=(self)" },
        ],
      }];
    },
  };
  ```

---

#### SEC-003 — HIGH — 80 dependency vulnerabilities (1 critical, 42 high)
- **File:** `package.json`, `bun.lock`
- **Problem:** `bun audit` reports **80 vulnerabilities** (1 critical, 42 high, 32 moderate, 5 low). Highlights:
  - **CRITICAL** `next-auth` >=4.0.6 <=4.24.14 — Email normalizer validates address before Unicode normalization, allowing homoglyph `@` bypass (GHSA-7rqj-j65f-68wh).
  - **HIGH** `next` >=16.0.0 <16.2.5 — 30+ advisories incl. SSRF in rewrites/Server Actions, middleware/proxy bypasses, XSS with CSP nonces, DoS via Server Components/Actions, Image Optimization DoS via SVG.
  - **HIGH** `sharp` <0.35.0 — libvips inherited vulnerabilities (GHSA-f88m-g3jw-g9cj).
  - **HIGH** `next-intl` <4.9.1 — open redirect + prototype pollution via precompiled messages.
  - **HIGH** `lodash` (via recharts) — Code Injection via `_.template` (GHSA-r5fr-rjxr-66jc) + Prototype Pollution in `_.unset`/`_.omit`.
  - **HIGH** `defu` (via prisma) — Prototype pollution via `__proto__` (GHSA-737v-mqg7-c878).
  - **HIGH** `brace-expansion`, `minimatch`, `picomatch`, `flatted`, `nanoid`, `js-cookie`, `js-yaml`, `prismjs` — various DoS/prototype-pollution/XSS.
- **Root cause:** Pinned dependency ranges are out-of-date; many are inherited transitively.
- **Impact:** For a fully client-side app, most server-side Next.js vulns are not exploitable in production, but: (a) the repo contains `src/app/api/route.ts`, `src/lib/db.ts`, `examples/websocket/server.ts` — so server-side vulns DO matter if those run. (b) `lodash` ships in the client bundle via `recharts` (which isn't used by the recorder UI). (c) `next-auth` ships with a critical email-bypass vuln even if unused. (d) Dev-time `eslint`/`typescript-eslint` ReDoS vulns could slow CI.
- **Recommended fix:** Run `bun update --latest` to bump major versions, then `bun audit` again. Remove unused deps: `next-auth`, `@prisma/client`, `prisma`, `next-intl`, `@mdxeditor/editor`, `react-syntax-highlighter`, `recharts`, `sharp`, `z-ai-web-dev-sdk`, `@tanstack/react-query`, `@tanstack/react-table`, `react-hook-form`, `react-markdown`, `uuid`, `next-themes` (keep if used). For a screen recorder, almost none of these are needed.

---

#### SEC-004 — HIGH — `next.config.ts` disables build-time safety
- **File:** `next.config.ts:7-9`
- **Problem:**
  ```ts
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: false,
  ```
  `ignoreBuildErrors: true` makes `next build` succeed even when `tsc` reports type errors. Type errors frequently hide security bugs (e.g., treating a `string` as a `number`, or assuming a value is non-null). `reactStrictMode: false` disables React's dev-mode checks for unsafe lifecycles and double-invoked effects.
- **Root cause:** Likely set to ship despite TypeScript errors during initial development.
- **Impact:** Type-unsafe code can reach production, masking security vulnerabilities and contract violations.
- **Recommended fix:** Remove `typescript.ignoreBuildErrors` (default is `false`) and fix any outstanding TS errors. Re-enable `reactStrictMode: true`.

---

#### SEC-005 — MEDIUM — Watermark logo upload accepts SVG (script-injection footgun)
- **File:** `src/components/recorder/control-panel.tsx:642`
- **Problem:**
  ```tsx
  <input type="file" accept="image/png,image/jpeg,image/svg+xml" ... />
  ```
  SVG files can contain `<script>` tags and event handlers (`onload`, `onerror`). The uploaded file is read via `FileReader.readAsDataURL` (`control-panel.tsx:653`) and stored as `watermarkLogoDataUrl`. Currently the data URL is consumed in two XSS-safe ways: (1) `<img src={dataUrl}>` at `control-panel.tsx:675` (img tags don't execute SVG scripts), and (2) `new Image()` + `ctx.drawImage()` at `use-recorder.ts:368,730` (canvas drawImage doesn't execute scripts either). **Today this is safe**, but it is a footgun — any future code path that renders the data URL via `<embed>`, `<object>`, `<iframe>`, `<a target=_blank href={dataUrl}>`, `fetch(dataUrl).then(r => r.text())` then `innerHTML`, or top-level navigation would execute attacker-controlled script in the app origin.
- **Root cause:** SVG is included in the accept list without a clear need (the watermark feature wants raster logos).
- **Impact:** Latent XSS — depends on future code changes. Also, SVGs can carry XXE payloads that affect some parsers (not the browser's `<img>` loader, but defense-in-depth is wise).
- **Recommended fix:** Drop SVG from the accept list:
  ```tsx
  accept="image/png,image/jpeg,image/webp"
  ```
  And validate the data URL prefix in the `onload` handler:
  ```ts
  reader.onload = () => {
    const dataUrl = reader.result as string;
    if (!/^data:image\/(png|jpeg|webp);base64,/.test(dataUrl)) return;
    if (dataUrl.length > 1_500_000) { toast({ description: "Logo too large (max 1 MB)" }); return; }
    rec.updateSettings("watermarkLogoDataUrl", dataUrl);
  };
  ```

---

#### SEC-006 — MEDIUM — Watermark logo data URL not validated
- **File:** `src/components/recorder/control-panel.tsx:644-655`
- **Problem:** The file upload handler unconditionally writes `reader.result` into `settings.watermarkLogoDataUrl`. There is no MIME validation, no size limit, no prefix check. If `FileReader` ever returns an unexpected string (or if a malicious localStorage injection plants a `data:text/html,...` URL — see SEC-008), the value will be set as the logo src and rendered by `<img>` and `drawImage`.
- **Root cause:** Missing input validation.
- **Impact:** A crafted data URL (e.g., `data:text/html;base64,...` or `data:image/svg+xml,...`) would be accepted. While `<img>` won't execute scripts in HTML/SVG data URLs, accepting non-image types is incorrect and fragile.
- **Recommended fix:** Add the validation snippet shown in SEC-005.

---

#### SEC-007 — MEDIUM — Watermark logo upload has no file-size limit
- **File:** `src/components/recorder/control-panel.tsx:644-655`
- **Problem:** No `file.size` check before `readAsDataURL`. A 50 MB image will be read fully into memory, base64-encoded (→ ~67 MB string), stored in React state, and rendered in the watermark `<img>` preview on every render. If the user toggles the logo off and back on, this is repeated. Even though `watermarkLogoDataUrl` is intentionally NOT persisted (good — noted at `use-recorder.ts:136` comment), it lives in memory until cleared.
- **Root cause:** No size guard.
- **Impact:** Browser memory exhaustion / tab crash if user uploads a huge file; UX degradation.
- **Recommended fix:** Add `if (file.size > 1_000_000) { toast({ description: "Logo too large (max 1 MB)" }); return; }` before reading.

---

#### SEC-008 — MEDIUM — localStorage prefs JSON.parse has no schema validation
- **File:** `src/hooks/use-recorder.ts:195-206, 353-357`
- **Problem:**
  ```ts
  function loadPrefs(): Partial<PersistablePrefs> | null {
    const raw = window.localStorage.getItem(PREF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as Partial<PersistablePrefs>;   // ← no field-type validation
  }
  // ...
  const prefs = loadPrefs();
  if (prefs) {
    setSettings((prev) => ({ ...prev, ...prefs }));   // ← blind spread
  }
  ```
  Any value (correct type, wrong type, extra fields, malicious `__proto__`-like keys) is accepted and spread over `DEFAULT_SETTINGS`. Downstream consumers assume typed fields:
  - `drawWatermark` at `use-recorder.ts:702` calls `s.watermarkText?.trim()` — crashes if `watermarkText` is a number.
  - `Math.round(h * s.watermarkLogoSize)` at `:712,723` returns `NaN` if `watermarkLogoSize` is a string.
  - Slider components receive non-number values and may render NaN.
  A malicious script on the same origin (e.g., via an XSS in a future dependency, or another app hosted on the same origin) could plant `localStorage.setItem("wpr-prefs-v1", JSON.stringify({watermarkText: 12345, quality: "4320", frameRate: "999"}))` to crash the recorder on next load — a persistent client-side DoS.
- **Root cause:** `JSON.parse` + bare cast without runtime validation.
- **Impact:** Persistent client-side DoS via crafted localStorage; potential crashes if attackers can write to localStorage.
- **Recommended fix:** Validate each field by type and range before merging, e.g.:
  ```ts
  function loadPrefs(): Partial<PersistablePrefs> | null {
    try {
      const raw = window.localStorage.getItem(PREF_KEY);
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (!p || typeof p !== "object" || Array.isArray(p)) return null;
      const out: Partial<PersistablePrefs> = {};
      if (typeof p.watermarkText === "string") out.watermarkText = p.watermarkText.slice(0, 200);
      if (typeof p.watermarkOpacity === "number") out.watermarkOpacity = clamp(p.watermarkOpacity, 0.1, 1);
      if (typeof p.watermarkSize === "number") out.watermarkSize = clamp(p.watermarkSize, 0.01, 0.06);
      if (typeof p.watermarkLogoSize === "number") out.watermarkLogoSize = clamp(p.watermarkLogoSize, 0.02, 0.15);
      if (["text","logo","both"].includes(p.watermarkMode)) out.watermarkMode = p.watermarkMode;
      if (["720","1080","1440","native"].includes(p.quality)) out.quality = p.quality;
      if (["24","30","60"].includes(p.frameRate)) out.frameRate = p.frameRate;
      // ... and so on for each persistable field
      return out;
    } catch { return null; }
  }
  ```

---

#### SEC-009 — MEDIUM — `shortcuts.ts` localStorage merge accepts unvalidated combos
- **File:** `src/lib/shortcuts.ts:41-52`
- **Problem:**
  ```ts
  const parsed = JSON.parse(raw) as Partial<ShortcutMap>;
  return { ...DEFAULT_SHORTCUTS, ...parsed } as ShortcutMap;
  ```
  No validation that `parsed[action].combo` is a valid `KeyboardEvent.code` and `parsed[action].mod` is a boolean. A malicious localStorage payload could set `combo: ""` (disables the shortcut) or `combo: "KeyA"` colliding with another action (causing ambiguous behavior). The bare cast trusts the stored shape entirely.
- **Root cause:** Missing shape validation; the cast `as ShortcutMap` lies to TypeScript.
- **Impact:** A same-origin attacker can disable or hijack keyboard shortcuts (e.g., unbinding the stop shortcut to make the user record indefinitely). Not a script-execution vector, but a UX/integrity issue.
- **Recommended fix:** Validate each entry: `typeof v.combo === "string" && /^[A-Za-z0-9]+$/.test(v.combo) && typeof v.mod === "boolean"`.

---

#### SEC-010 — MEDIUM — Unnecessary backend/AI deps for a "no backend" client-side app
- **File:** `package.json:15-82`
- **Problem:** The project README and worklog describe it as "fully client-side, no backend, no AI APIs, no uploads." Yet `package.json` lists: `next-auth` (auth backend), `@prisma/client` + `prisma` (DB ORM), `next-intl` (server i18n), `@mdxeditor/editor` (rich text), `react-syntax-highlighter` + `prismjs` (code highlighter), `recharts` (charts, pulls in `lodash`), `sharp` (image processing — server only), `z-ai-web-dev-sdk` (AI client), `@tanstack/react-query` + `react-table`, `react-hook-form`, `react-markdown`, `uuid`. The repo also contains `src/lib/db.ts` (Prisma client), `src/app/api/route.ts` (an HTTP endpoint), `examples/websocket/server.ts` (Socket.IO server) — contradicting the "no backend" claim.
- **Root cause:** Project scaffolded from a full Next.js starter (nextjs_tailwind_shadcn_ts) and never trimmed.
- **Impact:** (a) Massive unnecessary attack surface — the critical `next-auth` vuln (SEC-003) only matters because `next-auth` is installed. (b) Larger client bundle → slower load → more code to audit. (c) Misleading security posture — auditors/operators may falsely assume the deployment has no server attack surface.
- **Recommended fix:** Trim dependencies to only what the recorder actually imports (`next`, `react`, `react-dom`, `lucide-react`, `next-themes`, `tailwind-merge`, `clsx`, `class-variance-authority`, `@radix-ui/*`, `sonner`, `tailwindcss`, `tw-animate-css`). Delete `src/lib/db.ts`, `src/app/api/route.ts`, `prisma/`, `examples/`. Run `bun audit` again — count should drop dramatically.

---

#### SEC-011 — MEDIUM — `examples/websocket/server.ts` has `cors: { origin: "*" }`
- **File:** `examples/websocket/server.ts:8-11`
- **Problem:**
  ```ts
  const io = new Server(httpServer, {
    path: '/',
    cors: { origin: "*", methods: ["GET", "POST"] },
  ```
  Socket.IO server allows any origin. Combined with the Caddyfile open proxy (SEC-001), this is doubly exploitable.
- **Root cause:** Demo file left with permissive CORS for ease of testing.
- **Impact:** If this example server is ever run in production, any website can connect to the Socket.IO endpoint and send/receive messages — including the `test` event that echoes back attacker-supplied data (`server.ts:53-60`).
- **Recommended fix:** Restrict to specific origins: `cors: { origin: ["http://localhost:3000"] }`. Better: delete `examples/` since the recorder doesn't use WebSockets.

---

#### SEC-012 — MEDIUM — `upload/` directory git-tracked but not gitignored
- **File:** `upload/pasted_image_1786245044623.png` (200 KB, committed), `.gitignore` (no `upload/` entry)
- **Problem:** `git ls-files` confirms `upload/pasted_image_1786245044623.png` is tracked. The `.gitignore` excludes `/db/*.db`, `qa-*.png`, `*.log`, `dev.log`, but NOT `upload/`. This means future pasted/uploaded files will be committed accidentally. Even though this specific PNG appears to be a screenshot, the pattern invites leakage of sensitive screenshots (e.g., a screenshot containing API tokens, env vars, or PII).
- **Root cause:** Missing `.gitignore` entry.
- **Impact:** Risk of accidentally committing sensitive files in the future.
- **Recommended fix:** Add `/upload/` and `/tool-results/` to `.gitignore`, and `git rm --cached upload/pasted_image_1786245044623.png`.

---

#### SEC-013 — LOW — Watermark text input has no `maxLength`
- **File:** `src/components/recorder/control-panel.tsx:562-568`
- **Problem:** The `<Input>` for `watermarkText` has no `maxLength` attribute. A user (or localStorage injection — see SEC-008) could set a multi-KB string. The value is persisted to localStorage (where it could blow the 5 MB quota) and rendered via `ctx.fillText` on every composite frame (perf cost during 60 FPS recording).
- **Root cause:** No length guard.
- **Impact:** localStorage quota exhaustion; minor perf hit during recording.
- **Recommended fix:** Add `maxLength={80}` to the input. Also clamp in `loadPrefs()`.

---

#### SEC-014 — LOW — Annotation text input has no `maxLength`
- **File:** `src/components/recorder/live-preview.tsx:503-523`
- **Problem:** The annotation text `<input>` (rendered when the text tool is active) has no `maxLength`. The value is committed via `annotations.commitText(textInput.value)` and drawn via `ctx.fillText` at `use-annotations.ts:204`. Imported annotation JSON (`importFromFile` at `use-annotations.ts:271`) also doesn't bound text length per stroke.
- **Root cause:** No length guard.
- **Impact:** A user pasting a 1 MB string into the annotation input would degrade canvas render perf during recording. Imported JSON could carry huge text strokes.
- **Recommended fix:** Add `maxLength={500}` to the input. In `importJson`, validate `typeof st.text === "string" && st.text.length < 1000`.

---

#### SEC-015 — LOW — `reader.onerror = () => {}` silently swallows upload errors
- **File:** `src/components/recorder/control-panel.tsx:652`
- **Problem:** The FileReader error handler is empty. If a file read fails (e.g., browser blocks reading a sandboxed file, or the file is corrupt), the user gets no feedback — the logo simply doesn't appear, and they may conclude the feature is broken.
- **Root cause:** Placeholder handler never implemented.
- **Impact:** Poor UX; could mask a security control blocking a malicious file.
- **Recommended fix:** `reader.onerror = () => toast({ description: t("watermarkLogoError") });` (an i18n key already exists at i18n.ts).

---

#### SEC-016 — LOW — Scheduler `startAt` parsed without bounds validation
- **File:** `src/components/recorder/scheduler.tsx:50, 71-76`
- **Problem:** `new Date(startAt).getTime()` is computed from a user-controlled `<input type="datetime-local">` value. While the browser constrains the input format, a programmatic value (or a malformed localStorage value in the future) could produce `NaN` (e.g., `new Date("garbage").getTime()`). The code does `if (Date.now() >= target && canStart)` — when `target` is `NaN`, the comparison is `false`, so it silently never fires. Cosmetic, but worth a guard.
- **Root cause:** No `Number.isFinite(target)` check.
- **Impact:** Scheduler silently fails to fire on malformed input; user confused.
- **Recommended fix:** `if (!Number.isFinite(target)) return;` early in the auto-start effect.

---

#### SEC-017 — LOW — `examples/websocket/frontend.tsx` connects without TLS verification
- **File:** `examples/websocket/frontend.tsx:36-43`
- **Problem:** `io('/?XTransformPort=3003', { transports: ['websocket', 'polling'] })` — the client uses polling fallback, which exposes the `XTransformPort` query parameter in HTTP request URLs (visible in logs). Combined with SEC-001, this is part of the open-proxy pattern.
- **Root cause:** Demo code using the project's Caddy convention.
- **Impact:** Logs leak the internal port mapping; minor info disclosure.
- **Recommended fix:** Delete `examples/` directory.

---

#### SEC-018 — INFO — `dangerouslySetInnerHTML` in shadcn `chart.tsx` (not used)
- **File:** `src/components/ui/chart.tsx:83`
- **Problem:** The shadcn/ui `ChartStyle` component uses `dangerouslySetInnerHTML` to inject CSS into a `<style>` tag. Content is built from `THEMES` constants and `config.color`/`config.theme` from the consuming chart.
- **Root cause:** Standard shadcn/ui chart implementation.
- **Impact:** None currently — the recorder app does **not** import `chart.tsx` (grep confirms no `Chart` imports in `src/components/recorder/`). If a chart is later added with attacker-controlled color values, it would be a CSS-injection vector (not script execution — `<style>` doesn't run JS, but could exfiltrate via CSS `url()`).
- **Recommended fix:** None required now. If charts are added, sanitize color values with `/^#[0-9a-fA-F]{3,8}$/.test(color)` or use CSS custom properties instead of `dangerouslySetInnerHTML`.

---

#### SEC-019 — INFO — Good practices observed (positive findings)
The following security-positive patterns were verified:
- **No `eval()`, `new Function()`, `document.write()`** anywhere in `src/` (grep returned no matches).
- **No string-argument `setTimeout`/`setInterval`** — all 12 timer calls use function callbacks (`grep` confirmed).
- **No `innerHTML`/`outerHTML`/`insertAdjacentHTML`** in `src/` (the single `dangerouslySetInnerHTML` is the shadcn chart, SEC-018).
- **All canvas text** (watermark at `use-recorder.ts:715-716`, annotation text at `use-annotations.ts:204`, idle-preview labels at `use-recorder.ts:1019,1022`) is rendered via `ctx.fillText`/`ctx.strokeText` — **XSS-safe** because canvas draws pixels, not DOM. Even `<script>` tags in watermark/annotation text would render as literal characters.
- **Media streams properly stopped**: `stopStream()` at `use-recorder.ts:465-474` calls `tr.stop()` on every track in a try/catch. `cleanupMedia()` (477-563) stops screen/webcam/mic/combined streams, closes AudioContext, detaches `srcObject`, exits PiP, clears all RAFs/intervals. `cleanupAll()` (566-591) additionally revokes the result URL. **Unmount cleanup** at `:2024-2028` runs `cleanupAll()` once. Good lifecycle hygiene.
- **Object URLs revoked**: All 11 `URL.createObjectURL` calls have matching `URL.revokeObjectURL` (verified at lines 569, 586, 1317, 1324, 1352, 1362, 1375, 1664, 1851, 1942, 1988). No memory-leak pattern.
- **Secure context check**: `detectFeatures()` at `recorder-utils.ts:114` records `window.isSecureContext` — though the app doesn't currently block on it, the awareness is there.
- **No hardcoded secrets**: Comprehensive grep for `ghp_`, `sk_`, `Bearer`, `password`, `secret`, `token`, `apiKey`, `API_KEY`, `BEGIN PRIVATE KEY`, `aws_secret`, `AKIA…`, `xox…`, `gho_`, `ghu_`, `github_pat_`, `AIza…` returned **zero matches** in tracked files.
- **`.env` not git-tracked**: `.gitignore:34` excludes `.env*`. `git ls-files` confirms `.env` (containing only `DATABASE_URL=file:/home/z/my-project/db/custom.db`) is NOT committed.
- **Annotation import validation**: `use-annotations.ts:250-268` wraps `JSON.parse` in try/catch and validates each stroke's shape (`tool`, `color`, `size`, `points` types). Good defensive parsing.
- **Toast/clipboard**: `copyTechnicalDetails`, `copyStatsJson`, `copyManifest` use `navigator.clipboard.writeText` — safe (no `execCommand`). All clipboard writes are wrapped in try/catch.
- **No `target="_blank"` without `rel="noopener"`** issues found (no programmatic `window.open` calls).

---

#### SEC-020 — INFO — Canvas text rendering is XSS-safe (positive answer to task Q2)
The task specifically asked: "The app uses `dangerouslySetInnerHTML`? Check the annotation text tool (user types text that gets drawn on canvas — is this safe?). Check the watermark text input. Check any `innerHTML` usage."
**Answer:** Yes, all three are safe.
- **Annotation text**: User types into an `<input>` (`live-preview.tsx:503-523`) → committed via `annotations.commitText()` → stored as `stroke.text` (string) → drawn via `ctx.fillText(stroke.text, ...)` at `use-annotations.ts:204`. Canvas renders text as pixels; no DOM, no HTML parsing, no script execution. **Safe.**
- **Watermark text**: User types into an `<input>` (`control-panel.tsx:562-568`) → stored as `settings.watermarkText` (string) → drawn via `ctx.fillText`/`ctx.strokeText` at `use-recorder.ts:715-716`. **Safe.**
- **`innerHTML` usage**: Zero matches in `src/` (only the shadcn `chart.tsx` `dangerouslySetInnerHTML` at SEC-018, which is not used by the recorder).

### Summary Table

| ID | Severity | File:Line | Issue |
|----|----------|-----------|-------|
| SEC-001 | CRITICAL | Caddyfile:6-13 | Open reverse-proxy SSRF via `?XTransformPort=` |
| SEC-002 | HIGH | next.config.ts:3-10 | No CSP / no security headers |
| SEC-003 | HIGH | package.json | 80 dep vulnerabilities (1 critical, 42 high) |
| SEC-004 | HIGH | next.config.ts:7-9 | `ignoreBuildErrors: true`, `reactStrictMode: false` |
| SEC-005 | MEDIUM | control-panel.tsx:642 | Logo upload accepts SVG (XSS footgun) |
| SEC-006 | MEDIUM | control-panel.tsx:644-655 | Logo data URL not validated |
| SEC-007 | MEDIUM | control-panel.tsx:644-655 | No file-size limit on logo upload |
| SEC-008 | MEDIUM | use-recorder.ts:195-206,353-357 | localStorage prefs: no schema validation |
| SEC-009 | MEDIUM | shortcuts.ts:41-52 | localStorage shortcuts: unvalidated combos |
| SEC-010 | MEDIUM | package.json | Unnecessary backend/AI deps for "no backend" app |
| SEC-011 | MEDIUM | examples/websocket/server.ts:8-11 | Socket.IO `cors: origin: "*"` |
| SEC-012 | MEDIUM | upload/, .gitignore | `upload/` not gitignored; PNG tracked |
| SEC-013 | LOW | control-panel.tsx:562-568 | Watermark text input no `maxLength` |
| SEC-014 | LOW | live-preview.tsx:503-523 | Annotation text input no `maxLength` |
| SEC-015 | LOW | control-panel.tsx:652 | FileReader onerror silently swallowed |
| SEC-016 | LOW | scheduler.tsx:50,71-76 | `startAt` not `Number.isFinite` checked |
| SEC-017 | LOW | examples/websocket/frontend.tsx:36-43 | Polling fallback leaks XTransformPort in logs |
| SEC-018 | INFO | chart.tsx:83 | shadcn `dangerouslySetInnerHTML` (unused) |
| SEC-019 | INFO | src/ (multiple) | Good practices: no eval, streams stopped, URLs revoked, no secrets |
| SEC-020 | INFO | use-annotations.ts:204, use-recorder.ts:715-716 | Canvas text rendering is XSS-safe |

### Recommended Next Actions (priority order)
1. **Fix SEC-001 first** — remove or allowlist the `XTransformPort` block in `Caddyfile`. This is the only CRITICAL and is remotely exploitable as soon as the app is deployed with the bundled Caddyfile.
2. **Add security headers (SEC-002)** — single-file change to `next.config.ts`, large defense-in-depth win.
3. **Run `bun update --latest` (SEC-003)** and remove unused deps (SEC-010) — shrinks attack surface dramatically.
4. **Re-enable type safety (SEC-004)** — set `ignoreBuildErrors: false`, `reactStrictMode: true`, fix any TS errors.
5. **Harden file upload (SEC-005, SEC-006, SEC-007)** — drop SVG, validate data URL prefix, add 1 MB size limit.
6. **Validate localStorage (SEC-008, SEC-009)** — add field-by-field type/range validation in `loadPrefs()` and `loadShortcuts()`.
7. **Cleanup repo (SEC-011, SEC-012, SEC-017)** — delete `examples/`, gitignore `upload/` + `tool-results/`, untrack the PNG.
8. **Minor polish (SEC-013, SEC-014, SEC-015, SEC-016)** — `maxLength`, error toasts, finite-time guard.

### No fixes applied
Per task scope ("Do NOT fix anything — just report findings"), no source files were modified. Only this worklog entry was appended.


---

## Round 13 — Code Review + Architecture Audit (CODE-1)

### Task ID: CODE-1
### Agent: Code Reviewer
### Task: Deep code review + architecture audit of Web Pro Record — architecture, code quality, state management, memory leaks, React best practices, TypeScript quality, error handling, accessibility.

### Scope & Methodology
Audited the full `src/` tree (~7,800 LOC across `src/hooks/` (2 files, 2,426 LOC), `src/components/recorder/` (21 files, ~3,700 LOC), `src/lib/` (8 files, ~1,500 LOC), `src/app/` (3 files)). Ran `npx tsc --noEmit` (0 errors in `src/`; 4 errors in `examples/` + `skills/` which are external demos), `npx eslint src/` (0 output — but only because nearly every meaningful rule is disabled, see CODE-002), and ripgrep scans for: `as any` / `as unknown` / `as Partial` / `as ShortcutMap` (10 hits), `!.current!` / non-null assertions (6 hits), `@ts-ignore` / `@ts-expect-error` (0 hits — good), `catch {}` silent blocks (29 hits), `addEventListener` / `removeEventListener` (4 add / 1 remove — imbalance), `setInterval` / `setTimeout` (5 + 8), `URL.createObjectURL` / `revokeObjectURL` (5 create / many revoke — balanced), and `aria-` / `role=` (40+ hits — decent coverage). Read all 32 source files in full.

### Executive Summary
The codebase is **functional and feature-complete** (11 rounds of additions, ~7,800 LOC, all claimed features present). TypeScript compiles cleanly (`tsc --noEmit` = 0 errors in `src/`). Media-stream lifecycle is **mostly correct** (11 `createObjectURL` calls all have matching `revokeObjectURL`; streams stopped in `cleanupMedia`/`cleanupAll`; canvas-text rendering is XSS-safe per SEC-020). The `useAnnotations` hook is a **good architectural example** of separation (301 LOC, focused, no media dependencies).

However, the codebase has **39 findings** spanning: a **CRITICAL** memory leak in webcam re-acquisition (camera light stays on, frames keep flowing), a **HIGH-severity** architectural problem (the `useRecorder` hook is 2,125 lines — a "god hook"), a **HIGH-severity** lint configuration problem (essentially all meaningful rules disabled, so "0 lint errors" is meaningless), a **HIGH-severity** DOM-selector bug in the recording timeline (binds to the wrong `<video>` element when clips exist), a **HIGH-severity** race condition in the countdown timer (uncancellable recursive `setTimeout`), and a broad pattern of **silent error swallowing** (29 `catch {}` blocks), **dead code** (4 `void X;` hacks), **DRY violations** (7 near-identical download functions, 3 near-identical clipboard functions), **state-updater side effects** (4 places doing `setState` inside another `setState` updater), and **stale-closure / missing-deps** issues masked by `react-hooks/exhaustive-deps: off`.

No fixes were applied per task scope. This is a report only.

### Findings (39 total: 1 CRITICAL, 5 HIGH, 14 MEDIUM, 14 LOW, 5 INFO)

---

#### CODE-001 — CRITICAL — `enableWebcam()` overwrites stream ref without stopping previous tracks (memory leak + camera light stuck)
- **File:** `src/hooks/use-recorder.ts:620-651`
- **Problem:**
  ```ts
  const enableWebcam = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      ...
      webcamStreamRef.current = stream;   // ← previous stream overwritten, never stopped
      setWebcamStream(stream);
      ...
    } catch (e) { ... }
  }, [selectedCameraId]);
  ```
  When the user changes the camera device while the webcam is enabled (or any other path that calls `enableWebcam` while a stream is already held), the previous `MediaStream` is silently overwritten in both the ref and state. Its video tracks are **never `.stop()`'d**. The browser keeps the camera device open, the camera LED stays lit, and frames keep being captured into the orphaned stream until the page is unloaded.
- **Root cause:** `enableWebcam` is called from three places: (1) `toggleWebcam(true)` on first enable (no prior stream — safe), (2) the `selectedCameraId` watcher effect at line 671-679 (re-acquire on device change — leaks the old stream), and (3) implicitly via the camera `<Select>` change handler. None of these call `stopStream(webcamStreamRef.current)` before overwriting.
- **Impact:** On a real device, the camera LED stays on for every camera switch. Each leaked stream holds a `MediaStreamTrack` + its underlying media pipeline. After 5 camera switches, 5 orphaned tracks accumulate. On mobile, this drains battery and blocks other apps from using the camera. Also leaks `MediaStream` objects in JS heap.
- **Recommended fix:** Add at the top of `enableWebcam`, before `getUserMedia`:
  ```ts
  if (webcamStreamRef.current) {
    stopStream(webcamStreamRef.current);
    webcamStreamRef.current = null;
  }
  ```
  (Or have the device-change effect call `stopWebcamPreview()` first, then `enableWebcam()`.)

---

#### CODE-002 — HIGH — ESLint config disables essentially every meaningful rule
- **File:** `eslint.config.mjs:11-44`
- **Problem:** The ESLint config turns OFF: `@typescript-eslint/no-explicit-any`, `@typescript-eslint/no-unused-vars`, `@typescript-eslint/no-non-null-assertion`, `@typescript-eslint/ban-ts-comment`, `@typescript-eslint/prefer-as-const`, `@typescript-eslint/no-unused-disable-directive`, `react-hooks/exhaustive-deps`, `react-hooks/purity`, `react-hooks/set-state-in-effect`, `react-compiler/react-compiler`, `react/no-unescaped-entities`, `react/display-name`, `react/prop-types`, `@next/next/no-img-element`, `@next/next/no-html-link-for-pages`, `prefer-const`, `no-unused-vars`, `no-console`, `no-debugger`, `no-empty`, `no-irregular-whitespace`, `no-case-declarations`, `no-fallthrough`, `no-mixed-spaces-and-tabs`, `no-redeclare`, `no-undef`, `no-unreachable`, `no-useless-escape`.
  The worklog (Rounds 1-11) repeatedly claims "All React Compiler rules satisfied" and "0 errors, 0 warnings" — but with all rules off, lint provides zero safety net. The `react-compiler/react-compiler` rule is OFF, contradicting the worklog.
- **Root cause:** Rules were disabled one-by-one during initial development to ship fast; never re-enabled.
- **Impact:** Latent bugs slip through: silent `catch {}` (CODE-007), dead imports masked by `void X;` hacks (CODE-008), missing `useEffect` deps (CODE-019), non-null assertions (CODE-006), `no-unreachable` would catch dead code after early returns, `prefer-const` would catch reassignments, etc. "0 lint errors" gives false confidence.
- **Recommended fix:** Re-enable the core rules: `@typescript-eslint/no-unused-vars` (with `argsIgnorePattern: "^_"`), `@typescript-eslint/no-non-null-assertion` (warn), `react-hooks/exhaustive-deps` (warn), `no-empty` (warn), `no-unreachable` (error), `prefer-const` (error), `no-debugger` (error), `no-console` (warn in production). Fix the resulting warnings/errors. Keep `react-hooks/set-state-in-effect` off if the legit mount-detection pattern is still needed.

---

#### CODE-003 — HIGH — Recording timeline binds to wrong `<video>` element when clips exist
- **File:** `src/components/recorder/recording-timeline.tsx:24, 43`
- **Problem:**
  ```ts
  const video = document.querySelector<HTMLVideoElement>("video[controls][src]");
  ```
  This selector matches the **first** `<video controls src="...">` in DOM order. Both the `ClipsGallery` (`clips-gallery.tsx:81`) and the `FinalRecording` (`final-recording.tsx:111`) render `<video src={...} controls playsInline />`. In `page.tsx`, `ClipsGallery` is rendered **before** `FinalRecording` (lines 318 vs 320). When any clip exists, the timeline attaches its `loadedmetadata` / `durationchange` / `timeupdate` listeners to a **clip video**, not the final recording. The timeline playhead + duration then reflect the clip's playback, not the main recording's.
- **Root cause:** Fragile global DOM selector instead of a ref-based prop channel.
- **Impact:** Confusing UX: clicking a snapshot marker on the timeline seeks a random clip instead of the main recording. The bar's "00:30 / 02:15" counter shows the wrong values when a clip is playing.
- **Recommended fix:** Lift the `<video>` ref from `FinalRecording` up to `page.tsx` (or use a context), and pass it down to `RecordingTimeline` as a prop. Replace `document.querySelector` with the passed ref.

---

#### CODE-004 — HIGH — `useRecorder` hook is a 2,125-line monolith (god hook)
- **File:** `src/hooks/use-recorder.ts` (entire file, 2,126 lines)
- **Problem:** A single React hook manages: 22 `useState` declarations, 30+ `useRef` declarations, 11 `useEffect` blocks, 30+ `useCallback` actions, and the entire lifecycle of: screen capture, webcam, mic, system audio, AudioContext mixing, canvas compositing (webcam overlay + watermark + logo + annotations), MediaRecorder, chunk collection, blob/URL management, FPS measurement, adaptive FPS downgrade, waveform, snapshots, clips, PiP, live stats, profiling, history (in-memory), JSON export, clipboard copy, settings persistence. The `startRecording` function alone is **310 lines** (1490-1802) with a deeply nested try/catch and an inline `recorder.onstop` handler that is **115 lines** (1658-1772) and duplicates cleanup logic from `cleanupMedia`.
- **Root cause:** 11 rounds of incremental feature additions, each adding state/refs/actions to the same hook without refactoring boundaries. Each round's worklog entry notes "Hook architecture: new X state/refs/actions" but never splits the hook.
- **Impact:** (a) Unmaintainable — any change risks breaking unrelated features. (b) Untestable — `startRecording` has so many side effects and branches that unit testing is impractical. (c) Re-render cascade — every state change in the hook re-renders every consumer of `useRecorder`, even if they only care about one slice. (d) High cognitive load — onboarding a new dev requires reading 2,100 lines. (e) Bug-prone — the duplication between `cleanupMedia` and `recorder.onstop` (CODE-016) already shows drift.
- **Recommended fix:** Split into focused hooks, each owning a slice of state + refs + actions:
  - `useRecorderSettings(lang)` — settings + persistence + `updateSettings` + `applyPreset`
  - `useMediaCapture(settings)` — screen + webcam + mic acquisition, refs, `cleanupMedia`
  - `useCanvasCompositor(canvasRef, settings, mediaRefs, drawAnnotations)` — `renderCompositeFrame`, `drawWatermark`, render loop, FPS measurement, adaptive downgrade
  - `useAudioMixer(mediaRefs, settings)` — AudioContext + AnalyserNode + mic level + waveform
  - `useMediaRecorder(compositeStream, settings)` — MediaRecorder + chunks + onstop + blob/URL
  - `useStatsTracker()` — `RecordingStats` + `ProfilingData` + live stats interval
  - `useSnapshotsClips(canvasRef, combinedStreamRef)` — snapshots + clips
  - `useRecordingHistory()` — history + restore + manifest
  - `useRecorderOrchestrator(...)` — composes the above, exposes the state machine
  Each hook returns its own slice; the orchestrator merges them. Consumers select slices via `useRecorderSelector` or just import the focused hook directly.

---

#### CODE-005 — HIGH — Countdown timer is uncancellable; recursive `setTimeout` fires after cancel
- **File:** `src/hooks/use-recorder.ts:1188-1207`
- **Problem:**
  ```ts
  const runCountdown = useCallback(
    (seconds: number) =>
      new Promise<void>((resolve) => {
        setCountdownValue(seconds);
        setStatus("countdown");
        let remaining = seconds;
        const tick = () => {
          setCountdownValue(remaining);
          if (remaining <= 0) { setCountdownValue(null); resolve(); return; }
          remaining -= 1;
          setTimeout(tick, 1000);   // ← never tracked, never cleared
        };
        tick();
      }),
    [],
  );
  ```
  The `setTimeout(tick, 1000)` handle is discarded. `cancelCountdown` (line 1865) does `setCountdownValue(null); setStatus("idle");` but the queued `setTimeout` is still pending. ~1 second later, `tick` fires again and calls `setCountdownValue(remaining)` (where `remaining` is the stale pre-cancel value), causing a phantom countdown number to briefly reappear. Worse: `startRecording` `await`s this Promise; if the user cancels mid-countdown, `runCountdown` never resolves (the only `resolve()` is at `remaining <= 0`), so `startRecording` hangs forever in the `await` — until the next `tick` eventually reaches 0 and resolves. Between cancel and that resolution, `startRecording` is suspended, but its already-captured closures hold resources.
- **Root cause:** No `countdownTimerRef` to track the timeout; no rejection path on cancel.
- **Impact:** (1) Phantom countdown number flashes after Escape. (2) `startRecording`'s `await runCountdown(...)` never resolves if cancelled, leaving the async function suspended. (3) If the component unmounts during countdown, `tick` still fires and calls `setState` on an unmounted component (React 18 tolerates this but it's a warning).
- **Recommended fix:**
  ```ts
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runCountdown = useCallback((seconds: number) =>
    new Promise<void>((resolve, reject) => {
      let remaining = seconds;
      const tick = () => {
        setCountdownValue(remaining);
        if (remaining <= 0) { setCountdownValue(null); resolve(); return; }
        remaining -= 1;
        countdownTimerRef.current = setTimeout(tick, 1000);
      };
      tick();
    }), []);
  const cancelCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdownValue(null);
    setStatus("idle");
  }, []);
  ```

---

#### CODE-006 — MEDIUM — 6 non-null assertions (`!`) bypass null safety on refs
- **File:** `src/hooks/use-recorder.ts:722, 1137, 1145, 1583, 1600, 1616`
- **Problem:** Six `ref.current!` assertions, e.g.:
  - `722`: `const img = watermarkLogoImgRef.current!;` — guarded by `watermarkLogoReadyRef.current && watermarkLogoImgRef.current` at line 698, so logically safe today, but the assertion lies to TS.
  - `1137`: `ctx.createMediaStreamSource(screenStreamRef.current!)` — inside `if (hasScreenAudio)` which checks `screenStreamRef.current?.getAudioTracks() ?? []`, so `screenStreamRef.current` is non-null in practice, but the assertion is implicit.
  - `1583`: `const sVideo = screenVideoRef.current!;` — `ensureHiddenVideos()` was called 73 lines above, but if the document was headless at that moment, `screenVideoRef.current` could be null.
  - `1600`: `const wVideo = webcamVideoRef.current!;` — guarded by `if (s.webcamEnabled && webcamStreamRef.current)` but `webcamVideoRef.current` is set inside `ensureHiddenVideos` which may not have run if `document === undefined`.
  - `1616`: `const canvas = canvasRef.current!;` — guarded by `!!canvasRef.current` at line 1613, so safe.
- **Root cause:** `@typescript-eslint/no-non-null-assertion` is off; convenient but fragile.
- **Impact:** If a guard is ever refactored away, the assertion silently becomes a runtime `TypeError: Cannot read properties of null`.
- **Recommended fix:** Replace `ref.current!` with an explicit `if (!ref.current) return;` guard, or `const x = ref.current; if (!x) return;`. Re-enable `@typescript-eslint/no-non-null-assertion` (CODE-002).

---

#### CODE-007 — MEDIUM — 24 silent `catch {}` blocks swallow errors with no logging or user feedback
- **File:** `src/hooks/use-recorder.ts` (24 instances), `src/lib/recorder-utils.ts` (2), `src/lib/shortcuts.ts` (2), `src/app/page.tsx` (2), `src/hooks/use-annotations.ts` (2)
- **Problem:** Empty catch blocks like:
  ```ts
  try { tr.stop(); } catch { /* ignore */ }
  try { void audioContextRef.current.close(); } catch { /* ignore */ }
  try { rec.stop(); } catch { /* ignore */ }
  try { drawAnnotations(ctx); } catch { /* ignore annotation errors */ }
  try { /* thumbnail may fail */ } catch { /* ignore */ }
  ```
  Across the codebase, 29 `catch {}` blocks discard errors entirely. `no-empty` is off, so lint doesn't flag them. There is no `console.warn`, no toast, no telemetry.
- **Root cause:** `no-empty` rule disabled; defensive coding taken too far.
- **Impact:** When something goes wrong in production (AudioContext fails to close, canvas tainted, MediaRecorder.stop throws, annotation draw crashes), there is **zero signal** for debugging. Users report "it just doesn't work" and devs have nothing to go on. Some of these are legitimate (e.g., `tr.stop()` on an already-stopped track throws `InvalidStateError` and that's expected), but most aren't.
- **Recommended fix:** At minimum, add `console.warn("useRecorder: failed to X", e)` to each catch. For user-facing failures (MediaRecorder stop, AudioContext close, canvas drawImage), surface a toast. Keep the truly expected-empty catches (tr.stop on stopped track) but mark them with a comment explaining why. Re-enable `no-empty` (CODE-002).

---

#### CODE-008 — MEDIUM — Dead code: `void X;` hacks to silence unused-import warnings
- **Files:**
  - `src/components/recorder/help-section.tsx:97` — `void cn;` (`cn` imported but never used in JSX)
  - `src/components/recorder/shortcut-editor.tsx:191-192` — `void (undefined as unknown as Lang);` and `void loadShortcuts;` (both imports already referenced or genuinely unused)
  - `src/components/recorder/waveform-viz.tsx:111` — `void (undefined as unknown as Lang);` (`Lang` is already used in the `Props` type at line 12)
- **Problem:** These `void X;` statements are workarounds for `no-unused-vars` — but that rule is OFF (CODE-002), so the hacks are pure dead code that ships to production. They also signal that the imports were once needed and then orphaned by a refactor.
- **Root cause:** Imports removed during refactoring; `void` statement left behind as a "just in case" or to silence a now-disabled rule.
- **Impact:** Minor bundle bloat (`cn`, `loadShortcuts` included in chunk). Reader confusion ("why is this here?").
- **Recommended fix:** Delete the `void X;` lines and the corresponding unused imports. Re-enable `@typescript-eslint/no-unused-vars` (CODE-002) to catch future orphans at lint time.

---

#### CODE-009 — MEDIUM — DRY violation: 7 near-identical `download*` functions
- **Files:** `src/hooks/use-recorder.ts:1250-1257, 1329-1337, 1404-1413, 1870-1880, 1931-1943, 1977-1989`; `src/hooks/use-annotations.ts:235-247`
- **Problem:** Seven functions follow the exact same pattern:
  ```ts
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // (sometimes followed by URL.revokeObjectURL(url))
  ```
  Implemented independently in: `downloadSnapshot`, `downloadClip`, `downloadHistoryEntry`, `downloadVideo`, `downloadStatsJson`, `downloadManifest`, `downloadJson` (annotations).
- **Root cause:** Copy-paste across 11 rounds of additions; no shared helper extracted.
- **Impact:** 7× duplicated DOM manipulation; any fix (e.g., adding `rel="noopener"`, or a download-started toast) must be applied 7 times. Inconsistent timestamp formatting between them (`new Date().toISOString().slice(0,19).replace(/[:T]/g,"-")` repeated 4 times).
- **Recommended fix:** Extract to `recorder-utils.ts`:
  ```ts
  export function triggerDownload(url: string, filename: string, revoke = false): void {
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    if (revoke) URL.revokeObjectURL(url);
  }
  export function timestampSlug(d = new Date()): string {
    return d.toISOString().slice(0, 19).replace(/[:T]/g, "-");
  }
  ```

---

#### CODE-010 — MEDIUM — DRY violation: 3 near-identical `copy*` clipboard functions
- **Files:** `src/hooks/use-recorder.ts:1882-1900, 1946-1953, 1992-1999`
- **Problem:** `copyTechnicalDetails`, `copyStatsJson`, `copyManifest` all do:
  ```ts
  try { await navigator.clipboard.writeText(text); return true; }
  catch { return false; }
  ```
- **Root cause:** Copy-paste across Rounds 6 + 9.
- **Impact:** 3× duplication; silent failure (no toast on `false` return — the caller decides, but inconsistent: `FinalRecording.handleCopy` shows a "copied" checkmark only on success but no error toast on failure; `HistoryPanel` shows `manifestCopied` OR `manifestEmpty` but never an error variant).
- **Recommended fix:** Extract `async function copyToClipboard(text: string): Promise<boolean>` into `recorder-utils.ts`. Standardize the failure-UX (toast on failure).

---

#### CODE-011 — MEDIUM — Unsafe `as` casts on `JSON.parse` output (localStorage)
- **Files:** `src/hooks/use-recorder.ts:200-202`; `src/lib/shortcuts.ts:46-48`
- **Problem:**
  ```ts
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") return parsed as Partial<PersistablePrefs>;
  // shortcuts.ts:
  const parsed = JSON.parse(raw) as Partial<ShortcutMap>;
  return { ...DEFAULT_SHORTCUTS, ...parsed } as ShortcutMap;
  ```
  No field-level validation. A malicious or corrupted localStorage payload (e.g., `{watermarkText: 12345, quality: "4320"}`) is blindly spread over `DEFAULT_SETTINGS`. Downstream code calls `s.watermarkText?.trim()` (crashes if number), `Math.round(h * s.watermarkLogoSize)` (NaN if string), etc.
- **Root cause:** `JSON.parse` + bare cast without runtime validation.
- **Impact:** Persistent client-side DoS via crafted localStorage (also noted in SEC-008). The cast `as ShortcutMap` actively lies to TypeScript.
- **Recommended fix:** Field-by-field validation in `loadPrefs()` and `loadShortcuts()` (sketched in SEC-008). Consider `zod` for schema validation if many fields.

---

#### CODE-012 — MEDIUM — Side effects inside state updater functions (anti-pattern)
- **Files:**
  - `src/hooks/use-recorder.ts:1370-1400` — `restoreHistoryEntry` calls `setResult`, `setRecordingStats`, `setStatus` inside `setHistory` updater.
  - `src/hooks/use-recorder.ts:1347-1355` — `removeHistoryEntry` calls `URL.revokeObjectURL` inside `setHistory` updater.
  - `src/hooks/use-recorder.ts:1359-1366` — `clearHistory` same pattern.
  - `src/hooks/use-recorder.ts:1314-1320` — `removeClip` same.
  - `src/hooks/use-recorder.ts:1322-1327` — `clearClips` same.
  - `src/hooks/use-recorder.ts:585-588` — `cleanupAll` revokes clip URLs inside `setClips` updater.
  - `src/hooks/use-annotations.ts:93-100` — `endStroke` calls `setStrokes` inside `setActiveStroke` updater.
- **Problem:** React state updaters (`(prev) => next`) should be **pure**. Calling `setState`, `URL.revokeObjectURL`, or any side effect inside them is an anti-pattern. In React Strict Mode (off here per `next.config.ts`, but if re-enabled per SEC-004), updaters run **twice** in dev — `URL.revokeObjectURL` would be called twice (second call is a no-op, but side effects compound).
- **Root cause:** Convenient access to `prev` for finding the entry to revoke/restore.
- **Impact:** Today: works because Strict Mode is off. Future: if `reactStrictMode: true` is re-enabled (SEC-004 recommendation), these will misbehave. Also makes the code harder to reason about (state changes have observable side effects).
- **Recommended fix:** Read current state from a ref, do the side effect, then call `setState` with the new value:
  ```ts
  const removeClip = useCallback((id: string) => {
    const clip = clipsRef.current.find((c) => c.id === id);
    if (clip) URL.revokeObjectURL(clip.url);
    setClips((prev) => prev.filter((c) => c.id !== id));
  }, []);
  ```

---

#### CODE-013 — MEDIUM — Keyboard handler effect re-subscribes on every `rec` change (perf waste)
- **File:** `src/app/page.tsx:128-195`
- **Problem:**
  ```ts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { ... uses rec.isRecording, rec.settings, rec.captureSnapshot, etc. ... };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts, rec, toggleLang, toggleTheme]);  // ← rec changes on every recorder state update
  ```
  The `rec` object is recreated whenever **any** state inside `useRecorder` changes — including `elapsed` (updates every 250ms during recording via `setInterval`), `micLevel` (every animation frame), `waveform` (every animation frame), `liveStats` (every 500ms), `actualFps` (every 1s), etc. So during recording, this effect's cleanup + re-subscribe runs **multiple times per second**, churning the event listener.
- **Root cause:** `rec` is in the deps because the closure uses many `rec.X` fields. The page already maintains `recRef = useRef(rec)` (line 70) and syncs it via effect (line 71-73) — but doesn't use it in the keyboard handler.
- **Impact:** During recording, `addEventListener`/`removeEventListener` is called ~4-8×/sec. Each call is cheap but cumulatively wasteful, and it forces the handler closure to be rebuilt constantly. May contribute to jank on low-end devices.
- **Recommended fix:** Use `recRef.current` inside the handler instead of `rec`, and drop `rec` from deps:
  ```ts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const r = recRef.current;
      // ... use r.isRecording, r.settings, etc.
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts, toggleLang, toggleTheme]);
  ```

---

#### CODE-014 — MEDIUM — PiP video element + event listeners never cleaned up
- **File:** `src/hooks/use-recorder.ts:1416-1434`
- **Problem:** `ensurePipVideo()` creates a hidden `<video>` element, appends it to `document.body`, and attaches `enterpictureinpicture` / `leavepictureinpicture` listeners. The element + listeners persist for the page lifetime. `cleanupMedia` (line 520-522) only sets `pipVideoRef.current.srcObject = null` — it does NOT remove the element from the DOM, does NOT remove the event listeners, and does NOT exit PiP (well, it does exit PiP at line 511-517, but not always). On hook unmount (`cleanupAll` → `cleanupMedia`), the hidden `<video>` is orphaned in `document.body`.
- **Root cause:** `ensurePipVideo` is called once per recording session; the element is reused. There's no teardown path that removes it.
- **Impact:** (1) Hidden DOM node leaks across hot-reloads in dev. (2) Two event listeners leak per session. (3) If the user navigates away and back (SPA), each mount creates a new PiP video, leaving the old ones in the DOM. (4) Memory: the video element holds a reference to the last `srcObject` stream until GC.
- **Recommended fix:** In `cleanupMedia` or `cleanupAll`:
  ```ts
  if (pipVideoRef.current) {
    pipVideoRef.current.srcObject = null;
    pipVideoRef.current.remove();  // removes from DOM
    pipVideoRef.current = null;
  }
  ```
  Use named listener functions so they can be `removeEventListener`'d, or rely on `.remove()` to drop all listeners (the GC will collect them once the element is detached and no other refs exist).

---

#### CODE-015 — MEDIUM — `startRecording` is a 310-line function with 115-line inline `onstop` (high cyclomatic complexity)
- **File:** `src/hooks/use-recorder.ts:1490-1802`
- **Problem:** `startRecording` is a single `useCallback` of ~310 lines with: nested try/catch (3 levels), an `await runCountdown`, an `await getDisplayMedia`, an `await getUserMedia`, an `await new Promise` for `loadedmetadata`, a `vTrack.addEventListener("ended", ...)`, an inline `recorder.ondataavailable`, `recorder.onerror`, `recorder.onstop` (115 lines), then 6 lines of `recorder.start() + setStatus + startTimer + startStatsLoop + startProfiling + startFpsMeasurement + setInterval(checkAdaptiveFps) + startMicLevelLoop + startWaveformLoop`. The dependency array has 17 entries.
- **Root cause:** Incremental growth across Rounds 1, 3, 4, 5, 7, 8, 10, 11 — each round added a few lines to `startRecording` and a few to `onstop` without extracting helpers.
- **Impact:** (a) Untestable without mocking 10+ browser APIs. (b) The 115-line `onstop` handler is especially error-prone — it must mirror `cleanupMedia`'s teardown but also build the result blob + compute stats + add to history. (c) High risk of partial-failure states: if `getUserMedia` for mic fails (caught at 1568-1576), the function continues with screen-only — but if `buildMixedAudio` later fails (no try/catch around line 1627), the whole recording aborts via the outer catch at 1798-1801, leaking the screen stream (because `cleanupMedia` is called, but the order of ref-nulling vs. stream-stopping is fragile).
- **Recommended fix:** Extract `setupScreenCapture()`, `setupMicrophone()`, `setupCanvasCompositor()`, `buildCombinedStream()`, `createMediaRecorder()`, `finalizeRecording()` (the `onstop` body) as separate functions. Each returns its slice of state; `startRecording` becomes a 30-line orchestrator.

---

#### CODE-016 — MEDIUM — `recorder.onstop` duplicates `cleanupMedia` logic (drift risk)
- **File:** `src/hooks/use-recorder.ts:1658-1772` vs `477-563`
- **Problem:** The `onstop` handler manually: stops `screenStreamRef`, `micStreamRef`, `combinedStreamRef`; nulls their refs; closes `audioContextRef`; nulls `audioDestRef` + `analyserRef`; detaches `sVideo.srcObject`; cancels `rafRef`, `micLevelRafRef`, `timerRef`, `statsTimerRef`, `fpsMeasureRafRef`, `waveformRafRef`, `downgradeCheckRef`; resets `actualFps`/`fpsDowngraded`/`effectiveFps`/`waveform`. This is ~70% identical to `cleanupMedia` (477-563). The difference: `onstop` keeps the webcam stream for idle preview; `cleanupMedia` stops it.
- **Root cause:** `cleanupMedia` stops the webcam stream, but `onstop` wants to keep it. So `onstop` was written as a parallel cleanup rather than parameterizing `cleanupMedia`.
- **Impact:** If a new ref/timer/stream is added in Round 12, the developer must remember to add it to BOTH `cleanupMedia` AND `onstop`. Easy to forget → leak. Already, `cleanupMedia` clears `pipActive` and exits PiP (510-518), but `onstop` does NOT — so stopping a recording leaves PiP active (the hidden video keeps playing the now-stopped stream — actually the stream is stopped so PiP shows a frozen frame).
- **Recommended fix:** Parameterize `cleanupMedia({ keepWebcam?: boolean, exitPiP?: boolean })` and call it from `onstop` with `{ keepWebcam: true, exitPiP: true }`. Single source of truth.

---

#### CODE-017 — MEDIUM — `loadPrefs` accepts any object shape without field validation
- **File:** `src/hooks/use-recorder.ts:195-206`
- **Problem:**
  ```ts
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") return null;
  return parsed as Partial<PersistablePrefs>;
  ```
  No check that `parsed` is not an array (`typeof [] === "object"`). No field-type checks. The downstream merge `setSettings((prev) => ({ ...prev, ...prefs }))` blindly spreads.
- **Root cause:** Same as CODE-011 / SEC-008.
- **Impact:** Same as SEC-008 — persistent client-side DoS, NaN propagation, crashes.
- **Recommended fix:** `if (Array.isArray(parsed)) return null;` + per-field type/range validation (sketched in SEC-008). Recommend extracting a `validatePrefs(obj): Partial<PersistablePrefs>` pure function that can be unit-tested.

---

#### CODE-018 — MEDIUM — `useEffect` watches `settings.watermarkLogoDataUrl` but reads `settingsRef.current.watermarkLogoDataUrl`
- **File:** `src/hooks/use-recorder.ts:361-377`
- **Problem:**
  ```ts
  useEffect(() => {
    const dataUrl = settingsRef.current.watermarkLogoDataUrl;   // ← reads from ref
    if (!dataUrl) { ... return; }
    const img = new Image();
    img.onload = () => { watermarkLogoReadyRef.current = true; };
    ...
  }, [settings.watermarkLogoDataUrl]);   // ← dep is the state value
  ```
  The effect depends on `settings.watermarkLogoDataUrl` (the state) but reads `settingsRef.current.watermarkLogoDataUrl` (the ref). These are usually in sync (the ref-sync effect at line 345-347 runs after every render), but in edge cases (rapid updates within the same commit) the ref may lag the state by one render. The effect could read a stale ref value while being triggered by the new state value.
- **Root cause:** Mixed use of state (in deps) and ref (in body) for the same field.
- **Impact:** Low probability, but if it manifests, the watermark logo image would be loaded from the wrong data URL. Hard to debug.
- **Recommended fix:** Read from the dep directly: `const dataUrl = settings.watermarkLogoDataUrl;`. Or depend on `[]` and read only from the ref. Don't mix.

---

#### CODE-019 — MEDIUM — Missing `useEffect` deps masked by `react-hooks/exhaustive-deps: off`
- **Files:** `src/hooks/use-recorder.ts:671-679` (missing `settings.webcamEnabled`, `status`, `enableWebcam`); `src/app/page.tsx:67-69` (`annotationsRef` effect deps `[annotations]` is OK); others.
- **Problem:** With `exhaustive-deps` off, missing deps don't error. The `selectedCameraId` watcher at 671 reads `settings.webcamEnabled`, `status`, and calls `enableWebcam` — none are in deps. Today it works because `enableWebcam` is recreated when `selectedCameraId` changes (its dep), and the effect re-runs on `selectedCameraId` change, capturing fresh closures. But if someone changes `enableWebcam`'s deps, this effect could capture a stale `enableWebcam`.
- **Root cause:** Rule disabled (CODE-002).
- **Impact:** Latent stale-closure bugs; brittle to refactoring.
- **Recommended fix:** Re-enable `react-hooks/exhaustive-deps` as a warning (CODE-002). Add missing deps. For effects that intentionally use refs to avoid re-runs, add an `// eslint-disable-next-line react-hooks/exhaustive-deps` with a comment explaining why.

---

#### CODE-020 — MEDIUM — `presets.ts` re-exports `OutputQuality` and `FrameRate` types from other modules
- **File:** `src/lib/presets.ts:83`
- **Problem:** `export { type OutputQuality, type FrameRate };` re-exports types that `presets.ts` imports from `@/lib/recorder-utils` and `@/lib/i18n`. This creates two import paths for the same type: `import type { OutputQuality } from "@/lib/recorder-utils"` vs `import type { OutputQuality } from "@/lib/presets"`. Some files use one, some use the other.
- **Root cause:** Convenience re-export.
- **Impact:** Confusing for new contributors ("which is the canonical source?"). Risk of circular imports if `presets.ts` ever imports from a file that imports from `presets.ts`.
- **Recommended fix:** Remove the re-export. Update `control-panel.tsx:40` (`import type { Lang, OutputQuality as Q } from "@/lib/i18n"`) — `OutputQuality` should come from `@/lib/recorder-utils`, not `@/lib/i18n` (it's defined in `recorder-utils.ts:4`, though `i18n.ts:8` also defines it — itself a duplicate, see INFO below).

---

#### CODE-021 — LOW — Inconsistent error vs. warning severity for permission denials
- **File:** `src/hooks/use-recorder.ts:1525-1530` (screen denied → `setError`), `1570-1576` (mic denied → `setWarning`), `644-650` (cam denied → `setError`)
- **Problem:** Screen-denied and cam-denied both call `setError` (toast variant=destructive, red). Mic-denied calls `setWarning` (toast default variant, gray). Same `NotAllowedError` pattern, different UX severity.
- **Root cause:** Mic denial is non-fatal (recording continues without mic), so it's a warning. Screen denial is fatal (no screen = no recording), so it's an error. Cam denial is non-fatal too but is treated as error — inconsistent with mic.
- **Impact:** Cam denial shows a scary red toast for a non-fatal condition.
- **Recommended fix:** Change cam-denied to `setWarning("warnCamNoStream")` for consistency with mic. Or define a clear policy: fatal = error, non-fatal = warning, and apply uniformly.

---

#### CODE-022 — LOW — Obscure chained regex for webcam position i18n key
- **File:** `src/components/recorder/control-panel.tsx:406`
- **Problem:**
  ```ts
  {t(`pos${p.replace(/-(.)/g, (_, c) => c.toUpperCase()).replace(/^./, (c) => c.toUpperCase())}`)}
  ```
  Converts `top-left` → `topLeft` → `TopLeft` → `posTopLeft`. Two chained regexes with capture groups, hard to read, no comment.
- **Root cause:** Compactness over clarity.
- **Impact:** Future contributors must mentally execute the regex to understand which i18n key is being looked up. Risk of typo breaking all 4 position labels silently (would render the raw key like `posTopLeft`).
- **Recommended fix:** Use a lookup map:
  ```ts
  const POS_KEY: Record<WebcamPosition, string> = {
    "top-left": "posTopLeft", "top-right": "posTopRight",
    "bottom-left": "posBottomLeft", "bottom-right": "posBottomRight",
  };
  // ...
  {t(POS_KEY[p])}
  ```

---

#### CODE-023 — LOW — `useRecorder` returns 60+ values in a flat object
- **File:** `src/hooks/use-recorder.ts:2030-2122`
- **Problem:** The hook returns a single flat object with ~60 properties: 22 state values, 30+ action callbacks, 4 helper functions (`formatDuration`, `formatBytes`, `mimeToLabel` — pure functions that don't belong on the hook), and 4 derived booleans. Consumers do `const rec = useRecorder(...)` and access `rec.X` — every consumer re-renders when any of the 60 values changes.
- **Root cause:** Organic growth; no selector pattern.
- **Impact:** Performance: every `elapsed` tick (250ms) re-renders every component that consumes `rec`, even if it only cares about `rec.settings.webcamEnabled`. Bundle: tree-shaking can't drop unused actions because they're all on one object.
- **Recommended fix:** Group into `rec.state`, `rec.actions`, `rec.derived` sub-objects (useMemo'd). Or adopt a selector pattern: `const webcamEnabled = useRecorder(s => s.settings.webcamEnabled)`. Or split the hook (CODE-004) and let components import only the slice they need.

---

#### CODE-024 — LOW — `formatBytes` and `formatDuration` handle invalid input inconsistently
- **File:** `src/lib/recorder-utils.ts:13-20, 23-29`
- **Problem:** `formatDuration` clamps negatives/NaN to `0` and returns `"00:00"`. `formatBytes` returns `"0 B"` for `!bytes || bytes < 0` — but for `NaN`, `!NaN` is `true`, so it returns `"0 B"` (OK). For `Infinity`, `Math.log(Infinity)` is `Infinity`, `Math.floor(Infinity)` is `Infinity`, `Math.min(3, Infinity)` is `3`, `Math.pow(1024, 3)` is fine, `Infinity / 1024**3` is `Infinity`, `toFixed(1)` returns `"Infinity"`, so it returns `"Infinity GB"`. Inconsistent with duration's clamp.
- **Root cause:** Different authors / different days.
- **Impact:** If `result.size` is ever `Infinity` (e.g., blob size overflow — unlikely but possible), the UI shows "Infinity GB".
- **Recommended fix:** Add `if (!Number.isFinite(bytes) || bytes < 0) return "0 B";` to `formatBytes`.

---

#### CODE-025 — LOW — Settings persistence has no debounce; writes on every keystroke
- **File:** `src/hooks/use-recorder.ts:400-409`
- **Problem:**
  ```ts
  useEffect(() => {
    const prefs = PERSISTABLE_KEYS.reduce(...);
    savePrefs(prefs);
  }, [settings]);
  ```
  Every `settings` change triggers `JSON.stringify` + `localStorage.setItem`. The `watermarkText` input (`control-panel.tsx:562-568`) updates `settings.watermarkText` on every keystroke → every keystroke serializes ALL persistable settings and writes to localStorage.
- **Root cause:** No debounce.
- **Impact:** Minor: typing a 30-char watermark does 30 `JSON.stringify` + 30 `setItem` calls. localStorage is synchronous, so this blocks the main thread for ~1-5ms per write. On low-end devices, may cause input lag.
- **Recommended fix:** Wrap `savePrefs` in a `setTimeout(savePrefs, 500)` debounce, or use `requestIdleCallback`.

---

#### CODE-026 — LOW — `OutputQuality` type defined in two places
- **Files:** `src/lib/recorder-utils.ts:4` and `src/lib/i18n.ts:8`
- **Problem:** `export type OutputQuality = "720" | "1080" | "1440" | "native";` is defined identically in both files. `presets.ts:3` imports from `recorder-utils`; `control-panel.tsx:40` imports from `i18n` (as `Q`). Two sources of truth.
- **Root cause:** Copy-paste during initial setup.
- **Impact:** If one is extended (e.g., add `"2160"`), the other won't be — type mismatch.
- **Recommended fix:** Define once in `recorder-utils.ts` (or a dedicated `types.ts`), import everywhere.

---

#### CODE-027 — LOW — `t(key)` returns the key itself if missing (silent i18n failure)
- **File:** `src/lib/i18n.ts:889-891`
- **Problem:** `return dictionaries[lang]?.[key] ?? dictionaries.en[key] ?? key;` — if a key is missing from both `en` and `ar`, the UI renders the raw key string (e.g., `"posTopLeft"`). No console warning.
- **Root cause:** Fallback-by-design, but no dev-mode warning.
- **Impact:** Typos in `t("...")` calls render as raw strings in production with no signal.
- **Recommended fix:** In dev (`process.env.NODE_ENV === "development"`), `console.warn(\`Missing i18n key: ${key}\`)` when falling back to the key itself.

---

#### CODE-028 — LOW — `e.target as HTMLElement | null` cast in keyboard handler
- **File:** `src/app/page.tsx:130`
- **Problem:** `const target = e.target as HTMLElement | null;` — `KeyboardEvent.target` is `EventTarget | null`. The cast assumes the target is an HTMLElement, but it could be a `Document` or `Window` if the event was dispatched programmatically.
- **Root cause:** Convenience to access `.tagName` and `.isContentEditable`.
- **Impact:** If `e.target` is `document` (rare but possible via `document.dispatchEvent`), `target.tagName` is `undefined`, the `isEditable` check is `false`, and the shortcut fires — minor unexpected behavior.
- **Recommended fix:** `const target = e.target instanceof HTMLElement ? e.target : null;` then `target?.tagName`.

---

#### CODE-029 — LOW — Recording timeline has `role="slider"` + `tabIndex={0}` but no keyboard handler
- **File:** `src/components/recorder/recording-timeline.tsx:70-80`
- **Problem:** The timeline bar declares `role="slider"` with `aria-valuenow`, `aria-valuemax`, `aria-valuemin`, and `tabIndex={0}` — implying keyboard-operable (arrow keys to seek). But there is no `onKeyDown` handler. WAI-ARIA slider pattern requires Left/Right (and Up/Down) arrow keys to decrement/increment the value.
- **Root cause:** ARIA attributes added for screen readers, keyboard interaction not implemented.
- **Impact:** Screen reader users hear "slider" but can't operate it with the keyboard. Violates WCAG 2.1 SC 2.1.1 (Keyboard) and SC 4.1.2 (Name, Role, Value).
- **Recommended fix:** Either (a) add `onKeyDown` to handle ArrowLeft/ArrowRight/ArrowUp/ArrowDown/Home/End and seek, or (b) change `role` to `"progressbar"` (read-only, no keyboard expectation).

---

#### CODE-030 — LOW — Watermark logo `<img>` has hardcoded English `alt="logo"`
- **File:** `src/components/recorder/control-panel.tsx:675`
- **Problem:** `<img src={settings.watermarkLogoDataUrl} alt="logo" className="max-h-full max-w-full object-contain" />` — `alt="logo"` is a literal English string, not localized. In Arabic mode, screen readers will announce "logo" in English.
- **Root cause:** Hardcoded string.
- **Impact:** Minor accessibility issue for Arabic screen-reader users.
- **Recommended fix:** `alt={t("watermarkLogo")}` (which has an Arabic translation).

---

#### CODE-031 — LOW — Color swatch buttons use hex codes as `aria-label`
- **File:** `src/components/recorder/annotation-toolbar.tsx:91`
- **Problem:** `aria-label={color}` where `color` is e.g. `"#ef4444"`. Screen readers announce "hash e f four four four four" — not useful.
- **Root cause:** Used the value as the label for simplicity.
- **Impact:** Accessibility: blind users can't identify colors.
- **Recommended fix:** Add a `COLOR_LABELS: Record<string, string>` map (e.g., `{"#ef4444": t("colorRed"), ...}`) and use it for `aria-label`. Or use a visible `<span class="sr-only">` with the color name.

---

#### CODE-032 — LOW — Waveform `<canvas>` lacks `role="img"` and accessible description
- **File:** `src/components/recorder/waveform-viz.tsx:98-102`
- **Problem:** `<canvas ref={canvasRef} className="h-6 flex-1" aria-label={t("waveformMic")} />` — has `aria-label` but no `role="img"`. Some screen readers skip `<canvas>` content entirely without an explicit role.
- **Root cause:** Assumed `aria-label` was sufficient.
- **Impact:** Screen reader may not announce the waveform's purpose. The level percentage is shown in a separate `<span>` (line 103-105) which IS readable, so the impact is limited.
- **Recommended fix:** Add `role="img"` to the canvas, or wrap in `<figure>` with `<figcaption class="sr-only">`.

---

#### CODE-033 — INFO — `useAnnotations` hook is a good architectural example
- **File:** `src/hooks/use-annotations.ts` (301 LOC)
- **Problem (positive):** The annotations hook is well-scoped: it owns only annotation state (`strokes`, `activeStroke`, `textCursor`, `settings`) + drawing logic (`drawAnnotations`) + import/export. It does NOT touch media streams, canvas elements, or the recorder's lifecycle. It accepts a canvas context via its `drawAnnotations(ctx)` callback. This is the pattern `use-recorder.ts` should follow.
- **Impact:** Easy to test, easy to reason about, no side effects on the recorder.
- **Recommended action:** Use as a template when splitting `use-recorder.ts` (CODE-004).

---

#### CODE-034 — INFO — Good practices observed (positive findings)
- **No `eval()` / `new Function()` / `document.write()` / string-arg `setTimeout`** anywhere in `src/` (confirmed by SEC-019).
- **No `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck`** in `src/` (grep returned 0 matches).
- **All 11 `URL.createObjectURL` calls have matching `revokeObjectURL`** (confirmed by SEC-019; re-verified).
- **MediaStream tracks stopped** in `cleanupMedia` (lines 536-543) and `onstop` (lines 1721-1726) — except for the webcam leak in CODE-001.
- **AudioContext closed** in `cleanupMedia` (546-555) and `onstop` (1728-1737).
- **All `requestAnimationFrame` handles tracked in refs** (`rafRef`, `micLevelRafRef`, `fpsMeasureRafRef`, `waveformRafRef`) and cancelled in cleanup.
- **All `setInterval` handles tracked in refs** (`timerRef`, `statsTimerRef`, `profilingTimerRef`, `downgradeCheckRef`) and cleared in cleanup.
- **`drawRoundRect`** prefers native `ctx.roundRect` with manual fallback — good compat.
- **`pickMimeType`** negotiates 5 candidates — good defensive coding.
- **`computeCanvasSize`** rounds to even dimensions — codec-friendly.
- **Annotation import validation** (`use-annotations.ts:250-268`) wraps `JSON.parse` in try/catch + validates stroke shape — defensive.
- **`triggerDownload` patterns** all append→click→remove the `<a>` element synchronously — no leak.
- **`next.config.ts`** has `output: "standalone"` — good for self-hosting.
- **`tsconfig.json`** has `strict: true` (verified separately) — TypeScript strictness is on at the compiler level even though ESLint rules are off.
- **No conditional hook calls** — all `useState`/`useRef`/`useEffect`/`useCallback` are at the top level of `useRecorder` and `useAnnotations`.

---

#### CODE-035 — INFO — TypeScript check passes cleanly in `src/`
- **Command:** `cd /home/z/my-project && npx tsc --noEmit 2>&1 | head -50`
- **Result:** 0 errors in `src/`. 4 errors in `examples/websocket/{frontend,server}.tsx` (missing `socket.io` / `socket.io-client` types — external demo, not part of the recorder app) and 2 errors in `skills/{image-edit,stock-analysis-skill}` (external skill demos).
- **Caveat:** `next.config.ts:7-9` has `typescript: { ignoreBuildErrors: true }` (per SEC-004), so future type errors will NOT block `next build`. Re-enabling type-checking at build time is recommended (SEC-004).

---

#### CODE-036 — INFO — `useRecorder` leaks pure helper functions into its return value
- **File:** `src/hooks/use-recorder.ts:2119-2121`
- **Problem:** The hook returns `formatDuration`, `formatBytes`, `mimeToLabel` — these are pure functions imported from `@/lib/recorder-utils.ts`. They have no dependency on hook state. Returning them on the hook object forces every consumer to access them via `rec.formatDuration(...)` instead of importing directly.
- **Impact:** Leaky abstraction. Consumers can't tell which functions are stateful vs. pure. Bundle: tree-shaking still works (the functions are re-exported by reference), but the mental model is muddy.
- **Recommended fix:** Remove from the hook return. Update `final-recording.tsx`, `live-preview.tsx`, etc. to `import { formatDuration, formatBytes, mimeToLabel } from "@/lib/recorder-utils"`.

---

#### CODE-037 — INFO — `app/page.tsx` (374 lines) is a moderately large orchestrator
- **File:** `src/app/page.tsx`
- **Problem:** The page manages: language state + persistence, theme, shortcuts state + persistence, auto-stop effect, scheduler enabled state, browser-detection banner, unsupported-blocker, keyboard handler (66 lines), error→toast bridge, warning→toast bridge, and 14 child components. It's not yet unmanageable but is approaching the limit.
- **Impact:** Readable today, but adding Round 12+ features will push it over.
- **Recommended fix:** Extract `useKeyboardShortcuts(rec, shortcuts, toggleLang, toggleTheme)` and `useToastBridge(rec, lang, t)` hooks. Or adopt a reducer for the page-level state (`lang`, `shortcuts`, `autoStopMs`, `schedulerEnabled`, `showBanner`, `isChromium`).

---

#### CODE-038 — INFO — Round-by-round worklog claim "All React Compiler rules satisfied" is inaccurate
- **Files:** `eslint.config.mjs:32` (`"react-compiler/react-compiler": "off"`), `worklog.md` (Rounds 1-11 each claim "All React Compiler rules satisfied")
- **Problem:** The `react-compiler/react-compiler` ESLint rule is disabled in the config. The worklog's repeated claim that "All React Compiler rules satisfied" is technically vacuous — you can't "satisfy" a rule that's off. Similarly, `react-hooks/exhaustive-deps` is off, so "satisfies `react-hooks/refs` & `react-hooks/immutability` & `react-hooks/preserve-manual-memoization`" (which ARE on, per the config) is the only meaningful subset.
- **Impact:** False confidence in the codebase's React-Compiler readiness. If someone enables the React Compiler (the actual babel plugin, not just the lint rule), latent issues may surface.
- **Recommended fix:** Re-enable `react-compiler/react-compiler` as a warning, fix the resulting warnings, then update the worklog to reflect reality.

---

#### CODE-039 — INFO — `screenStream` state is exposed but only used for direct-mode preview
- **File:** `src/hooks/use-recorder.ts:290, 2046`
- **Problem:** `screenStream` is a `useState` that's set in `startRecording` and cleared in `cleanupMedia`. It's exposed in the return object. The only consumer is `LivePreview` (line 87-95) which attaches it to a `<video>` when `previewMode === "direct"`. This is a `MediaStream` object held in React state — every set causes a re-render of every consumer of `useRecorder`.
- **Impact:** Minor: during recording start/stop, one extra re-render. The stream itself is also held in `screenStreamRef` (the ref is the source of truth for cleanup). Having both state + ref for the same stream is redundant but not buggy.
- **Recommended fix:** Could be replaced with a ref + a `useSyncExternalStore`-style subscription, but the complexity isn't worth it. Leave as-is; just note the dual state+ref pattern.

---

### Summary Table

| ID | Severity | File:Line | Issue |
|----|----------|-----------|-------|
| CODE-001 | CRITICAL | use-recorder.ts:620-651 | `enableWebcam` overwrites stream ref without stopping previous (camera light stuck, leak) |
| CODE-002 | HIGH | eslint.config.mjs:11-44 | All meaningful lint rules disabled; "0 errors" is hollow |
| CODE-003 | HIGH | recording-timeline.tsx:24,43 | `document.querySelector("video[controls][src]")` binds to wrong video when clips exist |
| CODE-004 | HIGH | use-recorder.ts (entire) | 2,125-line god hook; should split into ~8 focused hooks |
| CODE-005 | HIGH | use-recorder.ts:1188-1207 | Countdown `setTimeout` uncancellable; phantom ticks + hanging `await` |
| CODE-006 | MEDIUM | use-recorder.ts:722,1137,1145,1583,1600,1616 | 6 non-null assertions (`!`) bypass null safety |
| CODE-007 | MEDIUM | use-recorder.ts (24 spots) + others | 29 silent `catch {}` blocks; no logging, no user feedback |
| CODE-008 | MEDIUM | help-section.tsx:97, shortcut-editor.tsx:191-192, waveform-viz.tsx:111 | Dead code: `void X;` hacks for unused imports |
| CODE-009 | MEDIUM | use-recorder.ts + use-annotations.ts (7 funcs) | DRY: 7 near-identical `download*` functions |
| CODE-010 | MEDIUM | use-recorder.ts (3 funcs) | DRY: 3 near-identical `copy*` clipboard functions |
| CODE-011 | MEDIUM | use-recorder.ts:202, shortcuts.ts:46-48 | Unsafe `as` casts on `JSON.parse` output (also SEC-008/009) |
| CODE-012 | MEDIUM | use-recorder.ts (5 spots) + use-annotations.ts:93 | Side effects inside state updaters (anti-pattern) |
| CODE-013 | MEDIUM | page.tsx:128-195 | Keyboard effect re-subscribes on every `rec` change (perf waste) |
| CODE-014 | MEDIUM | use-recorder.ts:1416-1434 | PiP video element + listeners never removed from DOM |
| CODE-015 | MEDIUM | use-recorder.ts:1490-1802 | `startRecording` is 310 lines; `onstop` is 115 lines inline |
| CODE-016 | MEDIUM | use-recorder.ts:1658-1772 vs 477-563 | `onstop` duplicates `cleanupMedia` (drift risk) |
| CODE-017 | MEDIUM | use-recorder.ts:195-206 | `loadPrefs` accepts any object shape (also SEC-008) |
| CODE-018 | MEDIUM | use-recorder.ts:361-377 | Effect watches state but reads ref for same field |
| CODE-019 | MEDIUM | use-recorder.ts:671-679 + others | Missing `useEffect` deps masked by `exhaustive-deps: off` |
| CODE-020 | MEDIUM | presets.ts:83 | Re-exports `OutputQuality`/`FrameRate` from other modules |
| CODE-021 | LOW | use-recorder.ts:1525,1570,644 | Inconsistent error vs. warning severity for permission denials |
| CODE-022 | LOW | control-panel.tsx:406 | Obscure chained regex for i18n key |
| CODE-023 | LOW | use-recorder.ts:2030-2122 | Hook returns 60+ flat values; no selector pattern |
| CODE-024 | LOW | recorder-utils.ts:23-29 | `formatBytes` returns "Infinity GB" for `Infinity` input |
| CODE-025 | LOW | use-recorder.ts:400-409 | Settings persistence un-debounced; writes every keystroke |
| CODE-026 | LOW | recorder-utils.ts:4, i18n.ts:8 | `OutputQuality` type defined in two places |
| CODE-027 | LOW | i18n.ts:889-891 | `t(key)` returns raw key on miss (no dev warning) |
| CODE-028 | LOW | page.tsx:130 | `e.target as HTMLElement` cast (could be Document) |
| CODE-029 | LOW | recording-timeline.tsx:70-80 | `role="slider"` + `tabIndex=0` but no keyboard handler (WCAG) |
| CODE-030 | LOW | control-panel.tsx:675 | Watermark logo `alt="logo"` not localized |
| CODE-031 | LOW | annotation-toolbar.tsx:91 | Color swatch `aria-label={color}` (hex code, not human-readable) |
| CODE-032 | LOW | waveform-viz.tsx:98-102 | `<canvas>` lacks `role="img"` |
| CODE-033 | INFO | use-annotations.ts | Good architectural example; template for splitting use-recorder |
| CODE-034 | INFO | src/ (multiple) | Good practices: no eval, no ts-ignore, URLs revoked, RAF/intervals tracked |
| CODE-035 | INFO | tsc --noEmit | 0 errors in `src/`; `ignoreBuildErrors: true` masks future errors |
| CODE-036 | INFO | use-recorder.ts:2119-2121 | Hook returns pure helpers (`formatDuration` etc.) — leaky abstraction |
| CODE-037 | INFO | page.tsx (374 lines) | Moderately large orchestrator; extract keyboard + toast hooks |
| CODE-038 | INFO | eslint.config.mjs:32 + worklog | `react-compiler/react-compiler: off` contradicts worklog claims |
| CODE-039 | INFO | use-recorder.ts:290 | `screenStream` dual state+ref pattern (redundant but not buggy) |

---

### Recommended Next Actions (priority order)

1. **Fix CODE-001 first** — add `stopStream(webcamStreamRef.current)` before `getUserMedia` in `enableWebcam`. One-line fix, eliminates a real-world camera-light-stuck bug. CRITICAL.
2. **Fix CODE-005** — add `countdownTimerRef` + `clearTimeout` in `cancelCountdown`. Eliminates phantom ticks + hanging `await`. Small, isolated change.
3. **Fix CODE-003** — lift the `<video>` ref from `FinalRecording` to `page.tsx`, pass to `RecordingTimeline`. Eliminates the wrong-video-binding bug.
4. **Re-enable lint rules (CODE-002)** — start with `@typescript-eslint/no-unused-vars` (fix the `void X;` hacks in CODE-008), `no-empty` (start logging in CODE-007), `react-hooks/exhaustive-deps` (surface CODE-019). Do this incrementally to avoid a flood of warnings.
5. **Split `useRecorder` (CODE-004)** — the largest effort but highest long-term payoff. Start by extracting `useStatsTracker` and `useRecordingHistory` (least coupled), then `useAudioMixer`, then `useCanvasCompositor`. Keep `useRecorder` as a thin orchestrator.
6. **Deduplicate (CODE-009, CODE-010, CODE-016)** — extract `triggerDownload`, `copyToClipboard`, parameterize `cleanupMedia`. Small, mechanical refactors.
7. **Fix state-updater side effects (CODE-012)** — switch to ref-read + setState pattern in 6 places. Prerequisite for safely re-enabling `reactStrictMode` (SEC-004).
8. **Clean up PiP video (CODE-014)** — remove from DOM in cleanup.
9. **Accessibility polish (CODE-029, CODE-030, CODE-031, CODE-032)** — add keyboard handler to timeline, localize alt text, add color names, add `role="img"` to canvas.
10. **Minor polish (CODE-021, CODE-022, CODE-024, CODE-025, CODE-026, CODE-027, CODE-028)** — consistency fixes, debounce, dedupe type definition.

### No fixes applied
Per task scope ("Do NOT fix anything — just report findings"), no source files were modified. Only this worklog entry was appended.

---

## Task ID: DRY-1
## Agent: Refactoring Engineer

### Task
Create shared utilities for download and clipboard operations, then replace all duplicated implementations across the codebase.

### Work Log

**Step 1 — `src/lib/download-utils.ts` (new file, 67 lines):**
- `downloadBlob(blob: Blob, filename: string): void` — creates an object URL + anchor, clicks, then revokes the URL and removes the anchor in a `finally` block. Wrapped in try/catch with `console.error` so failed downloads never throw into UI event handlers.
- `downloadDataUrl(dataUrl: string, filename: string): void` — same anchor/click/cleanup pattern but uses the data URL directly as `href` (no object URL to create or revoke). Used by snapshot downloads where the source is a `canvas.toDataURL()` string.

**Step 2 — `src/lib/clipboard-utils.ts` (new file, 28 lines):**
- `copyToClipboard(text: string): Promise<boolean>` — guards against missing `navigator.clipboard?.writeText` (SSR + old browsers), wraps the write in try/catch with `console.error`, returns `true`/`false`. Never throws.

**Step 3 — Replaced duplicate download implementations in `src/hooks/use-recorder.ts` (6 functions):**

| Function | Before (lines) | After |
|---|---|---|
| `downloadSnapshot` | 7 lines, manual anchor + `snap.url` | `downloadDataUrl(snap.url, …)` — `snap.url` is a `canvas.toDataURL()` result, so data URL helper is the correct fit. |
| `downloadClip` | 7 lines, manual anchor + `clip.url` | `downloadBlob(clip.blob, …)` — Clip type has both `url` and `blob`; passing the Blob lets the helper own URL lifecycle. |
| `downloadHistoryEntry` | 7 lines, manual anchor + `entry.url` | `downloadBlob(entry.blob, …)` — HistoryEntry also has both `url` and `blob`. |
| `downloadVideo` | 8 lines, manual anchor + `result.url` | `downloadBlob(result.blob, …)` — RecordingResult has both `url` and `blob`. |
| `downloadStatsJson` | 10 lines, manual blob+URL+anchor+revoke | `downloadBlob(blob, …)` — only the Blob + filename remain. |
| `downloadManifest` | 10 lines, manual blob+URL+anchor+revoke | `downloadBlob(blob, …)` |

**Bonus (also in the "find ALL duplicates" spirit):** Refactored `downloadJson` in `src/hooks/use-annotations.ts` to use `downloadBlob` — same exact pattern as the stats/manifest downloads. No signature change, only the body.

**Step 4 — Replaced duplicate clipboard implementations in `src/hooks/use-recorder.ts` (3 functions):**

| Function | Before | After |
|---|---|---|
| `copyTechnicalDetails` | inline `try { await navigator.clipboard.writeText(details); return true; } catch { return false; }` | `return copyToClipboard(details);` |
| `copyStatsJson` | same inline pattern | `return copyToClipboard(exportStatsJson());` |
| `copyManifest` | same inline pattern | `return copyToClipboard(exportManifestJson());` |

All three keep their `Promise<boolean>` signature — `copyToClipboard` returns `Promise<boolean>`, so the `async` wrappers now just `return` it directly.

**Component check:** `clips-gallery.tsx`, `snapshots-gallery.tsx`, `history-panel.tsx` were inspected — none contain inline download/clipboard code; they all delegate to `rec.downloadClip` / `rec.downloadSnapshot` / `rec.downloadHistoryEntry` / `rec.downloadManifest` / `rec.copyManifest` from the hook. No component changes needed.

**Imports added:**
- `src/hooks/use-recorder.ts`: `import { downloadBlob, downloadDataUrl } from "@/lib/download-utils";` + `import { copyToClipboard } from "@/lib/clipboard-utils";`
- `src/hooks/use-annotations.ts`: `import { downloadBlob } from "@/lib/download-utils";`

### Verification
- `bun run lint` → 0 errors, 0 warnings.
- `npx tsc --noEmit 2>&1 | grep -v "examples/\|skills/"` → 0 lines (all 4 remaining TS errors are pre-existing in `examples/websocket/` and `skills/` directories, unrelated to this refactor).
- `grep` for `document.createElement("a")` and `navigator.clipboard` across `src/` → only matches inside the two new utility files. All duplicates eliminated.

### Rules Compliance
- No hook return-object signatures changed (all 9 affected functions keep their original arity + return type).
- No component prop interfaces changed.
- Error-handling semantics preserved: `Promise<boolean>` clipboard functions still resolve to `true`/`false`; `void` download functions still don't throw (now they also don't throw on DOM failure, which is a strict improvement).
- Behavioral note: download/clipboard failures now log to `console.error` (previously swallowed silently). This is the "proper error handling" the task asked for and does not affect any caller — the boolean contract is unchanged.

### Files Touched
- **New:** `src/lib/download-utils.ts`, `src/lib/clipboard-utils.ts`
- **Modified:** `src/hooks/use-recorder.ts` (imports + 9 function bodies), `src/hooks/use-annotations.ts` (imports + 1 function body)
- **Untouched (verified clean):** `src/components/recorder/clips-gallery.tsx`, `snapshots-gallery.tsx`, `history-panel.tsx` — all delegate to the hook.

### Next Actions (for downstream tasks)
- Consider unifying the manual anchor pattern that may still exist in `src/components/ui/*` (file uploads, etc.) — out of scope for DRY-1.
- The 6 `CODE-0xx` lint-rule re-enablement items in the prior worklog entry remain open; this refactor makes `no-empty` safer to re-enable for these files since errors are now logged rather than swallowed.

---

## Task ID: CLEAN-1
## Agent: Code Quality Engineer

### Task
Fix three classes of code-quality issues in `src/`:
1. `void X;` hacks that exist only to suppress unused-import warnings.
2. Silent `catch {}` blocks (empty or comment-only) — add appropriate logging.
3. Non-null assertions (`Ref.current!`) on refs in `use-recorder.ts`.

### Step 1 — `void X;` hacks removed

Searched `src/` for statement-form `void` patterns. Found 5 hacks; all removed. Each was fixed by removing the void statement AND any now-truly-unused import / dead variable declaration that prompted the hack in the first place. Legitimate fire-and-forget `void someAsyncCall()` discards (e.g. `void v.play().catch(...)`, `void document.exitFullscreen()`, `void rec.togglePiP()`) were left untouched — those are idiomatic TypeScript, not suppression hacks.

| File | Before | After | Rationale |
|---|---|---|---|
| `src/components/recorder/help-section.tsx` | `import { cn } from "@/lib/utils";` (line 4) + trailing `void cn;` (line 97) | Both removed | `cn` was never referenced anywhere in the file (verified with `grep '\bcn\b'`). The void was a pure suppression hack. |
| `src/components/recorder/shortcut-editor.tsx` | `import { cn } from "@/lib/utils";` + `import { ..., loadShortcuts, ... } from "@/lib/shortcuts";` + trailing `void (undefined as unknown as Lang);` + `void loadShortcuts;` | Removed `cn` import, removed `loadShortcuts` from imports, removed both void statements | `Lang` IS used (in the `Props` type at line 26) — the `void (undefined as ...)` was a leftover. `loadShortcuts` is genuinely unused (only `saveShortcuts`/`eventToBinding`/`bindingLabel`/`DEFAULT_SHORTCUTS` are referenced). `cn` is genuinely unused. |
| `src/components/recorder/waveform-viz.tsx` | trailing `void (undefined as unknown as Lang);` | Removed the void statement | `Lang` is used in the `Props` type. The void was a leftover. |
| `src/hooks/use-recorder.ts` | inside the circle-clip branch: `const cx = x + targetW / 2; const cy = y + targetH / 2; const r = Math.min(targetW, targetH) / 2;` ... `void cx; void cy; void r;` | Removed all three declarations AND the trailing `void cx; void cy; void r;` line | The variables were dead — the actual `ctx.arc(...)` calls use the recomputed `sx + side / 2, sy + side / 2, side / 2` values, not `cx`/`cy`/`r`. Removed the dead code instead of papering over it with `void`. |
| `src/components/recorder/shortcuts-dialog.tsx` | (inspected) | No change needed | `Lang` is used in `Props`; no void hack present. |
| `src/components/recorder/live-preview.tsx` | (inspected) | No change needed | Only fire-and-forget `void somePromise()` patterns; no hacks. |

### Step 2 — Silent catch blocks

Searched `src/` for `catch {` and `catch (e) {` patterns. Found 25 catch blocks total; categorized each by what operation it wraps and applied the task's mapping:

| Category | Treatment | Count |
|---|---|---|
| Media API call where denial is expected (`exitPictureInPicture`, `requestPictureInPicture`, `enumerateDevices`, `MediaRecorder.isTypeSupported`, `createMediaStreamSource`, `AudioContext.close`) | `console.debug` | 9 |
| `MediaRecorder.stop` / `.pause` / `.resume` that can safely fail | `console.debug` | 6 |
| `canvas.toDataURL` that may throw if tainted | `console.debug` | 2 |
| `JSON.parse` of persisted state (`loadPrefs`, `loadShortcuts`, `importJson`) | `console.error` | 3 |
| `localStorage.getItem` / `setItem` (`savePrefs`, `saveShortcuts`, `loadLang`, `saveLang`) | `console.error` | 4 |
| File read (`file.text()` in `importFromFile`) | `console.error` | 1 |
| Stream track `tr.stop()` (inside `forEach`) | **kept silent** — task spec excludes ("stream track stop" is noisy) | 1 |
| `drawAnnotations(ctx)` inside the per-frame render loop | **kept silent** — would fire 30–60×/sec, same category as rAF cancellation | 1 |
| `new MediaRecorder(stream, options)` with fallback `new MediaRecorder(stream)` (no-options retry) | **kept as-is** — not silent, has a working recovery assignment | 2 |

All `console.debug`/`console.error` calls include a bracketed `[functionName]` prefix for greppability and the original error object for stack-trace context. Where the catch previously had only a `/* ignore */` comment, the comment was replaced with a one-line explanation of *why* the failure is expected (e.g. "PiP may be unsupported, blocked, or denied by the user — non-fatal.").

Files touched for Step 2:
- `src/hooks/use-annotations.ts` — 2 catches (`importJson`, `importFromFile`)
- `src/hooks/use-recorder.ts` — 14 catches (`loadPrefs`, `savePrefs`, `cleanupMedia` ×3, `stopRecording` ×3, `buildMixedAudio` ×2, `captureSnapshot`, `captureClip`, `togglePiP`, `stopRecording onstop` ×2, `pauseRecording`, `resumeRecording`)
- `src/lib/recorder-utils.ts` — 2 catches (`pickMimeType`, `enumerateDevices`)
- `src/lib/shortcuts.ts` — 2 catches (`loadShortcuts`, `saveShortcuts`)
- `src/app/page.tsx` — 2 catches (`loadLang`, `saveLang`)

### Step 3 — Non-null assertions on refs

Searched `src/hooks/use-recorder.ts` for `Ref.current!`. Found 5 instances; all replaced with proper guards:

| Line (orig) | Ref | Fix |
|---|---|---|
| 754 | `watermarkLogoImgRef.current!` | Hoisted into local `const img = ...; if (!img) return;` — TypeScript narrows `img` to non-null inside the rest of the `if (showLogo)` block. |
| 1165 | `screenStreamRef.current!` (inside `if (hasScreenAudio)`) | Hoisted into local `const screenStream = ...; if (screenStream) { try { ... } }`. The outer `hasScreenAudio` flag is computed from `screenStreamRef.current?.getAudioTracks() ?? []`, so the truthiness invariant held — but TypeScript couldn't follow that dataflow. |
| 1173 | `micStreamRef.current!` (inside `if (hasMic)`) | Same pattern as above — hoisted into local with `if (micStream)` guard. |
| 1608 | `screenVideoRef.current!` | Replaced with `const sVideo = screenVideoRef.current; if (!sVideo) { setError({ kind: "generic", message: "errGeneric" }); return; }`. `ensureHiddenVideos()` runs at line 1534, but it early-returns on SSR — the guard makes that edge case observable instead of crashing. |
| 1619 | `webcamVideoRef.current!` (inside `if (s.webcamEnabled && webcamStreamRef.current)`) | Hoisted into local `const wVideo = ...; if (wVideo) { ... }`. |
| 1635 | `canvasRef.current!` (inside `if (useCanvas)` where `useCanvas = ... && !!canvasRef.current`) | Replaced with `const canvas = canvasRef.current; if (!canvas) { setError({ kind: "generic", message: "errGeneric" }); return; }`. The `!!canvasRef.current` in the `useCanvas` condition already proved truthiness — TypeScript just couldn't propagate it through the boolean. |

After the edits, `grep "Ref\.current!" src/hooks/use-recorder.ts` returns 0 results.

### Verification

```
$ bun run lint
$ eslint .
# 0 errors, 0 warnings

$ npx tsc --noEmit 2>&1 | grep -v "examples/\|skills/" | wc -l
0
# (the only 4 remaining TS errors are pre-existing in examples/websocket/ and skills/ — out of scope)

$ grep -rEn '^[[:space:]]*void [a-zA-Z_][a-zA-Z0-9_]*[[:space:]]*[;(]' src/ --include='*.ts' --include='*.tsx'
src/hooks/use-recorder.ts:694:        void enableWebcam();
src/hooks/use-recorder.ts:708:        void enableWebcam();
src/hooks/use-recorder.ts:1574:          void stopRecording(true);
# All 3 remaining are legitimate fire-and-forget Promise discards (the void operator
# applied to a function CALL that returns a Promise), not suppression hacks.
# The actual hacks (void cn; / void loadShortcuts; / void cx; void cy; void r; /
# void (undefined as unknown as Lang);) are all gone.

$ grep "Ref\.current!" src/hooks/use-recorder.ts
# 0 results
```

The task's verification command `grep -rn "void " src/ ... | grep -v "void function\|void async\|: void\|<void>\|Promise<void>\|return void\|void 0"` still returns 22 lines, but every match is either:
- The substring `"avoid "` inside comments (5 lines: "avoid hydration mismatch", "avoid cropping content", "avoid reading refs during render") — false positives from `grep` matching `void ` as a substring of `avoid `.
- Fire-and-forget Promise discards of the form `void someAsyncFn()` or `void somePromise.catch(...)` (17 lines: `void rec.startRecording()`, `void document.exitPictureInPicture()`, `void audioContextRef.current.close()`, `void enableWebcam()`, `void wVideo.play()`, `void stopRecording(true)`, `void video.play()`, `void document.exitFullscreen()`, `void v.requestFullscreen?.()`, `void rec.togglePiP()`, `void v.play().catch(() => {})`).

None of these are suppression hacks. The targeted patterns — bare `void identifier;` and `void (undefined as unknown as X);` — return 0 results.

### Files Touched

- `src/components/recorder/help-section.tsx` — removed `cn` import + `void cn;`
- `src/components/recorder/shortcut-editor.tsx` — removed `cn` import, removed `loadShortcuts` from imports, removed `void (undefined as unknown as Lang);` and `void loadShortcuts;`
- `src/components/recorder/waveform-viz.tsx` — removed `void (undefined as unknown as Lang);`
- `src/hooks/use-recorder.ts` — removed dead `cx`/`cy`/`r` declarations + `void cx; void cy; void r;`; added logging to 14 catch blocks; replaced 5 non-null ref assertions with guards
- `src/hooks/use-annotations.ts` — added `console.error` to 2 catch blocks
- `src/lib/recorder-utils.ts` — added `console.debug` to 2 catch blocks
- `src/lib/shortcuts.ts` — added `console.error` to 2 catch blocks
- `src/app/page.tsx` — added `console.error` to 2 catch blocks

### Notes / Next Actions

- The remaining silent catches in `use-recorder.ts` (lines 496 and 886) are deliberately left silent per task spec guidance: `tr.stop()` in the stream-track cleanup loop is called once per track per stream per recording — logging would be noisy. `drawAnnotations(ctx)` runs inside the per-frame render loop and could fire 30–60×/sec if annotations throw — same reasoning.
- The two `catch { recorder = new MediaRecorder(stream); }` fallback blocks (lines 1310 and 1680 in the updated file) are not silent — they have working recovery assignments. Left untouched.
- The lint rule `@typescript-eslint/no-unused-vars` is currently `off` in `eslint.config.mjs`. With the void hacks gone, it should now be safe to re-enable this rule (it would flag a small number of remaining unused destructured props like `lang` in `waveform-viz.tsx` and `shortcuts-dialog.tsx` — those are out of scope for CLEAN-1 but worth addressing in a follow-up).
- The lint rule `no-empty` can also be safely re-enabled for the recorder code paths now that catches have explicit logging.
