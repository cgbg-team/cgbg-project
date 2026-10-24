import type { Snapshot } from "@/lib/types";

export function RunProgress({
  snapshot,
  started,
}: {
  snapshot: Snapshot;
  started: boolean;
}) {
  const current = !started
    ? 0
    : snapshot.done
      ? 3
      : snapshot.interviews.length
        ? 2
        : 1;
  const failed = snapshot.interviews.filter(
    (item) => item.stage === "error",
  ).length;
  const hold = snapshot.interviews.filter(
    (item) => item.result?.outcome === "hold",
  ).length;
  return (
    <section className="run-progress" aria-label="전체 진행 단계">
      <ol>
        {["자료 확인", "공고 탐색", "에이전트 면접", "결과 확인"].map(
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
              : "서버에서 진행 중 · 화면을 떠나도 계속됩니다"}
          </span>
          {(failed > 0 || hold > 0) && (
            <span>
              확인 필요 {hold} · 오류 {failed}
            </span>
          )}
        </div>
      )}
    </section>
  );
}
