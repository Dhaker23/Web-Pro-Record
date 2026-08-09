# 🎬 Web Pro Record

A premium, fully client-side **screen + webcam + microphone recorder** that runs entirely in the browser. No backend, no AI APIs, no uploads — your recordings never leave your device.

![Web Pro Record](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8) ![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

### 🎥 Core Recording
- **Screen capture** via `getDisplayMedia()` — screen, window, or tab
- **Webcam overlay** with draggable positioning, shape (rounded/circle), size, border, shadow
- **Microphone recording** with live audio waveform visualization
- **System/tab audio** capture when supported
- **Canvas compositing** — screen + webcam composited into one video via `canvas.captureStream()`
- **Audio mixing** via `AudioContext` — mic + system audio merged into one track
- **MIME negotiation** — VP9 → VP8 → H.264 → WebM (best supported codec auto-selected)

### 🎨 Polished Studio UI
- **Bilingual** — English & Arabic with proper RTL/LTR switching
- **Light & dark themes** with elegant violet/fuchsia gradient accents
- **Recording presets** — Gaming, Presentation, Tutorial, Minimal (one-click configs)
- **Overlay templates** — Classic, Neon, Minimal, Polaroid webcam styles
- **Custom watermark** — text + logo upload, opacity, size, 3 modes (text/logo/both)
- **Annotation tools** — pen, highlighter, arrow, text, eraser (draw live during recording)

### 🚀 Advanced Features
- **Recording scheduler** — start at a specific time + auto-stop duration limit
- **Snapshots** — capture still frames during recording
- **Video clips** — capture short 5s video clips during recording
- **Recording history** — in-memory history with thumbnails, restore, download
- **Performance monitor** — live render time, memory, FPS, track state, audio context
- **Adaptive FPS** — auto-downgrades frame rate if the device can't keep up
- **Picture-in-Picture** mode
- **Post-recording stats** — avg FPS, total frames, peak audio, duration, codec
- **Export manifest** — download recording history as JSON
- **Annotation export/import** — save/load annotations as JSON
- **Custom keyboard shortcuts** — fully rebindable, persisted
- **Safe persistence** — settings, language, theme, shortcuts saved to localStorage

### 🔒 Privacy-First
- **100% client-side** — no servers, no uploads, no tracking
- **No accounts** required
- **No AI APIs** — pure browser Web APIs only
- Recordings stay on your device

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| State | React hooks (custom `useRecorder`, `useAnnotations`) |
| Media APIs | `getDisplayMedia`, `getUserMedia`, `MediaRecorder`, `canvas.captureStream`, `AudioContext` |
| Fonts | Geist (Latin) + Cairo (Arabic) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** or **Bun**
- A **Chromium-based browser** (Chrome, Edge, Brave) for best compatibility
- Serve over **HTTPS** or **localhost** (required for media capture APIs)

### Installation

```bash
# Clone the repo
git clone https://github.com/Dhaker23/Web-Pro-Record.git
cd Web-Pro-Record

# Install dependencies
bun install
# or
npm install

# Start the dev server
bun run dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
bun run build
bun run start
```

---

## 📖 How to Use

1. **Choose sources** — toggle Screen, Webcam, Microphone, System Audio
2. **Pick a preset** (optional) — Gaming, Presentation, Tutorial, or Minimal
3. **Customize** — webcam overlay position/size/shape, watermark, quality, FPS
4. **Press Start Recording** — grant browser permissions when prompted
5. **Annotate** (optional) — draw on the canvas during recording
6. **Capture snapshots/clips** (optional) — during recording
7. **Stop** — preview your recording, view stats, download

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Start/Stop recording | `Space` |
| Pause/Resume | `P` |
| Reset | `R` |
| Toggle webcam | `W` |
| Toggle microphone | `M` |
| Toggle annotations | `A` |
| Toggle scheduler | `S` |
| Capture snapshot | `C` |
| Capture clip | `V` |
| Switch language | `Ctrl/Cmd + L` |
| Toggle theme | `Ctrl/Cmd + D` |

All shortcuts are **customizable** via the Edit Shortcuts dialog.

---

## 🌐 Browser Compatibility

| Feature | Chrome | Edge | Brave | Firefox | Safari |
|---------|--------|------|-------|---------|--------|
| Screen capture | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| System audio | ✅ | ✅ | ✅ | ❌ | ❌ |
| Webcam + Mic | ✅ | ✅ | ✅ | ✅ | ✅ |
| MediaRecorder (VP9) | ✅ | ✅ | ✅ | ⚠️ | ❌ |
| Picture-in-Picture | ✅ | ✅ | ✅ | ❌ | ❌ |
| Canvas captureStream | ✅ | ✅ | ✅ | ✅ | ✅ |

**Recommended:** Latest Chrome or Edge for full feature support.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── globals.css          # Theme + custom styles
│   ├── layout.tsx           # Root layout (fonts, ThemeProvider)
│   └── page.tsx             # Main app page
├── components/
│   ├── recorder/             # All recorder UI components
│   │   ├── header.tsx
│   │   ├── hero.tsx
│   │   ├── control-panel.tsx
│   │   ├── live-preview.tsx
│   │   ├── final-recording.tsx
│   │   ├── annotation-toolbar.tsx
│   │   ├── scheduler.tsx
│   │   ├── shortcuts-dialog.tsx
│   │   ├── shortcut-editor.tsx
│   │   ├── presets-bar.tsx
│   │   ├── overlay-templates.tsx
│   │   ├── profiling-panel.tsx
│   │   ├── history-panel.tsx
│   │   ├── stats-summary.tsx
│   │   ├── snapshots-gallery.tsx
│   │   ├── clips-gallery.tsx
│   │   ├── recording-timeline.tsx
│   │   ├── waveform-viz.tsx
│   │   ├── help-section.tsx
│   │   └── footer.tsx
│   └── ui/                  # shadcn/ui components
├── hooks/
│   ├── use-recorder.ts      # Core recorder hook (media capture, canvas, audio)
│   └── use-annotations.ts   # Annotation drawing hook
└── lib/
    ├── i18n.ts              # Bilingual EN/AR translations
    ├── recorder-utils.ts    # Format/MIME/device helpers
    ├── presets.ts           # Recording presets
    ├── overlay-templates.ts # Webcam overlay templates
    └── shortcuts.ts         # Keyboard shortcut config
```

---

## 📝 License

MIT License — free to use, modify, and distribute.

---

## 👨‍💻 Author

**Designed & Developed by [Dhaker Amara](https://github.com/Dhaker23)**

*Bringing ideas to life through modern digital experiences*

- 📧 Email: dhakeramarawork@gmail.com
- 💬 WhatsApp: +216 99 495 558
- 🐙 GitHub: [@Dhaker23](https://github.com/Dhaker23)

---

## ⚠️ Notes

- Screen capture requires a **secure context** (HTTPS or localhost)
- System audio capture depends on the browser and sharing mode (tab vs. screen)
- Output format is typically **WebM** (VP9/VP8 + Opus)
- The app works best in recent **Chromium-based browsers**
