import Link from "next/link";
import Image from "next/image";

export type PersonaMode = "sample" | "own";

export function PersonaChoice({ onSelect }: { onSelect: (mode: PersonaMode) => void }) {
  return (
    <main className="persona-entry">
      <Link className="brand" href="/" aria-label="cgbg 홈"><span className="brand-symbol">c</span> cgbg.</Link>
      <div className="persona-intro">
        <p className="eyebrow">YOUR NEXT CHAPTER</p>
        <h1>누구의 다음 기회를 찾아볼까요?</h1>
        <p>미리 준비된 데모 프로필로 서비스를 체험하거나, 진짜 내 에이전트를 연결해 새로운 기회를 찾아보세요.</p>
      </div>
      <div className="persona-options">
        <button className="persona-option" onClick={() => onSelect("sample")} aria-label="백지오 페르소나로 체험하기">
          <span className="persona-option-top"><Image className="persona-monogram persona-photo" src="/images/gio-profile.jpg" alt="백지오" width={64} height={64} /><span className="persona-chip">바로 체험</span></span>
          <span className="eyebrow">MEET GIO</span>
          <h2>백지오 페르소나로 체험하기</h2>
          <p>서울에 사는 1년차 주니어 AI Engineer 백지오의 실제 프로필을 바탕으로, MORROW를 체험합니다.</p>
          <span className="persona-tags"><span>Speech AI</span><span>Multimodal AI</span><span>Research Engineer</span></span>
          <span className="persona-option-footer">자료 준비 없이 시작<span aria-hidden="true">↗</span></span>
        </button>
        <button className="persona-option" onClick={() => onSelect("own")} aria-label="내 페르소나로 체험하기">
          <span className="persona-option-top"><span className="persona-monogram own" aria-hidden="true">✳</span><span className="persona-chip">내 자료로 시작</span></span>
          <span className="eyebrow">YOUR STORY</span>
          <h2>내 페르소나로 체험하기</h2>
          <p>내 claude code, codex, hermes 등을 연동하여 내 에이전트가 대신 채용담당 에이전트와 면접을 진행합니다. 체험 시간이 다소 오래 소요될 수 있어요.</p>
          <span className="persona-tags"><span>나의 경력</span><span>전환 가능한 강점</span><span>희망 조건</span></span>
          <span className="persona-option-footer">내 프로필 만들기<span aria-hidden="true">↗</span></span>
        </button>
      </div>
      <p className="persona-entry-note">선택만으로 면접이 시작되지는 않습니다. 다음 화면에서 자료와 검색 조건을 확인하세요.</p>
    </main>
  );
}
