// Full bilingual dictionary for Web Pro Record (EN / AR).
// Language switching is in-memory (no localStorage required).

export type Lang = "en" | "ar";

export type WebcamPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type WebcamShape = "rounded" | "circle";
export type OutputQuality = "720" | "1080" | "1440" | "native";
export type FrameRate = "24" | "30" | "60";

type Dict = Record<string, string>;

const en: Dict = {
  // Brand / header
  brandName: "Web Pro Record",
  privacyNote: "Your recording stays on your device",
  languageLabel: "Language",
  themeLabel: "Theme",
  themeLight: "Light",
  themeDark: "Dark",
  toggleTheme: "Toggle theme",
  switchToArabic: "العربية",
  switchToEnglish: "English",

  // Hero
  heroBadge: "100% in-browser · No uploads",
  heroTitle: "Record your screen, webcam & mic — right in the browser",
  heroSubtitle:
    "A privacy-first studio that captures your screen, webcam and microphone using only native Web APIs. Nothing leaves your device. No accounts, no AI APIs, no servers.",
  trustNoUpload: "No upload required",
  trustLocal: "Runs locally",
  trustNoAi: "No AI API",
  trustNoAccount: "No account needed",
  trustNoUploadDesc: "Recordings are processed on your machine.",
  trustLocalDesc: "Built entirely on standard browser APIs.",
  trustNoAiDesc: "No AI services are used anywhere.",
  trustNoAccountDesc: "Open the page and start recording instantly.",

  // Onboarding
  onboardTitle: "How it works",
  onboardStep1: "1. Choose what to capture — screen, webcam and/or microphone.",
  onboardStep2: "2. Position your webcam overlay and pick quality settings.",
  onboardStep3: "3. Press Start Recording and grant browser permissions.",
  onboardStep4: "4. Preview the result and download your video locally.",

  // Recorder controls
  controlPanelTitle: "Recorder settings",
  controlPanelDesc: "Configure your capture sources and overlay.",
  sourcesTitle: "Capture sources",
  screen: "Screen",
  screenDesc: "Capture a screen, window or browser tab.",
  webcam: "Webcam",
  webcamDesc: "Show your camera as an overlay.",
  microphone: "Microphone",
  microphoneDesc: "Record your voice with the capture.",
  systemAudio: "System audio",
  systemAudioDesc: "Captured when the browser shares tab/system audio.",
  systemAudioHint: "System audio availability depends on your browser and sharing mode.",
  screenSourceInfo: "Screen source",
  screenSourceNone: "Not selected",
  cameraDevice: "Camera device",
  micDevice: "Microphone device",
  noDevices: "No devices found",
  refreshDevices: "Refresh devices",
  selectCamera: "Select a camera",
  selectMic: "Select a microphone",

  // Quality / output
  outputTitle: "Output",
  outputQuality: "Output quality",
  quality720: "720p",
  quality1080: "1080p",
  quality1440: "1440p",
  qualityNative: "Native (best)",
  qualityHint: "Higher quality uses more CPU and larger files.",
  frameRate: "Frame rate",
  fpsHint: "60 FPS requires a capable device.",
  videoBitrate: "Video bitrate",
  audioBitrate: "Audio bitrate",
  bitrateAuto: "Auto",

  // Webcam overlay
  overlayTitle: "Webcam overlay",
  webcamShape: "Webcam shape",
  shapeRounded: "Rounded",
  shapeCircle: "Circle",
  cameraPosition: "Camera position",
  posTopLeft: "Top left",
  posTopRight: "Top right",
  posBottomLeft: "Bottom left",
  posBottomRight: "Bottom right",
  cameraSize: "Camera size",
  overlayMargin: "Overlay margin",
  overlayBorder: "Overlay border",
  overlayShadow: "Overlay shadow",
  watermark: "Watermark",
  countdown: "Countdown before recording",
  countdownSeconds: "Countdown seconds",

  // Timer / status
  recordingTimer: "Recording timer",
  ready: "Ready",
  recording: "Recording",
  paused: "Paused",
  stopped: "Stopped",
  micOn: "Mic On",
  camOn: "Cam On",
  screenOn: "Screen On",
  audioOn: "Audio On",

  // Buttons
  startRecording: "Start recording",
  pause: "Pause",
  resume: "Resume",
  stop: "Stop",
  reset: "Reset",
  preview: "Preview",
  downloadVideo: "Download video",
  recordAgain: "Record again",
  copyDetails: "Copy technical details",
  copied: "Copied to clipboard",
  fullscreen: "Fullscreen",
  exitFullscreen: "Exit fullscreen",

  // Live preview
  livePreviewTitle: "Live preview",
  livePreviewDesc: "This is how your final video will look.",
  previewEmpty: "Enable the screen or webcam source to see a live preview.",
  previewWebcamHint: "Webcam is shown as an overlay.",
  compositeHint: "Screen + webcam are composited into one video.",
  directHint: "Recording the screen stream directly for best performance.",

  // Final recording
  finalTitle: "Your recording",
  finalDesc: "Preview and download your local recording.",
  finalEmpty: "No recording yet. Press Start Recording to begin.",
  finalDuration: "Duration",
  finalMime: "MIME type",
  finalSize: "File size",
  finalResolution: "Resolution",
  finalFormat: "Format",

  // Help / compatibility
  helpTitle: "Help & compatibility",
  helpDesc: "Browser support for screen capture varies widely.",
  helpSupportsTitle: "Feature support",
  helpSupportsDisplay: "Screen capture (getDisplayMedia)",
  helpSupportsUser: "Webcam & mic (getUserMedia)",
  helpSupportsRecorder: "MediaRecorder",
  helpSupportsCanvas: "Canvas capture stream",
  helpSupported: "Supported",
  helpUnsupported: "Not supported",
  helpNotes: "Notes",
  helpNote1: "Screen capture permissions must be granted by you in the browser picker.",
  helpNote2: "System audio capture depends on your browser and the sharing mode (tab vs. screen).",
  helpNote3: "This app works best in recent Chromium-based browsers (Chrome, Edge, Brave).",
  helpNote4: "Output format is typically WebM (VP9/VP8 + Opus).",
  helpNote5: "If a source is denied, recording continues with the remaining sources when possible.",

  // Footer
  footerText:
    "This website was created with the help of Abdellatif Said —",
  footerYoutube: "YouTube",
  footerFacebook: "Facebook",
  footerCodedBy: "Coded by",
  footerContact: "Contact me",
  footerWhatsapp: "WhatsApp",
  footerEmail: "Email",
  footerRights: "All rights reserved.",

  // Errors / states
  errUnsupported:
    "Your browser does not support one or more required features. Please use a recent Chromium-based browser.",
  errScreenDenied:
    "Screen capture was cancelled or denied. Please allow screen sharing and try again.",
  errScreenEnded: "Screen sharing ended. Your recording so far has been saved.",
  errCamDenied:
    "Camera permission was denied. Recording will continue without the webcam.",
  errMicDenied:
    "Microphone permission was denied. Recording will continue without the mic.",
  errRecorder:
    "Recording failed to start. Your browser may not support the chosen format.",
  errGeneric: "Something went wrong. Please try again.",
  warnNoSources: "Select at least one source (screen, webcam or microphone) to record.",
  warnCamNoStream: "Webcam preview is unavailable. Check your camera device.",
  browserBanner:
    "For the best experience, use a recent Chromium-based browser such as Chrome or Edge.",
  dismiss: "Dismiss",

  // Misc
  secondsShort: "s",
  recordingInProgress: "Recording in progress",
  previewReady: "Preview ready",
  permissionDenied: "Permission denied",
  unsupportedBrowser: "Unsupported browser",
  enableCameraFirst: "Enable the webcam to preview it",
  dragToMove: "Drag to move",
  ariaRecordingStatus: "Recording status",
  ariaPreview: "Live preview area",
  ariaTimer: "Elapsed recording time",

  // Format preview / output extras
  outputFormat: "Output format",
  outputFormatHint: "Best supported codec negotiated by your browser.",
  willRecordAs: "Will record as",
  codec: "Codec",

  // Keyboard shortcuts
  shortcutsTitle: "Keyboard shortcuts",
  shortcutsDesc: "Speed up your workflow with these shortcuts.",
  shortcutStart: "Start / Stop recording",
  shortcutPause: "Pause / Resume",
  shortcutReset: "Reset session",
  shortcutToggleLang: "Switch language",
  shortcutToggleTheme: "Toggle theme",
  shortcutToggleWebcam: "Toggle webcam",
  shortcutToggleMic: "Toggle microphone",
  shortcutClose: "Close",
  showShortcuts: "Show shortcuts",
  pressKey: "Press",

  // Persistence
  preferencesSaved: "Preferences saved",

  // Round 3 — draggable overlay, snapshots, PiP, live stats
  webcamFreePos: "Custom position",
  webcamFreePosHint: "Drag the webcam overlay to reposition it.",
  resetPosition: "Reset position",
  customPosition: "Custom",
  snapshot: "Snapshot",
  snapshotTitle: "Snapshots",
  snapshotDesc: "Still frames captured during recording.",
  snapshotEmpty: "No snapshots yet. Capture frames while recording.",
  captureSnapshot: "Capture snapshot",
  downloadSnapshot: "Download snapshot",
  clearSnapshots: "Clear snapshots",
  pictureInPicture: "Picture-in-picture",
  exitPictureInPicture: "Exit picture-in-picture",
  liveStats: "Live stats",
  statElapsed: "Elapsed",
  statSize: "Est. size",
  statFps: "FPS",
  statAudio: "Audio",
  pipUnsupported: "Picture-in-picture is not supported in this browser.",
  snapshotsCount: "snapshots",

  // Round 4 — adaptive FPS, waveform, timeline, persistence
  adaptiveFps: "Adaptive FPS",
  adaptiveFpsHint: "Auto-reduce frame rate if the device can't keep up.",
  actualFps: "Actual FPS",
  fpsDowngraded: "Frame rate reduced for stability",
  waveform: "Waveform",
  waveformMic: "Microphone waveform",
  timeline: "Timeline",
  timelineHint: "Snapshot markers are shown on the timeline.",
  noSnapshotsOnTimeline: "No snapshot markers yet.",
  langPreference: "Language preference saved",
  themePreference: "Theme preference saved",
  studioMode: "Studio mode",
  idleHint: "Enable sources to see a live preview here.",
};

const ar: Dict = {
  // Brand / header
  brandName: "ويب برو ريكورد",
  privacyNote: "تسجيلك يبقى على جهازك",
  languageLabel: "اللغة",
  themeLabel: "المظهر",
  themeLight: "فاتح",
  themeDark: "داكن",
  toggleTheme: "تبديل المظهر",
  switchToArabic: "العربية",
  switchToEnglish: "English",

  // Hero
  heroBadge: "يعمل بالكامل داخل المتصفح · بدون رفع",
  heroTitle: "سجّل شاشتك وكاميرتك وميكروفونك — مباشرةً من المتصفح",
  heroSubtitle:
    "استوديو يُعطي الأولوية للخصوصية ويلتقط شاشتك وكاميرتك وميكروفونك باستخدام واجهات الويب الأصلية فقط. لا شيء يغادر جهازك. بدون حسابات ولا واجهات ذكاء اصطناعي ولا خوادم.",
  trustNoUpload: "بدون رفع",
  trustLocal: "يعمل محليًا",
  trustNoAi: "بدون ذكاء اصطناعي",
  trustNoAccount: "بدون حساب",
  trustNoUploadDesc: "تتم معالجة التسجيلات على جهازك.",
  trustLocalDesc: "مبني بالكامل على واجهات المتصفح القياسية.",
  trustNoAiDesc: "لا تُستخدم أي خدمات ذكاء اصطناعي.",
  trustNoAccountDesc: "افتح الصفحة وابدأ التسجيل فورًا.",

  // Onboarding
  onboardTitle: "كيف يعمل",
  onboardStep1: "١. اختر ما تريد التقاطه — الشاشة و/أو الكاميرا و/أو الميكروفون.",
  onboardStep2: "٢. ضع طبقة الكاميرا واختر إعدادات الجودة.",
  onboardStep3: "٣. اضغط ابدأ التسجيل ومنح الأذونات في المتصفح.",
  onboardStep4: "٤. عاين النتيجة ثم نزّل الفيديو محليًا.",

  // Recorder controls
  controlPanelTitle: "إعدادات التسجيل",
  controlPanelDesc: "اضبط مصادر الالتقاط والطبقة العلوية.",
  sourcesTitle: "مصادر الالتقاط",
  screen: "الشاشة",
  screenDesc: "التقط شاشة أو نافذة أو تبويب متصفح.",
  webcam: "الكاميرا",
  webcamDesc: "اعرض كاميرتك كطبقة علوية.",
  microphone: "الميكروفون",
  microphoneDesc: "سجّل صوتك مع الالتقاط.",
  systemAudio: "صوت النظام",
  systemAudioDesc: "يُلتقط عندما يشارك المتصفح صوت التبويب/النظام.",
  systemAudioHint: "يعتمد توفر صوت النظام على متصفحك ووضع المشاركة.",
  screenSourceInfo: "مصدر الشاشة",
  screenSourceNone: "غير محدد",
  cameraDevice: "جهاز الكاميرا",
  micDevice: "جهاز الميكروفون",
  noDevices: "لا توجد أجهزة",
  refreshDevices: "تحديث الأجهزة",
  selectCamera: "اختر كاميرا",
  selectMic: "اختر ميكروفونًا",

  // Quality / output
  outputTitle: "الإخراج",
  outputQuality: "جودة الإخراج",
  quality720: "٧٢٠p",
  quality1080: "١٠٨٠p",
  quality1440: "١٤٤٠p",
  qualityNative: "الأصلية (الأفضل)",
  qualityHint: "الجودة الأعلى تستهلك معالجًا أكثر وملفات أكبر.",
  frameRate: "معدل الإطارات",
  fpsHint: "٦٠ إطارًا يتطلب جهازًا قادرًا.",
  videoBitrate: "معدل بت الفيديو",
  audioBitrate: "معدل بت الصوت",
  bitrateAuto: "تلقائي",

  // Webcam overlay
  overlayTitle: "طبقة الكاميرا",
  webcamShape: "شكل الكاميرا",
  shapeRounded: "مستدير الحواف",
  shapeCircle: "دائري",
  cameraPosition: "موضع الكاميرا",
  posTopLeft: "أعلى اليسار",
  posTopRight: "أعلى اليمين",
  posBottomLeft: "أسفل اليسار",
  posBottomRight: "أسفل اليمين",
  cameraSize: "حجم الكاميرا",
  overlayMargin: "هامش الطبقة",
  overlayBorder: "حدود الطبقة",
  overlayShadow: "ظل الطبقة",
  watermark: "علامة مائية",
  countdown: "عدّ تنازلي قبل التسجيل",
  countdownSeconds: "ثواني العدّ",

  // Timer / status
  recordingTimer: "مؤقت التسجيل",
  ready: "جاهز",
  recording: "جارٍ التسجيل",
  paused: "متوقف مؤقتًا",
  stopped: "متوقف",
  micOn: "الميكروفون يعمل",
  camOn: "الكاميرا تعمل",
  screenOn: "الشاشة تعمل",
  audioOn: "الصوت يعمل",

  // Buttons
  startRecording: "ابدأ التسجيل",
  pause: "إيقاف مؤقت",
  resume: "استئناف",
  stop: "إيقاف",
  reset: "إعادة ضبط",
  preview: "معاينة",
  downloadVideo: "تنزيل الفيديو",
  recordAgain: "سجّل مرة أخرى",
  copyDetails: "نسخ التفاصيل التقنية",
  copied: "تم النسخ إلى الحافظة",
  fullscreen: "ملء الشاشة",
  exitFullscreen: "إنهاء ملء الشاشة",

  // Live preview
  livePreviewTitle: "المعاينة المباشرة",
  livePreviewDesc: "هكذا سيبدو الفيديو النهائي.",
  previewEmpty: "فعّل مصدر الشاشة أو الكاميرا لرؤية معاينة مباشرة.",
  previewWebcamHint: "تُعرض الكاميرا كطبقة علوية.",
  compositeHint: "تُدمج الشاشة والكاميرا في فيديو واحد.",
  directHint: "يتم تسجيل بث الشاشة مباشرة لأفضل أداء.",

  // Final recording
  finalTitle: "تسجيلك",
  finalDesc: "عاين ونزّل تسجيلك المحلي.",
  finalEmpty: "لا يوجد تسجيل بعد. اضغط ابدأ التسجيل للبدء.",
  finalDuration: "المدة",
  finalMime: "نوع MIME",
  finalSize: "حجم الملف",
  finalResolution: "الدقة",
  finalFormat: "الصيغة",

  // Help / compatibility
  helpTitle: "المساعدة والتوافق",
  helpDesc: "يختلف دعم التقاط الشاشة بين المتصفحات بشكل كبير.",
  helpSupportsTitle: "دعم الميزات",
  helpSupportsDisplay: "التقاط الشاشة (getDisplayMedia)",
  helpSupportsUser: "الكاميرا والميكروفون (getUserMedia)",
  helpSupportsRecorder: "MediaRecorder",
  helpSupportsCanvas: "التقاط تدفق اللوحة (captureStream)",
  helpSupported: "مدعوم",
  helpUnsupported: "غير مدعوم",
  helpNotes: "ملاحظات",
  helpNote1: "يجب أن تمنح أذونات التقاط الشاشة بنفسك من نافذة المتصفح.",
  helpNote2: "يعتمد التقاط صوت النظام على متصفحك ووضع المشاركة (تبويب مقابل شاشة).",
  helpNote3: "يعمل التطبيق بشكل أفضل في متصفحات Chromium الحديثة (Chrome وEdge وBrave).",
  helpNote4: "صيغة الإخراج عادةً WebM (VP9/VP8 + Opus).",
  helpNote5: "إذا رُفض أحد المصادر، يُستكمل التسجيل بالمصادر المتبقية عند الإمكان.",

  // Footer
  footerText: "تم إنشاء هذا الموقع بمساعدة عبداللطيف سعيد —",
  footerYoutube: "يوتيوب",
  footerFacebook: "فيسبوك",
  footerCodedBy: "برمجة",
  footerContact: "تواصل معي",
  footerWhatsapp: "واتساب",
  footerEmail: "البريد",
  footerRights: "جميع الحقوق محفوظة.",

  // Errors / states
  errUnsupported:
    "متصفحك لا يدعم ميزة أو أكثر مطلوبة. يُرجى استخدام متصفح حديث مبني على Chromium.",
  errScreenDenied: "أُلغي التقاط الشاشة أو رُفض. يُرجى السماح بمشاركة الشاشة والمحاولة مجددًا.",
  errScreenEnded: "انتهت مشاركة الشاشة. تم حفظ ما تم تسجيله حتى الآن.",
  errCamDenied: "رُفض إذن الكاميرا. سيستمر التسجيل بدون الكاميرا.",
  errMicDenied: "رُفض إذن الميكروفون. سيستمر التسجيل بدون الميكروفون.",
  errRecorder: "تعذّر بدء التسجيل. قد لا يدعم متصفحك الصيغة المختارة.",
  errGeneric: "حدث خطأ ما. يُرجى المحاولة مرة أخرى.",
  warnNoSources: "اختر مصدرًا واحدًا على الأقل (شاشة أو كاميرا أو ميكروفون) للتسجيل.",
  warnCamNoStream: "معاينة الكاميرا غير متاحة. تحقق من جهاز الكاميرا.",
  browserBanner:
    "للحصول على أفضل تجربة، استخدم متصفحًا حديثًا مبنيًا على Chromium مثل Chrome أو Edge.",
  dismiss: "إخفاء",

  // Misc
  secondsShort: "ث",
  recordingInProgress: "التسجيل جارٍ",
  previewReady: "المعاينة جاهزة",
  permissionDenied: "تم رفض الإذن",
  unsupportedBrowser: "متصفح غير مدعوم",
  enableCameraFirst: "فعّل الكاميرا لمعاينتها",
  dragToMove: "اسحب للتحريك",
  ariaRecordingStatus: "حالة التسجيل",
  ariaPreview: "منطقة المعاينة المباشرة",
  ariaTimer: "الوقت المنقضي للتسجيل",

  // Format preview / output extras
  outputFormat: "صيغة الإخراج",
  outputFormatHint: "يتم التفاوض على أفضل ترميز مدعوم من متصفحك.",
  willRecordAs: "سيُسجَّل كـ",
  codec: "الترميز",

  // Keyboard shortcuts
  shortcutsTitle: "اختصارات لوحة المفاتيح",
  shortcutsDesc: "تسارع في عملك مع هذه الاختصارات.",
  shortcutStart: "بدء / إيقاف التسجيل",
  shortcutPause: "إيقاف مؤقت / استئناف",
  shortcutReset: "إعادة ضبط الجلسة",
  shortcutToggleLang: "تبديل اللغة",
  shortcutToggleTheme: "تبديل المظهر",
  shortcutToggleWebcam: "تبديل الكاميرا",
  shortcutToggleMic: "تبديل الميكروفون",
  shortcutClose: "إغلاق",
  showShortcuts: "إظهار الاختصارات",
  pressKey: "اضغط",

  // Persistence
  preferencesSaved: "تم حفظ التفضيلات",

  // Round 3 — draggable overlay, snapshots, PiP, live stats
  webcamFreePos: "موضع مخصّص",
  webcamFreePosHint: "اسحب طبقة الكاميرا لإعادة تحديد موضعها.",
  resetPosition: "إعادة ضبط الموضع",
  customPosition: "مخصّص",
  snapshot: "لقطة",
  snapshotTitle: "اللقطات",
  snapshotDesc: "إطارات ثابتة التُقطت أثناء التسجيل.",
  snapshotEmpty: "لا توجد لقطات بعد. التقط إطارات أثناء التسجيل.",
  captureSnapshot: "التقاط لقطة",
  downloadSnapshot: "تنزيل اللقطة",
  clearSnapshots: "مسح اللقطات",
  pictureInPicture: "صورة داخل صورة",
  exitPictureInPicture: "إنهاء صورة داخل صورة",
  liveStats: "إحصائيات مباشرة",
  statElapsed: "المنقضي",
  statSize: "الحجم التقريبي",
  statFps: "إطار/ث",
  statAudio: "الصوت",
  pipUnsupported: "صورة داخل صورة غير مدعومة في هذا المتصفح.",
  snapshotsCount: "لقطات",

  // Round 4 — adaptive FPS, waveform, timeline, persistence
  adaptiveFps: "معدل إطارات تكيّفي",
  adaptiveFpsHint: "تقليل معدل الإطارات تلقائيًا إذا لم يواكب الجهاز.",
  actualFps: "الإطارات الفعلية",
  fpsDowngraded: "تم تقليل معدل الإطارات للاستقرار",
  waveform: "الموجة",
  waveformMic: "موجة الميكروفون",
  timeline: "الخط الزمني",
  timelineHint: "تُعرض علامات اللقطات على الخط الزمني.",
  noSnapshotsOnTimeline: "لا توجد علامات لقطات بعد.",
  langPreference: "تم حفظ تفضيل اللغة",
  themePreference: "تم حفظ تفضيل المظهر",
  studioMode: "وضع الاستوديو",
  idleHint: "فعّل المصادر لرؤية معاينة مباشرة هنا.",
};

export const dictionaries: Record<Lang, Dict> = { en, ar };

export function translate(lang: Lang, key: string): string {
  return dictionaries[lang]?.[key] ?? dictionaries.en[key] ?? key;
}

export const isRtl = (lang: Lang) => lang === "ar";
