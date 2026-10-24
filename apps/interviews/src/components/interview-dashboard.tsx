"use client";
import { useState } from "react";
import type { PublicProfile } from "@cgbg/shared/profile";
import { useInterviewRun } from "./use-interview-run";
import { OwnOnboarding } from "./own-onboarding";
import { RunProgress } from "./run-progress";
import type { CandidateInput } from "@/lib/candidate-input";
import { countryLabel, jobSummary } from "@/lib/job-countries";
import { PersonaChoice, type PersonaMode } from "./persona-choice";
import { CompanyInterviews } from "./company-interviews";
import { ProfileSummary } from "./profile-summary";

export function InterviewDashboard({
  profile,
  ready,
  initialRun,
}: {
  profile: PublicProfile;
  ready: boolean;
  initialRun?: string;
}) {
  const run = useInterviewRun(initialRun);
  const { snapshot } = run;
  // shortcut: 면접 시작 전 프로필은 메모리에만 유지하며, 입력 복원이 필요해지면 임시 저장을 추가한다.
  const [candidate, setCandidate] = useState<CandidateInput | null>();
  const [preparingOwn, setPreparingOwn] = useState(false);
  const profileCountry = profile.location.country === "GB" ? "UK" : profile.location.country;
  const [country, setCountry] = useState(jobSummary.countries.some(item => item.code === profileCountry) ? profileCountry : "");
  const [mode, setMode] = useState<PersonaMode | null>(initialRun ? "own" : null);
  const currentProfile =
    candidate?.publicProfile ?? snapshot.profile ?? profile;
  const completed = snapshot.interviews.filter((item) => !!item.result).length;
  const recommended = snapshot.interviews.filter(
    (item) => item.result?.outcome === "recommended",
  ).length;
  const running = !!run.runId && !snapshot.done && !snapshot.error;
  if (!mode) return <PersonaChoice onSelect={(choice) => {
    run.reset();
    if (choice === "sample") setCountry("US");
    setCandidate(choice === "sample" ? null : undefined);
    setPreparingOwn(choice === "own");
    setMode(choice);
  }} />;
  if (mode === "own" && preparingOwn) return <OwnOnboarding
    onBack={() => setMode(null)}
    onPrepared={(input) => {
      setCandidate(input);
      setPreparingOwn(false);
      const code = input.publicProfile.location.country === "GB" ? "UK" : input.publicProfile.location.country;
      setCountry(jobSummary.countries.some(item => item.code === code) ? code : "");
    }}
  />;
  if (mode === "sample" && !run.runId) return <ProfileSummary profile={profile} starting={run.starting} error={run.error} onBack={() => setMode(null)} onStart={() => void run.start(null, "US")} />;
  return (
    <div className="app-shell">

      <main className="main-content">
        <header className="topbar">
          <span>
            내 커리어 <span className="breadcrumb">/</span> 에이전트 면접
          </span>
          <span className="connection">
            <span className={run.connected ? "live-dot" : "idle-dot"} />
            {mode === "sample" ? "저장된 대화 · 지연 재생" : run.connected ? "진행 기록 연결됨" : "서버에서 실행 · 기록 보관"}
          </span>
        </header>
        <div className="page-heading">
          <div>
            <p className="eyebrow">YOUR NEXT CHAPTER</p>
            <h1>에이전트 면접</h1>
            <p className="lede">
              당신의 경험이 맞는 곳을, 에이전트가 먼저 만납니다.
            </p>
          </div>
          <div className="actions">
            {!running && !run.starting && <button className="button secondary" onClick={() => setMode(null)}>페르소나 다시 선택</button>}
            {running && (
              <button
                className="button secondary"
                onClick={() => void run.cancel()}
              >
                실행 중지
              </button>
            )}
            <button
              className="button primary"
              disabled={
                (mode === "own" && !ready) || run.starting || running || candidate === undefined
              }
              onClick={() => void run.start(candidate, country)}
            >
              {run.starting
                ? "시작하는 중…"
                : run.runId
                  ? "새 면접 시작 ↗"
                  : "면접 시작 ↗"}
            </button>
          </div>
        </div>
        {!ready && mode === "own" && (
          <div className="notice" role="status">
            <strong>Claude 연결을 준비해주세요.</strong>
            <p>
              서버의 .env.local에 ANTHROPIC_API_KEY와 INTERVIEW_SESSION_SECRET을
              설정하면 실제 면접을 시작할 수 있습니다.
            </p>
          </div>
        )}
        {run.error && (
          <div className="notice error" role="alert">
            {run.error}{" "}
            {run.runId && (
              <button className="text-button" onClick={run.retry}>
                기록 다시 연결
              </button>
            )}
          </div>
        )}
        {snapshot.error && (
          <p className="notice error" role="alert">
            {snapshot.error}
          </p>
        )}
        {mode === "own" ? <section className="notice" aria-label="선택한 페르소나"><strong>내 프로필로 체험합니다.</strong><p>프로필과 검색 조건을 확인한 뒤 면접 시작을 눌러주세요.</p></section> : <section className="notice" aria-label="선택한 페르소나"><strong>백지오 페르소나로 체험합니다.</strong><p>4배속 · 저장된 실제 대화를 재생합니다.</p></section>}
        <RunProgress snapshot={snapshot} started={!!run.runId} demo={mode === "sample"} />
        <div className="job-search-controls">
          {!run.runId && mode === "own" && <label>
            검색 국가{" "}
            <select value={country} onChange={(event) => setCountry(event.target.value)} disabled={mode === "sample" || running || run.starting}>
              <option value="">전체 국가 ({jobSummary.total.toLocaleString()})</option>
              {jobSummary.countries.map(({code, count}) => (
                <option value={code} key={code}>{countryLabel(code)} ({count.toLocaleString()})</option>
              ))}
            </select>
          </label>}
        </div>
        {!run.runId && <section className="candidate-strip" aria-label="면접에 사용할 프로필">
          <div className="candidate-icon" aria-hidden="true">
            ✳
          </div>
          <div>
            <span className="eyebrow">
              {snapshot.source === "upload" || candidate
                ? "YOUR AGENT BRIEF"
                : "SAMPLE AGENT BRIEF"}
            </span>
            <h2>{currentProfile.headline}</h2>
            <p>{currentProfile.wants.roleTypes.join(" · ")}</p>
          </div>
          <div className="profile-tags">
            {currentProfile.skills.slice(0, 3).map((skill) => (
              <span key={skill.name}>{skill.name}</span>
            ))}
          </div>
        </section>}
        <section className="metrics" aria-label="면접 현황">
          <div>
            <span>검색 대상</span>
            <strong>
              {(snapshot.search?.countryTotal ?? (country ? jobSummary.countries.find((item) => item.code === country)?.count ?? 0 : jobSummary.total)).toLocaleString()}<small>개 공고</small>
            </strong>
          </div>
          <div>
            <span>진행한 면접</span>
            <strong>
              {snapshot.interviews.length}
              <small>개 기업</small>
            </strong>
          </div>
          <div>
            <span>면접 완료</span>
            <strong>
              {completed}
              <small>/ {snapshot.interviews.length}</small>
            </strong>
          </div>
          <div className="accent-metric">
            <span>AI 사전검토 통과</span>
            <strong>
              {recommended}
              <small>개 기업</small>
            </strong>
          </div>
        </section>
        <CompanyInterviews interviews={snapshot.interviews} candidates={snapshot.candidates} runId={run.runId} done={snapshot.done} />
        {snapshot.excluded.length > 0 && (
          <details className="excluded">
            <summary>선택되지 않은 공고 {snapshot.excluded.length}개</summary>
            {snapshot.excluded.map(({ job, reason }) => (
              <p key={job.id}>
                <strong>
                  {job.company} · {job.title}
                </strong>
                <span>{reason}</span>
              </p>
            ))}
          </details>
        )}
        <footer className="page-footer">
          <span>
            {mode === "sample" ? "저장된 실제 대화의 시연입니다. 화면을 떠나면 재생이 멈추며 다시 시작할 수 있습니다." : "화면을 닫아도 서버에서 면접을 계속합니다. 같은 브라우저에서 24시간 동안 기록을 확인할 수 있습니다."}
          </span>
          <span>
            {snapshot.source === "upload" ? "YOUR PROFILE" : "DEMO"} · V1
          </span>
        </footer>
      </main>
    </div>
  );
}
