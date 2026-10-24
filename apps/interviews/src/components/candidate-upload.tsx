"use client";
import { useState, type ChangeEvent } from "react";
import {
  fileLimit,
  inputError,
  parseCandidateFiles,
  uploadLimit,
  type CandidateInput,
} from "@/lib/candidate-input";

export function CandidateUpload({
  disabled,
  onPrepared,
}: {
  disabled: boolean;
  onPrepared: (candidate: CandidateInput | null | undefined) => void;
}) {
  const [candidate, setCandidate] = useState<CandidateInput>();
  const [folder, setFolder] = useState("");
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [demo, setDemo] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string>();
  async function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    setLoading(true);
    setCandidate(undefined);
    setDemo(false);
    setConfirmed(false);
    setError(undefined);
    onPrepared(undefined);
    try {
      if (files.length > fileLimit)
        throw new Error(`파일은 ${fileLimit}개 이하로 준비해주세요.`);
      if (files.reduce((total, file) => total + file.size, 0) > uploadLimit)
        throw new Error("자료 전체 크기는 1MB 이하여야 합니다.");
      const parsed = parseCandidateFiles(
        await Promise.all(
          files.map(async (file) => ({
            path: file.webkitRelativePath || file.name,
            content: await file.text(),
          })),
        ),
      );
      setCandidate(parsed);
      setFolder(files[0].webkitRelativePath.split("/")[0] || "선택한 자료");
      setCount(files.length);
    } catch (cause) {
      setError(inputError(cause));
    } finally {
      setLoading(false);
    }
  }
  function useDemo() {
    setDemo(true);
    setCandidate(undefined);
    setError(undefined);
    setConfirmed(false);
    onPrepared(null);
  }
  return (
    <section className="upload-panel" aria-labelledby="upload-heading">
      <div className="upload-intro">
        <p className="eyebrow">01 / YOUR STORY</p>
        <h2 id="upload-heading">내 자료로 시작하세요.</h2>
        <p>
          경력과 희망 조건을 담은 폴더를 올리면
          <br />
          에이전트가 맞는 공고부터 찾아갑니다.
        </p>
        <div className="upload-limits">
          <span>프로필 v1</span>
          <span>JSON + Markdown</span>
          <span>최대 1MB</span>
        </div>
        <details className="upload-help">
          <summary>어떤 폴더를 올리나요?</summary>
          <p>
            index.json에 publicProfile, privateProfile, confirmed_at,
            salaryPeriod를 넣고, docs에 등록한 public/·private/ Markdown 파일을
            함께 준비해주세요.
          </p>
          <p>
            PDF·원본 이력서의 프로필 변환은 온보딩 앱에서 진행합니다. 여기서는
            정리된 프로필 v1 자료를 사용합니다.
          </p>
        </details>
      </div>
      <div className="upload-controls">
        <div
          className={`folder-picker ${disabled || loading ? "disabled" : ""}`}
        >
          <span className="folder-symbol" aria-hidden="true">
            ↥
          </span>
          <strong>
            {loading
              ? "자료를 확인하고 있어요…"
              : candidate
                ? folder
                : "구직자 자료 폴더 선택"}
          </strong>
          <span>index.json과 등록된 문서를 함께 선택해주세요.</span>
          <input
            type="file"
            multiple
            {...{ webkitdirectory: "" }}
            aria-label="구직자 자료 폴더 선택"
            disabled={disabled || loading}
            onChange={(event) => void selectFiles(event)}
          />
        </div>
        <div className="upload-alternative">
          <span>
            {candidate
              ? `${count}개 파일 읽기 완료`
              : demo
                ? "샘플 프로필이 준비되었습니다"
                : "준비된 자료가 아직 없나요?"}
          </span>
          <button
            className="text-button"
            type="button"
            disabled={disabled || loading}
            onClick={useDemo}
          >
            샘플로 체험하기
          </button>
        </div>
        {error && (
          <p role="alert" className="upload-error">
            {error}
          </p>
        )}
        {demo && (
          <p className="upload-feedback" role="status">
            가상 구직자와 실제 공고 풀로 면접을 진행합니다.
          </p>
        )}
        {candidate && (
          <div className="upload-preview">
            <p className="eyebrow">PROFILE PREVIEW</p>
            <h3>{candidate.publicProfile.headline}</h3>
            <p>{candidate.publicProfile.summary}</p>
            <div className="preview-facts">
              <span>{candidate.publicProfile.wants.roleTypes.join(" · ")}</span>
              <span>
                공개 문서 {candidate.docs.length}개 · 비공개 문서{" "}
                {candidate.privateProfile.docs.length}개
              </span>
            </div>
            <details className="private-preview">
              <summary>나만 보는 희망 조건 확인</summary>
              <p>
                연봉 목표 {candidate.privateProfile.salary.currency}{" "}
                {candidate.privateProfile.salary.target.toLocaleString()} / 년
                <br />
                수락 하한{" "}
                {candidate.privateProfile.salary.floor.toLocaleString()} / 년
              </p>
              {candidate.privateProfile.dealbreakers.length > 0 && (
                <p>
                  필수 조건: {candidate.privateProfile.dealbreakers.join(" · ")}
                </p>
              )}
            </details>
            <label className="confirm-profile">
              <input
                type="checkbox"
                checked={confirmed}
                disabled={disabled}
                onChange={(event) => {
                  setConfirmed(event.target.checked);
                  onPrepared(event.target.checked ? candidate : undefined);
                }}
              />
              <span>
                프로필과 희망 조건을 확인했으며 이 자료로 면접을 시작합니다.
              </span>
            </label>
          </div>
        )}
        <p className="upload-privacy">
        면접 시작 시 프로필은 Claude 처리와 서버 실행 기록 저장에 사용됩니다.
        비공개 문서 원문은 전송하지 않으며, 연봉 하한은 서버에서만 비교합니다.
        </p>
      </div>
    </section>
  );
}
