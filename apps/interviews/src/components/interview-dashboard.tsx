"use client";
import Link from "next/link";
import { useState } from "react";
import type { PublicProfile } from "@cgbg/shared/profile";
import { stageLabels } from "@/lib/types";
import { InterviewDetail, outcomeLabels } from "./interview-detail";
import { useInterviewRun } from "./use-interview-run";
import { CandidateUpload } from "./candidate-upload";
import { RunProgress } from "./run-progress";
import type { CandidateInput } from "@/lib/candidate-input";
import { countryLabel, jobSummary } from "@/lib/job-countries";

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
  const [selected, setSelected] = useState<string>();
  const [candidate, setCandidate] = useState<CandidateInput | null>();
  const [country, setCountry] = useState("");
  const currentProfile =
    snapshot.profile ?? candidate?.publicProfile ?? profile;
  const active =
    snapshot.interviews.find((item) => item.job.id === selected) ??
    snapshot.interviews[0];
  const completed = snapshot.interviews.filter((item) => !!item.result).length;
  const recommended = snapshot.interviews.filter(
    (item) => item.result?.outcome === "recommended",
  ).length;
  const running = !!run.runId && !snapshot.done && !snapshot.error;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="cgbg 홈">
          <span className="brand-symbol">c</span> cgbg.
        </Link>
        <p className="workspace-label">CAREER WORKSPACE</p>
        <nav aria-label="주 메뉴">
          <span className="nav-item">
            01 <span>자료 업로드</span>
          </span>
          <Link href="/" className="nav-item current" aria-current="page">
            02 <span>에이전트 면접</span>
            <span>↗</span>
          </Link>
        </nav>
        <div className="sidebar-note">
          <span className="live-dot" />
          나의 커리어 워크스페이스
          <p>
            내 프로필 · 실제 공고 {jobSummary.total.toLocaleString()}개
            <br />
            Claude 에이전트의 실제 대화
          </p>
        </div>
        <div className="profile-mini">
          <div className="avatar">D</div>
          <div>
            <strong>
              {snapshot.source === "upload"
                ? "업로드한 프로필"
                : "나의 에이전트"}
            </strong>
            <span>
              프로필 v1 · {snapshot.profile ? "면접 진행 기록" : "자료 준비"}
            </span>
          </div>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <span>
            내 커리어 <span className="breadcrumb">/</span> 에이전트 면접
          </span>
          <span className="connection">
            <span className={run.connected ? "live-dot" : "idle-dot"} />
            {run.connected ? "진행 기록 연결됨" : "서버에서 실행 · 기록 보관"}
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
                !ready || run.starting || running || candidate === undefined
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
        {!ready && (
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
        <CandidateUpload
          sampleProfile={profile}
          disabled={running || run.starting}
          onPrepared={setCandidate}
        />
        <RunProgress snapshot={snapshot} started={!!run.runId} />
        <div className="job-search-controls">
          <label>
            검색 국가{" "}
            <select value={country} onChange={(event) => setCountry(event.target.value)} disabled={running || run.starting}>
              <option value="">전체 국가 ({jobSummary.total.toLocaleString()})</option>
              {jobSummary.countries.map(({code, count}) => (
                <option value={code} key={code}>{countryLabel(code)} ({count.toLocaleString()})</option>
              ))}
            </select>
          </label>
          <p>공개 공고 기반 모의 면접입니다. 실제 기업과 연락하지 않습니다.</p>
          {snapshot.search && <p role="status">{countryLabel(snapshot.search.country)} · 일치 공고 {snapshot.search.matched.toLocaleString()}개 / {snapshot.search.companies.toLocaleString()}개 기업{snapshot.search.live ? ` · 실시간 공고 ${snapshot.search.live.toLocaleString()}개 추가 검색` : ""} · 상위 최대 2개 면접</p>}
        </div>
        <section className="candidate-strip" aria-label="면접에 사용할 프로필">
          <div className="candidate-icon" aria-hidden="true">
            ✳
          </div>
          <div>
            <span className="eyebrow">
              {snapshot.source === "upload" || (!snapshot.profile && candidate)
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
        </section>
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
            <span>대면 면접 추천</span>
            <strong>
              {recommended}
              <small>개 기업</small>
            </strong>
          </div>
        </section>
        <div className="section-heading">
          <h2>
            기업별 진행 상황{" "}
            <span className="count">{snapshot.interviews.length}</span>
          </h2>
          <span role="status">
            {run.runId ? stageLabels[snapshot.stage] : "시작할 준비가 되었어요"}
          </span>
        </div>
        {snapshot.keywords.length > 0 && (
          <div className="keywords">
            <span>검색 키워드</span>
            {snapshot.keywords.map((keyword) => (
              <span
                className="keyword"
                title={`출처: ${keyword.source}`}
                key={keyword.term}
              >
                {keyword.term}
              </span>
            ))}
          </div>
        )}
        <div className="interview-workspace">
          <section className="company-list" aria-label="기업별 면접 목록">
            {snapshot.interviews.length === 0 ? (
              <div className="empty-list">
                <span className="eyebrow">READY WHEN YOU ARE</span>
                <h3>
                  반복 지원 대신,
                  <br />한 번의 시작.
                </h3>
                <p>
                  프로필에서 검색어를 찾고
                  <br />
                  맞는 공고와 최대 2건의 면접을
                  <br />
                  동시에 진행합니다.
                </p>
                <ol>
                  <li>경험 기반 공고 탐색</li>
                  <li>에이전트 간 조건 확인</li>
                  <li>대면 면접 추천 확인</li>
                </ol>
              </div>
            ) : (
              snapshot.interviews.map((item, index) => (
                <button
                  key={item.job.id}
                  className={`company-card ${active?.job.id === item.job.id ? "selected" : ""}`}
                  onClick={() => setSelected(item.job.id)}
                  aria-pressed={active?.job.id === item.job.id}
                >
                  <div className="company-card-top">
                    <span className="company-number">0{index + 1}</span>
                    <span
                      className={`badge ${item.result?.outcome ?? item.stage}`}
                    >
                      {item.result
                        ? outcomeLabels[item.result.outcome]
                        : stageLabels[item.stage]}
                    </span>
                  </div>
                  <h3>{item.job.company}</h3>
                  <p>{item.job.title}</p>
                  <div className="match-tags">
                    {item.matchReasons.map((reason) => (
                      <span key={reason}>{reason}</span>
                    ))}
                  </div>
                  <div className="card-footer">
                    <span>{item.messages.length}개 메시지</span>
                    <span aria-hidden="true">↗</span>
                  </div>
                </button>
              ))
            )}
          </section>
          <InterviewDetail interview={active} />
        </div>
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
            화면을 닫아도 서버에서 면접을 계속합니다. 같은 브라우저에서 24시간
            동안 기록을 확인할 수 있습니다.
          </span>
          <span>
            {snapshot.source === "upload" ? "YOUR PROFILE" : "DEMO"} · V1
          </span>
        </footer>
      </main>
    </div>
  );
}
