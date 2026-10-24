import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Morrow",
  icons: { icon: "/morrow-icon.svg", apple: "/morrow-apple-icon.png" },
  title: "구직자 온보딩 | Morrow",
  description: "경험과 숨은 강점을 정리하고 내 에이전트와 다음 커리어 기회를 찾아보세요.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
