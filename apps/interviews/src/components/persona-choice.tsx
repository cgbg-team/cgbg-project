import Link from "next/link";

export type PersonaMode = "sample" | "own";

export function PersonaChoice({ onSelect }: { onSelect: (mode: PersonaMode) => void }) {
  return (
    <main className="persona-entry">
      <Link className="brand" href="/" aria-label="cgbg 홈"><span className="brand-symbol">c</span> cgbg.</Link>
      <div className="persona-intro">
        <p className="eyebrow">YOUR NEXT CHAPTER</p>
        <h1>누구의 다음 기회를 찾아볼까요?</h1>
        <p>페르소나를 선택하고, 에이전트가 나를 대신해 기회를 찾는 과정을 경험해보세요.</p>
      </div>
      <div className="persona-options">
        <button className="persona-option" onClick={() => onSelect("sample")} aria-label="백지오 페르소나로 체험하기">
          <span className="persona-option-top"><span className="persona-monogram" aria-hidden="true">G</span><span className="persona-chip">바로 체험</span></span>
          <span className="eyebrow">MEET GIO</span>
          <h2>백지오 페르소나로 체험하기</h2>
          <p>음성·멀티모달 AI 연구부터 제품 개발까지.<br />미리 준비된 백지오의 경험과 강점으로 시작하세요.</p>
          <span className="persona-tags"><span>Speech AI</span><span>Multimodal AI</span><span>Research Engineer</span></span>
          <span className="persona-option-footer">자료 준비 없이 시작<span aria-hidden="true">↗</span></span>
        </button>
        <button className="persona-option" onClick={() => onSelect("own")} aria-label="내 페르소나로 체험하기">
          <span className="persona-option-top"><span className="persona-monogram own" aria-hidden="true">✳</span><span className="persona-chip">내 자료로 시작</span></span>
          <span className="eyebrow">YOUR STORY</span>
          <h2>내 페르소나로 체험하기</h2>
          <p>나의 경력과 관심사, 희망 조건을 담아.<br />이력서와 질문 3개로 나만의 프로필을 만드세요.</p>
          <span className="persona-tags"><span>나의 경력</span><span>전환 가능한 강점</span><span>희망 조건</span></span>
          <span className="persona-option-footer">내 프로필 만들기<span aria-hidden="true">↗</span></span>
        </button>
      </div>
      <p className="persona-entry-note">선택만으로 면접이 시작되지는 않습니다. 다음 화면에서 자료와 검색 조건을 확인하세요.</p>
    </main>
  );
}
