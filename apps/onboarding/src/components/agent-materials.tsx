"use client";

import { useState } from "react";
import { agentPrompt } from "@/lib/onboarding/agent-export";
import { demoAgentExport } from "@/lib/onboarding/demo";
import type { Messages } from "@/lib/onboarding/messages";
import type { Locale } from "@/lib/onboarding/questions";

type Props = {
  locale: Locale;
  t: Messages;
  value: string;
  onChange: (value: string) => void;
};

export function AgentMaterials({ locale, t, value, onChange }: Props) {
  const [copied, setCopied] = useState(false);
  const prompt = agentPrompt(locale);

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <ol className="list-decimal pl-5 text-sm text-neutral-700">
        {t.agentSteps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={copy} className="rounded border border-neutral-900 px-3 py-2 text-sm font-semibold">
          {copied ? t.copied : t.copyPrompt}
        </button>
        <button type="button" onClick={() => onChange(demoAgentExport)} className="text-sm underline">
          {t.loadAgentSample}
        </button>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-neutral-600">{t.showPrompt}</summary>
        <pre className="mt-2 whitespace-pre-wrap rounded bg-neutral-100 p-3 text-xs">{prompt}</pre>
      </details>
      <label className="flex flex-col gap-1">
        {t.agentJson}
        <textarea
          name="agentExport"
          rows={10}
          className="w-full rounded border border-neutral-300 bg-white px-3 py-2 font-mono text-xs"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    </div>
  );
}
