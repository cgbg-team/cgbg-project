"use client";

import { useState } from "react";
import { Onboarding } from "@cgbg/shared/onboarding";
import { inputError, parseCandidateFiles, type CandidateInput } from "@/lib/candidate-input";

export function OwnOnboarding({ onPrepared, onBack }: {
  onPrepared: (candidate: CandidateInput) => void;
  onBack: () => void;
}) {
  const [error, setError] = useState("");
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16">
      <button type="button" className="self-start underline" onClick={onBack}>페르소나 다시 선택</button>
      <Onboarding onContinue={(folder) => {
        try {
          onPrepared(parseCandidateFiles(folder.files));
        } catch (cause) {
          setError(inputError(cause));
        }
      }} />
      {error && <p role="alert">{error}</p>}
    </main>
  );
}
