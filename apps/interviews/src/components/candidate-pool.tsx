import type { CandidateMatch } from "@/lib/types";

export function CandidatePool({ candidates }: { candidates: CandidateMatch[] }) {
  if (!candidates.length) return null;
  const exploration = candidates.filter(item => item.track === "exploration").length;
  return (
    <details className="candidate-pool">
      <summary>검색 후보 {candidates.length}개 기업 · 전환·탐색 후보 {exploration}개</summary>
      <p>선정된 후보 모두와 동시에 면접합니다. 각 대화는 발화 한도 안에서 자유롭게 진행하고, 완료되면 먼저 종료합니다.</p>
      <ul>
        {candidates.map(({job,track,basis,hypothesis}) => (
          <li key={job.id}>
            <div><strong>{job.company}</strong> · {job.title}</div>
            {track === "exploration" && <span className="exploration-label">{basis === "interest" ? "관심사 기반·적합성 확인 필요" : "활동 근거 기반·전환 가능성 확인 필요"}</span>}
            {hypothesis && <p>{hypothesis}</p>}
            {job.url && <a href={job.url} target="_blank" rel="noopener noreferrer">{job.source} · 공고 원문 ↗</a>}
          </li>
        ))}
      </ul>
    </details>
  );
}
