"use client";

import { useState } from "react";
import { agentPrompt } from "./agent-export";
import type { CandidateFolder } from "./build";
import { demoAgentExport } from "./demo";
import { formatAnswer, noteSuffix, type Answer, type Question, type Research, type Round } from "./interview";
import { messages } from "./messages";
import { ProfileResult } from "./profile-result";
import { QuestionCard } from "./question-card";
import type { Locale } from "./questions";

type Step = "copy" | "paste" | "questions" | "done";
type Result = CandidateFolder & { mock: boolean; saved: boolean };
type StepResponse =
  | { done: false; questions: Question[]; research: Research[]; mock: boolean }
  | { done: true; folder: CandidateFolder; saved: boolean; mock: boolean }
  | { error: string };

const steps: Step[] = ["copy", "paste", "questions", "done"];
const primary = "rounded bg-neutral-900 px-4 py-3 font-semibold text-white disabled:opacity-50";

export function OnboardingWizard({ locale, onContinue }: { locale: Locale; onContinue?: (folder: CandidateFolder) => void }) {
  const t = messages[locale];
  const [step, setStep] = useState<Step>("copy");
  const [copied, setCopied] = useState(false);
  const [agentExport, setAgentExport] = useState("");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [research, setResearch] = useState<Research[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const prompt = agentPrompt(locale);

  async function advance(nextRounds: Round[]) {
    setError("");
    setPending(true);
    try {
      const response = await fetch("/api/onboarding/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, agentExport, rounds: nextRounds, research }),
      });
      const body = (await response.json()) as StepResponse;
      if ("error" in body) throw new Error(body.error);
      setRounds(nextRounds);
      if (body.done) {
        setResult({ ...body.folder, mock: body.mock, saved: body.saved });
        setStep("done");
      } else {
        setResearch(body.research);
        setQuestions(body.questions);
        setAnswers({});
        setStep("questions");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setPending(false);
    }
  }

  function submitAnswers() {
    if (questions.some((q) => formatAnswer(answers[q.id]) === "(no answer)" || formatAnswer(answers[q.id]) === "기타: "))
      return setError(t.needAllAnswers);
    void advance([...rounds, { questions, answers }]);
  }

  function restart() {
    setStep("copy");
    setRounds([]);
    setResearch([]);
    setQuestions([]);
    setAnswers({});
    setResult(null);
    setError("");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ol className="flex flex-wrap gap-2 text-sm" aria-label="progress">
        {steps.map((item, index) => (
          <li
            key={item}
            aria-current={item === step ? "step" : undefined}
            className={`rounded-full px-3 py-1 ${item === step ? "bg-neutral-900 text-white" : "border border-neutral-300 text-neutral-600"}`}
          >
            {index + 1}. {t.steps[index]}
          </li>
        ))}
      </ol>

      {step === "copy" && (
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold">{t.copyTitle}</h2>
          <p className="text-neutral-700">{t.copyBody}</p>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded bg-neutral-100 p-3 text-xs">{prompt}</pre>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={copy} className="rounded border border-neutral-900 px-4 py-3 font-semibold">
              {copied ? t.copied : t.copyPrompt}
            </button>
            <button type="button" onClick={() => setStep("paste")} className={primary}>{t.next}</button>
          </div>
        </section>
      )}

      {step === "paste" && (
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold">{t.pasteTitle}</h2>
          <button type="button" onClick={() => setAgentExport(demoAgentExport)} className="self-start text-sm underline">
            {t.loadAgentSample}
          </button>
          <label className="flex flex-col gap-1">
            {t.agentJson}
            <textarea
              rows={12}
              className="w-full rounded border border-neutral-300 bg-white px-3 py-2 font-mono text-xs"
              value={agentExport}
              onChange={(e) => setAgentExport(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setStep("copy")} className="px-4 py-3 underline">{t.back}</button>
            <button
              type="button"
              disabled={pending}
              className={primary}
              onClick={() => (agentExport.trim() ? void advance([]) : setError(t.needAgentJson))}
            >
              {pending ? t.analyzingAgent : t.analyze}
            </button>
          </div>
        </section>
      )}

      {step === "questions" && (
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold">
            {t.questionsTitle} <span className="text-base font-normal text-neutral-500">· {t.round} {rounds.length + 1}</span>
          </h2>
          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              value={answers[question.id]}
              onChange={(value) => setAnswers((current) => ({ ...current, [question.id]: value }))}
              note={(answers[`${question.id}${noteSuffix}`] as string | undefined) ?? ""}
              onNoteChange={(value) => setAnswers((current) => ({ ...current, [`${question.id}${noteSuffix}`]: value }))}
              t={t}
            />
          ))}
          <button type="button" disabled={pending} onClick={submitAnswers} className={primary}>
            {pending ? t.thinking : t.submitAnswers}
          </button>
        </section>
      )}

      {step === "done" && result && (
        <>
          <p className="text-sm text-neutral-600">{result.saved ? t.saved : t.notSaved}</p>
          <ProfileResult result={result} t={t} onRestart={restart} onContinue={onContinue} />
        </>
      )}

      {error && <p role="alert" className="text-red-700">{error}</p>}
    </div>
  );
}
