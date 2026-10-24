"use client";

import type { CandidateFolder } from "./build";
import type { Messages } from "./messages";

type Props = {
  result: CandidateFolder & { mock: boolean };
  t: Messages;
  onRestart: () => void;
  onContinue?: (folder: CandidateFolder) => void;
};

const interviewsUrl = process.env.NEXT_PUBLIC_INTERVIEWS_URL || "http://localhost:3001";

function Chips({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-semibold">{title}</h3>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item} className="rounded-full border border-neutral-300 px-3 py-1 text-sm">{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function ProfileResult({ result, t, onRestart, onContinue }: Props) {
  const { publicProfile, privateProfile } = result.manifest;

  return (
    <section className="flex flex-col gap-6">
      {result.mock && <p className="text-sm text-amber-700">{t.mockNotice}</p>}
      <h2 className="text-2xl font-semibold">{t.resultTitle}</h2>
      <p className="text-xl">{t.wow}</p>
      <div>
        <p className="font-medium">{publicProfile.headline}</p>
        <p className="text-neutral-700">{publicProfile.summary}</p>
      </div>
      <Chips title={t.resumeSkills} items={publicProfile.skills.map((skill) => skill.name)} />
      <section className="flex flex-col gap-2">
        <h3 className="font-semibold">{t.hiddenSkills}</h3>
        <ul className="flex flex-col gap-2">
          {publicProfile.transferableStrengths.map((item) => (
            <li key={item.strength} className="rounded border border-neutral-300 p-3">
              <p className="font-medium">{item.strength}</p>
              <p className="text-sm text-neutral-700">{item.why}</p>
              {item.evidence[0]?.quote && (
                <p className="mt-1 text-sm text-neutral-500">“{item.evidence[0].quote}”</p>
              )}
            </li>
          ))}
        </ul>
      </section>
      <Chips title={t.roleTypes} items={publicProfile.wants.roleTypes} />
      {privateProfile.openQuestions.length > 0 && (
        <Chips title={t.openQuestions} items={privateProfile.openQuestions} />
      )}
      <div className="flex flex-wrap gap-3">
        {onContinue ? <button type="button" onClick={() => onContinue(result)} className="rounded bg-neutral-900 px-4 py-3 font-semibold text-white">
          {t.continueInterviews}
        </button> : <a href={interviewsUrl} className="rounded bg-neutral-900 px-4 py-3 font-semibold text-white">
          {t.goInterviews}
        </a>}
        <button type="button" onClick={onRestart} className="px-4 py-3 underline">{t.restart}</button>
      </div>
      {onContinue && <p className="text-sm text-neutral-500">{t.directHandoff}</p>}
    </section>
  );
}
