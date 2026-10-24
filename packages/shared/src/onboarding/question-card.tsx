"use client";

import type { Answer, Question } from "./interview";
import type { Messages } from "./messages";

const input = "w-full rounded border border-neutral-300 bg-white px-3 py-2";
const isOther = (option: string) => /^(기타|other)$/i.test(option.trim());

type Props = {
  question: Question;
  value: Answer | undefined;
  onChange: (value: Answer) => void;
  note: string;
  onNoteChange: (note: string) => void;
  t: Messages;
};

// "기타"를 고르면 직접 입력한 값을 "기타: ..." 형태로 저장한다.
export function QuestionCard({ question, value, onChange, note, onNoteChange, t }: Props) {
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  const otherText = selected.find((item) => item.startsWith("기타: "))?.slice(4) ?? "";

  function toggle(option: string) {
    const label = isOther(option) ? `기타: ${otherText}` : option;
    if (question.type === "single") return onChange(label);
    const rest = selected.filter((item) => item !== option && !(isOther(option) && item.startsWith("기타: ")));
    onChange(rest.length === selected.length ? [...selected, label] : rest);
  }

  function setOther(text: string) {
    const label = `기타: ${text}`;
    if (question.type === "single") return onChange(label);
    onChange([...selected.filter((item) => !item.startsWith("기타: ")), label]);
  }

  return (
    <fieldset className="flex flex-col gap-2 rounded border border-neutral-200 p-4">
      <legend className="font-medium">{question.text}</legend>
      <p className="text-sm text-neutral-600">{question.why}</p>
      {question.context && <p className="rounded bg-neutral-100 p-3 text-sm text-neutral-700">{question.context}</p>}
      {question.sources?.length ? (
        <p className="text-xs text-neutral-500">
          {t.sources}:{" "}
          {question.sources.map((source, index) => (
            <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="underline">
              {index ? ", " : ""}
              {source.title || source.url}
            </a>
          ))}
        </p>
      ) : null}
      {(question.type === "single" || question.type === "multi") &&
        question.options.map((option) => {
          const checked = isOther(option) ? selected.some((item) => item.startsWith("기타: ")) : selected.includes(option);
          return (
            <label key={option} className="flex items-center gap-2">
              <input
                type={question.type === "single" ? "radio" : "checkbox"}
                name={question.id}
                checked={checked}
                onChange={() => toggle(option)}
              />
              {option}
              {isOther(option) && checked && (
                <input className={input} placeholder={t.otherPlaceholder} value={otherText} onChange={(e) => setOther(e.target.value)} />
              )}
            </label>
          );
        })}
      {(question.type === "single" || question.type === "multi") && (
        <input className={input} placeholder={t.notePlaceholder} value={note} onChange={(e) => onNoteChange(e.target.value)} />
      )}
      {question.type === "text" && (
        <textarea className={input} rows={3} value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)} />
      )}
      {question.type === "number" && (
        <label className="flex items-center gap-2">
          <input
            className={input}
            type="number"
            min={0}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
          />
          {question.unit && <span className="shrink-0 text-sm text-neutral-600">{question.unit}</span>}
        </label>
      )}
    </fieldset>
  );
}
