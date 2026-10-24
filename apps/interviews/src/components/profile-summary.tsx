import Link from "next/link";
import Image from "next/image";
import type { PublicProfile } from "@cgbg/shared/profile";
import { countryLabel } from "@/lib/job-countries";

export function ProfileSummary({ profile, starting, error, onBack, onStart }: {
  profile: PublicProfile;
  starting: boolean;
  error?: string;
  onBack: () => void;
  onStart: () => void;
}) {
  return <main className="profile-overview">
    <header className="profile-overview-nav">
      <Link className="brand" href="/" aria-label="cgbg 홈"><span className="brand-symbol">c</span> cgbg.</Link>
      <button className="text-button" disabled={starting} onClick={onBack}><span aria-hidden="true">← </span>페르소나 다시 선택</button>
    </header>
    <section className="profile-start" aria-label="체험 시작">
      <div><strong>백지오 페르소나로 체험합니다.</strong><p>4배속 · 저장된 실제 대화를 재생합니다.</p></div>
      <button className="button primary" disabled={starting} onClick={onStart}>{starting ? "시작하는 중…" : "면접 시작 ↗"}</button>
    </section>
    {error && <p className="notice error" role="alert">{error}</p>}
    <section className="profile-intro" aria-label="선택한 페르소나">
      <div className="profile-monogram"><Image src="/images/gio-profile.jpg" alt="백지오 프로필 사진" width={104} height={120} priority /><span aria-hidden="true">✳</span></div>
      <div>
        <p className="eyebrow">MEET YOUR PERSONA</p>
        <h1 id="profile-name">백지오<span>의 다음 기회</span></h1>
        <p className="profile-headline">{profile.headline}</p>
        <p className="profile-meta">{countryLabel(profile.location.country)} · {profile.languages.map(language => language.name).join(" · ")}{profile.location.remoteOk && " · 원격 근무 가능"}</p>
      </div>
    </section>
    <section className="profile-story mb-6" aria-labelledby="profile-preferences-title">
      <h2 id="profile-preferences-title">백지오가 원하는 직장</h2>
      <ul className="profile-roles">
        <li>연봉 5천만원+</li>
        <li>주도적으로 업무를 수행할 수 있는 직장</li>
        <li>스톡옵션으로 연봉 조정 가능</li>
        <li>한국어, 영어, 일본어권 국가 고려</li>
        <li>커피 분야 직무 변경 가능</li>
      </ul>
    </section>
    <section className="profile-story" aria-label="사용자 프로필 요약">
      <p className="eyebrow">PROFILE AT A GLANCE</p>
      <h2>어떤 경험을 가진 사람인가요?</h2>
      <p>{profile.summary}</p>
    </section>
    <div className="profile-summary-grid">
      <section className="profile-section">
        <h2>쌓아온 경험 <span>{profile.experience.length}</span></h2>
        <ol className="profile-experience">
          {profile.experience.map((experience, index) => <li key={`${experience.title}-${index}`}>
            <span className="experience-year">{experience.startYear} — {experience.endYear ?? "현재"}</span>
            <h3>{experience.title}</h3>
            <p>{experience.orgDescription}</p>
            <p className="experience-highlight">{experience.highlights[0]}</p>
          </li>)}
        </ol>
      </section>
      <div>
        <section className="profile-section">
          <h2>주요 역량</h2>
          <div className="profile-summary-tags">{profile.skills.slice(0, 6).map(skill => <span key={skill.name}>{skill.name}</span>)}</div>
        </section>
        <section className="profile-section">
          <h2>찾고 있는 역할</h2>
          <ul className="profile-roles">{profile.wants.roleTypes.map(role => <li key={role}>{role}</li>)}</ul>
        </section>
        <section className="profile-section">
          <h2>일 밖에서 발견한 가능성</h2>
          <div className="profile-summary-tags interests">{profile.wants.interests.map(interest => <span key={interest}>{interest}</span>)}</div>
          <p className="profile-footnote">관심사를 바탕으로 새로운 직군도 함께 탐색합니다. 경력과 자격의 적합성은 별도로 확인합니다.</p>
        </section>
      </div>
    </div>
  </main>;
}
