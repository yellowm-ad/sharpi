import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "셰르피 — 강아지를 자유롭게",
  description: "반려견 산책 보조 로봇 셰르피와 연동되는 산책지원 플랫폼",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563EB",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="mx-auto min-h-dvh max-w-[480px] bg-surface">{children}</body>
    </html>
  );
}
