import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Morrow",
  icons: { icon: "/morrow-icon.svg", apple: "/morrow-apple-icon.png" },
  title: "에이전트 면접 | Morrow",
  description: "내 에이전트가 나를 대신해 새로운 커리어 기회를 찾고 면접을 준비합니다.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
