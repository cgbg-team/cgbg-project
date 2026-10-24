"use client";

import { useState, type FormEvent } from "react";
import { demoExtra, demoResume } from "@/lib/onboarding/demo";
import { messages } from "@/lib/onboarding/messages";
import { questionIds, questions, type Locale } from "@/lib/onboarding/questions";
import type { CandidateFolder } from "@/lib/onboarding/build";
import { ProfileResult } from "./profile-result";

type Result = CandidateFolder & { mock: boolean };

const input = "w-full rounded border border-neutral-300 bg-white px-3 py-2";

export function OnboardingForm() {
  const [locale, setLocale] = useState<Locale>("ko");
  const [resumeText, setResumeText] = useState("");
  const [extraText, setExtraText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const t = messages[locale];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get("resumeFile");
    if (!(file instanceof File && file.size > 0) && !resumeText.trim()) return setError(t.needResume);
    if (questionIds.some((id) => !form.get(id))) return setError(t.needAnswers);
    if (Number(form.get("floor")) > Number(form.get("target"))) return setError(t.needSalary);
    form.set("locale", locale);
    form.set("remoteOk", String(form.get("remoteOk") === "on"));
    form.set("relocateOk", String(form.get("relocateOk") === "on"));
    setError("");
    setPending(true);
    try {
      const response = await fetch("/api/onboarding/parse", { method: "POST", body: form });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setResult(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setPending(false);
    }
  }

  if (result) return <ProfileResult result={result} t={t} onRestart={() => setResult(null)} />;

  return (
    <form onSubmit={submit} className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-lg text-neutral-700">{t.tagline}</p>
        <button type="button" className="text-sm underline" onClick={() => setLocale(locale === "ko" ? "en" : "ko")}>
          {locale === "ko" ? "English" : "한국어"}
        </button>
      </div>
      <p className="text-sm text-neutral-500">{t.demoNotice}</p>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-xl font-semibold">{t.materials}</legend>
        <button
          type="button"
          className="self-start text-sm underline"
          onClick={() => {
            setResumeText(demoResume);
            setExtraText(demoExtra);
          }}
        >
          {t.loadSample}
        </button>
        <label className="flex flex-col gap-1">
          {t.resumeFile}
          <input name="resumeFile" type="file" accept="application/pdf" />
        </label>
        <label className="flex flex-col gap-1">
          {t.resumeText}
          <textarea name="resumeText" rows={6} className={input} value={resumeText} onChange={(e) => setResumeText(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          {t.extraText}
          <span className="text-sm text-neutral-500">{t.extraHint}</span>
          <textarea name="extraText" rows={6} className={input} value={extraText} onChange={(e) => setExtraText(e.target.value)} />
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-5">
        <legend className="mb-2 text-xl font-semibold">{t.interview}</legend>
        {questionIds.map((id, index) => (
          <div key={id} role="radiogroup" aria-label={t.q[id]} className="flex flex-col gap-2">
            <p className="font-medium">Q{index + 1}. {t.q[id]}</p>
            {questions[id].map((option) => (
              <label key={option} className="flex items-center gap-2">
                <input type="radio" name={id} value={option} />
                {t.a[option]}
              </label>
            ))}
          </div>
        ))}
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-2 text-xl font-semibold">{t.conditions}</legend>
        <label className="flex flex-col gap-1">
          {t.country}
          <input name="country" defaultValue="US" required className={input} />
        </label>
        <label className="flex flex-col gap-1">
          {t.currency}
          <select name="currency" defaultValue="USD" className={input}>
            <option value="USD">USD</option>
            <option value="KRW">KRW</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          {t.target}
          <input name="target" type="number" min={1} defaultValue={150000} required className={input} />
        </label>
        <label className="flex flex-col gap-1">
          {t.floor}
          <input name="floor" type="number" min={1} defaultValue={110000} required className={input} />
        </label>
        <label className="flex items-center gap-2">
          <input name="remoteOk" type="checkbox" defaultChecked /> {t.remoteOk}
        </label>
        <label className="flex items-center gap-2">
          <input name="relocateOk" type="checkbox" /> {t.relocateOk}
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          {t.dealbreakers}
          <textarea name="dealbreakers" rows={2} className={input} />
        </label>
      </fieldset>

      {error && <p role="alert" className="text-red-700">{error}</p>}
      <button type="submit" disabled={pending} className="rounded bg-neutral-900 px-4 py-3 font-semibold text-white disabled:opacity-50">
        {pending ? t.analyzing : t.submit}
      </button>
    </form>
  );
}
