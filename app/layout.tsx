import type { Metadata, Viewport } from "next";
import { OfflineSupport, OfflineUpdateNotice } from "./offline-support";
import { FrameRateMeter } from "./frame-rate-meter";
import "./globals.css";
import "./interface-v2.css";
import "./drink-games.css";
import "./pixel-game.css";
import "./arcade.css";
import "./runner.css";
import "./menus.css";
import "./cocoa.css";
import "./pitbull.css";
import "./lime.css";
import "./mini-screen.css";
import "./brainrot.css";
import "./adventure.css";
import "./dungeon.css";
import "./neighborhood.css";
import "./game-loading-screen.css";
import "./cloud-save-warning.css";
import "./offline-update.css";
import "./game-play-ui.css";
import "./game-settings.css";
import "./world-graphics.css";
import "./home-rooms.css";
import "./gameplay-compact-hud.css";
import "./case-cinematic.css";
import "./aura.css";
import "./computer-ux.css";
import "./interface-polish.css";
import "./game-launch.css";
import "./adventure-story.css";
import "./bar-interface.css";
import "./campaign-interface.css";
import "./coop.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? "";
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "http://127.0.0.1:3000";
const publicAsset = (path: string) => `${basePath}${path}`;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f3e7cf",
};

export const metadata: Metadata = {
  metadataBase: new URL(new URL(siteUrl).origin),
  title: "KNOPIK GO",
  description:
    "Тапай по Кнопику. Открывай новые игры напитками и собирай Knopik Coin.",
  applicationName: "Knopik GO",
  manifest: publicAsset("/manifest.webmanifest"),
  formatDetection: { telephone: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Knopik GO",
  },
  icons: {
    icon: [
      { url: publicAsset("/go-icon.svg"), type: "image/svg+xml" },
      { url: publicAsset("/go-192.png"), sizes: "192x192", type: "image/png" },
      { url: publicAsset("/go-512.png"), sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: publicAsset("/go-apple-touch.png"), sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "KNOPIK GO",
    description: "Один Кнопик. У каждого напитка своя игра.",
    type: "website",
    locale: "ru_RU",
    images: [{ url: publicAsset("/go-cover.png"), width: 512, height: 512, alt: "KNOPIK GO" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "KNOPIK GO",
    description: "Один Кнопик. У каждого напитка своя игра.",
    images: [publicAsset("/go-cover.png")],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body><OfflineSupport/>{children}<OfflineUpdateNotice/><FrameRateMeter /></body>
    </html>
  );
}
