import Link from "next/link";

export function MorrowLogo() {
  return <Link href="/" className="morrow-logo" aria-label="Morrow 홈">
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="12" fill="currentColor" />
      <path d="M9 28V18a5.5 5.5 0 0 1 11 0v10V18a5.5 5.5 0 0 1 11 0v10" stroke="var(--morrow-logo-mark, #e1efb1)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 33h22" stroke="var(--morrow-logo-mark, #e1efb1)" strokeWidth="1.5" strokeLinecap="round" opacity=".6" />
    </svg>
    <span>Morrow</span>
  </Link>;
}
