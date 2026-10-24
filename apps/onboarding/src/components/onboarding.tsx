"use client";

import { useEffect, useState } from "react";
import { messages } from "@/lib/onboarding/messages";
import type { Locale } from "@/lib/onboarding/questions";
import { OnboardingForm } from "./onboarding-form";

const locales: { id: Locale; label: string }[] = [
  { id: "ko", label: "한국어" },
  { id: "en", label: "English" },
];

export function Onboarding() {
  const [locale, setLocale] = useState<Locale>("ko");
  const t = messages[locale];

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <>
      <header className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-neutral-600">BEYOND CV</p>
        <div role="group" aria-label={t.language} className="flex rounded border border-neutral-300 text-sm">
          {locales.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={locale === item.id}
              onClick={() => setLocale(item.id)}
              className={`px-3 py-1 ${locale === item.id ? "bg-neutral-900 text-white" : ""}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t.title}</h1>
      <p className="text-lg text-neutral-700">{t.tagline}</p>
      <OnboardingForm locale={locale} />
    </>
  );
}
