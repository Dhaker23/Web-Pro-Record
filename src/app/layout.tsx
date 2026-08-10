import type { Metadata } from "next";
import { Geist, Geist_Mono, Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Web Pro Record — Browser-based Screen & Webcam Recorder",
  description:
    "Record your screen, webcam, and microphone entirely in your browser. No uploads, no accounts, no AI APIs. Privacy-friendly and free.",
  keywords: [
    "screen recorder",
    "webcam recorder",
    "browser recorder",
    "screen capture",
    "Web Pro Record",
  ],
  authors: [{ name: "Dhaker Amara" }],
  manifest: "/manifest.json",
  openGraph: {
    title: "Web Pro Record",
    description:
      "Browser-based screen, webcam & microphone recorder. Runs locally. No uploads.",
    siteName: "Web Pro Record",
    type: "website",
    images: [
      {
        url: "/logo.png",
        alt: "Web Pro Record",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Web Pro Record",
    description:
      "Browser-based screen, webcam & microphone recorder. Runs locally. No uploads.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
