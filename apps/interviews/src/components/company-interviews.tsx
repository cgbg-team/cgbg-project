import { stageLabels, type CandidateMatch, type Interview } from "@/lib/types";
import { InterviewDetail, outcomeLabels } from "./interview-detail";
import { InterviewApplication } from "./interview-application";
import { CompanyLogo } from "./company-logo";

export function CompanyInterviews({ interviews, candidates, runId, done }: {
  interviews: Interview[];
  candidates: CandidateMatch[];
  runId?: string;
  done: boolean;
}) {
  const passed = interviews.filter(item => item.result?.outcome === "recommended");
  const pending = interviews.filter(item => !item.result && !item.error);
  const inactive = interviews
    .filter(item => (item.result && item.result.outcome !== "recommended") || item.error)
    .sort((a, b) => Number(b.result?.outcome === "hold" && !b.error) - Number(a.result?.outcome === "hold" && !a.error));
  function card(item: Interview, index: number, archived = false) {
    const lastMessage = item.messages.at(-1);
    const candidate = candidates.find(candidate => candidate.job.id === item.job.id);
    const stage = lastMessage?.stage ?? (item.stage === "completed" ? "summarizing" : item.stage);
    return <article key={item.job.id} className={`company-row ${archived ? "inactive" : item.result ? "passed" : "in-progress"} status-${item.error ? "error" : item.result?.outcome ?? "pending"}`} aria-label={`${item.job.company} 면접 카드`} style={{ animationDelay: archived || item.result ? "0ms" : `${Math.min(index * 65, 4500)}ms` }}>
      <div className="company-row-main">
        <div className="company-row-identity">
          <CompanyLogo company={item.job.company} />
          <div><h3>{item.job.company}</h3><p>{item.job.title}</p><small>{[item.job.location, item.job.salary].filter(Boolean).join(" · ")}</small></div>
        </div>
        <div className="company-row-progress">
          <span className={`badge ${item.error ? "error" : item.result?.outcome ?? item.stage}`}>
            {!item.result && !item.error && <span className="interview-pulse" aria-hidden="true" />}
            {item.error ? "실행 오류" : item.result ? outcomeLabels[item.result.outcome] : stageLabels[item.stage]}
          </span>
          {archived ? <p className="company-decision"><strong>{stageLabels[stage].replace("…", "")} 단계에서 {item.error ? "중단" : item.result?.outcome === "hold" ? "보류" : "제외"}</strong>{item.error ?? item.result?.reasons[0]}</p> : <p className="company-live-message">{item.result?.reasons[0] ?? lastMessage?.text ?? "채용 에이전트가 프로필을 읽고 첫 질문을 준비합니다."}</p>}
          <small>{item.messages.length}개 메시지{!item.result && !item.error ? " · 양측 에이전트 대화 중" : " · 대화 종료"}</small>
        </div>
        {runId && item.result?.outcome === "recommended" && <InterviewApplication runId={runId} jobId={item.job.id} company={item.job.company} label="면접 일정 잡기 →" />}
      </div>
      {candidate?.track === "exploration" && <p className="company-exploration">{candidate.basis === "interest" ? "관심사 기반·적합성 확인 필요" : "활동 근거 기반·전환 적합성 확인 필요"} · {candidate.hypothesis}</p>}
      <details className="company-row-detail"><summary>상세 이유와 에이전트 대화 보기</summary><InterviewDetail interview={item} /></details>
    </article>;
  }
  return <div className="company-feed">
    <section aria-label="진행 및 통과 기업">
      <div className="section-heading"><h2>{done ? "다음 면접으로 이어질 기업" : "에이전트가 기업들을 만나고 있어요"}<span className="count">{passed.length + pending.length}</span></h2><span role="status">통과 {passed.length} · 진행 중 {pending.length}</span></div>
      {passed.length + pending.length === 0 && <div className="company-feed-empty" role="status">{done ? "이번 검색에서는 사전검토를 통과한 기업이 없습니다." : "프로필에서 검색어를 추출하고 후보 기업을 찾고 있습니다…"}</div>}
      <div className="company-feed-cards">{passed.map((item, index) => card(item, index))}{pending.map((item, index) => card(item, index))}</div>
    </section>
    {inactive.length > 0 && <section className="company-archive" aria-label="제외 및 보류 기업">
      <div className="section-heading"><h2>이번에는 이어지지 않은 기업 <span className="count">{inactive.length}</span></h2><span>조건 조정·추가 확인이 필요한 기업부터 표시합니다</span></div>
      <div className="company-feed-cards">{inactive.map((item, index) => card(item, index, true))}</div>
    </section>}
  </div>;
}
