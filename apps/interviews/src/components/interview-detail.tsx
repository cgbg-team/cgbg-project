import { stageLabels, type Interview } from "@/lib/types";
import { countryLabel } from "@/lib/job-countries";

export const outcomeLabels = {
  recommended: "대면 면접 추천",
  hold: "확인 후 결정",
  mismatch: "조건 불일치",
};
export function InterviewDetail({ interview }: { interview?: Interview }) {
  if (!interview)
    return (
      <section className="detail empty-detail">
        <span className="empty-mark" aria-hidden="true">
          ↗
        </span>
        <h2>다음 기회로 가는 대화</h2>
        <p>
          면접을 시작하면 기업별 에이전트의
          <br />
          실제 대화가 여기에 쌓입니다.
        </p>
        <div className="flow-preview">
          <span>경험 확인</span>
          <i>→</i>
          <span>조건 조율</span>
          <i>→</i>
          <span>면접 추천</span>
        </div>
      </section>
    );
  const { job, messages, result } = interview;
  return (
    <section className="detail" aria-label={`${job.company} 면접 상세`}>
      <header className="detail-header">
        <div>
          <p className="eyebrow">INTERVIEW ROOM</p>
          <h2>{job.company}</h2>
          <p>{job.title}</p>
        </div>
        <span className={`badge ${result?.outcome ?? interview.stage}`}>
          {result
            ? outcomeLabels[result.outcome]
            : stageLabels[interview.stage]}
        </span>
      </header>
      <div className="job-conditions">
        {job.country && <span>{countryLabel(job.country)} · {job.location || "지역 미기재"}</span>}
        <span>{job.remote == null ? "근무 방식 미확인" : job.remote ? "원격 근무 가능" : "사무실 근무"}</span>
        <span>{job.weeklyHours == null ? "근무시간 미확인" : `주 ${job.weeklyHours}시간`}</span>
        <span>
          {job.salaryText || (job.salary ? `${job.salary.currency} ${job.salary.min.toLocaleString()}–${job.salary.max.toLocaleString()} / 년` : "연봉 미기재")}
        </span>
        {job.url && <a href={job.url} target="_blank" rel="noopener noreferrer">{job.source} · 공고 원문 ↗</a>}
      </div>
      <div
        className="transcript"
        role="log"
        aria-label="에이전트 대화"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.length === 0 && (
          <p className="muted">채용 에이전트가 첫 질문을 준비하고 있습니다.</p>
        )}
        {messages.map((message, index) => (
          <article className={`message ${message.role}`} key={index}>
            <div className="message-meta">
              <strong>
                {message.role === "candidate"
                  ? "나의 에이전트"
                  : `${job.company} 채용 에이전트`}
              </strong>
              <span>{stageLabels[message.stage].replace("…", "")}</span>
            </div>
            <p>{message.text}</p>
          </article>
        ))}
      </div>
      {interview.question && (
        <aside className="notice">
          <strong>내 확인이 필요한 조건</strong>
          <p>{interview.question}</p>
          <small>
            이번 실행은 보류로 기록합니다. 답변 제출은 다음 범위에서 연결합니다.
          </small>
        </aside>
      )}
      {interview.error && (
        <p className="notice error" role="alert">
          {interview.error}
        </p>
      )}
      {result && (
        <aside className={`result ${result.outcome}`}>
          <p className="eyebrow">AGENT ASSESSMENT</p>
          <h3>{outcomeLabels[result.outcome]}</h3>
          <ul>
            {result.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <small>
            에이전트의 추천입니다. 최종 채용 결정과 일정 조율은 별도로
            진행합니다.
          </small>
        </aside>
      )}
    </section>
  );
}
