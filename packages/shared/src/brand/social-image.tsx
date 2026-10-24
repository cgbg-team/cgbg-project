import { ImageResponse } from "next/og";

export function morrowSocialImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", background: "#fafbf7", color: "#203a32", padding: 80, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div style={{ display: "flex", gap: 24, alignItems: "center", fontSize: 64, fontWeight: 700 }}>
        <svg viewBox="0 0 40 40" width="80" height="80" fill="none">
          <rect width="40" height="40" rx="12" fill="#176342" />
          <path d="M9 28V18a5.5 5.5 0 0 1 11 0v10V18a5.5 5.5 0 0 1 11 0v10" stroke="#e1efb1" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M9 33h22" stroke="#e1efb1" strokeWidth="1.5" strokeLinecap="round" opacity=".6" />
        </svg>
        Morrow
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontSize: 76, letterSpacing: -3 }}>Your next chapter.</div>
        <div style={{ fontSize: 32, color: "#5f6f65" }}>Your agent. Your story. New opportunities.</div>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
