import type { Snapshot } from "@/lib/types";

export function RunProgress({
  snapshot,
  started,
  demo = false,
}: {
  snapshot: Snapshot;
  started: boolean;
  demo?: boolean;
}) {
  const current = !started
    ? 0
    : snapshot.done
      ? 4
      : snapshot.interviews.length
        ? 3
        : snapshot.keywords.length ? 2 : 1;
  const failed = snapshot.interviews.filter(
    (item) => item.stage === "error",
  ).length;
  const hold = snapshot.interviews.filter(
    (item) => item.result?.outcome === "hold",
  ).length;
  return (
    <section className="run-progress" aria-label="전체 진행 단계">
      <ol>
        {["프로필 준비", "검색어 추출", "기업 검색", "동시 면접", "후보 추림", "면접 신청"].map(
          (label, index) => (
            <li
              key={label}
              className={
                index < current ? "complete" : index === current ? "active" : ""
              }
              aria-current={index === current ? "step" : undefined}
            >
              <span>{index < current ? "✓" : `0${index + 1}`}</span>
              {label}
            </li>
          ),
        )}
      </ol>
      {started && (
        <div className="progress-caption" role="status">
          <span>
            {snapshot.done
              ? snapshot.stage === "cancelled"
                ? "실행이 중지되었습니다"
                : snapshot.stage === "error"
                  ? "실행을 완료하지 못했습니다"
                  : snapshot.interviews.length
                    ? "모든 기업의 결과를 확인해주세요"
                    : "일치하는 공고가 없어 검색을 마쳤습니다"
              : demo ? "실제 대화 기록을 재생 중입니다" : "서버에서 진행 중 · 화면을 떠나도 계속됩니다"}
          </span>
          {(failed > 0 || hold > 0) && (
            <span>
              확인 필요 {hold} · 오류 {failed}
            </span>
          )}
        </div>
      )}
      {started && !snapshot.done && snapshot.interviews.length === 0 && (
        <p className="search-log" role="status">
          {snapshot.keywords.length
            ? `${snapshot.keywords.map(keyword => keyword.term).join(", ")} 검색어로 검색합니다…`
            : "프로필에서 경험과 관심사를 읽고 검색어를 추출합니다…"}
        </p>
      )}
    </section>
  );
}
