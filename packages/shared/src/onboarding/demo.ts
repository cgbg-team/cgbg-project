import type { Extraction } from "./extraction";

// 가상의 데모 인물. 실제 개인 자료가 아니다.
export const demoResume = `Dr. Alex Kim — Radiologist
Seoul, Korea

EXPERIENCE
Attending Radiologist, University Hospital (2,000+ beds, Seoul) — 2014–present
- Read 40,000+ CT/MRI studies per year; subspecialty in chest imaging
- Led adoption of an AI triage tool for chest X-rays across 3 departments
- Teaches imaging interpretation to 20 residents per year

Resident, Radiology, University Hospital — 2010–2014

EDUCATION
M.D., Seoul National University, 2010

LANGUAGES
Korean (native), English (fluent)`;

export const demoExtra = `Blog: "Three Shots Before Rounds" (2019–present, 12k monthly readers)
- Reviews espresso machines and grinders; teardown posts on boiler and pump design
- Repaired and restored 15 vintage lever machines for local cafés

Talks
- Speaker at Seoul Coffee Expo 2023: "What radiologists know about seeing details in espresso extraction"
- Monthly hospital "AI & Medicine" lunch talk host since 2021

Community
- Founded a neighborhood café owners' group (60 members) that shares equipment and repair know-how
- Organized a charity latte-art event that raised $8,000 for a children's ward`;

export const demoExtraction: Extraction = {
  headline: "Radiologist turned detail-obsessed coffee equipment expert and educator",
  summary:
    "Attending radiologist with 10+ years of chest imaging and AI tool adoption experience. Outside medicine, runs a 12k-reader espresso equipment blog, restores machines, speaks publicly and built a 60-member café community. Open to roles that combine technical depth, teaching and community.",
  languages: [
    { name: "Korean", level: "native" },
    { name: "English", level: "fluent" },
  ],
  skills: [
    {
      name: "Medical image analysis",
      level: "expert",
      years: 12,
      evidence: [{ source: "resume", quote: "Read 40,000+ CT/MRI studies per year; subspecialty in chest imaging" }],
    },
    {
      name: "Clinical AI tool adoption",
      level: "working",
      years: null,
      evidence: [{ source: "resume", quote: "Led adoption of an AI triage tool for chest X-rays across 3 departments" }],
    },
    {
      name: "Medical education",
      level: "expert",
      years: null,
      evidence: [{ source: "resume", quote: "Teaches imaging interpretation to 20 residents per year" }],
    },
  ],
  experience: [
    {
      title: "Attending Radiologist",
      orgDescription: "University hospital · 2,000+ beds · Seoul",
      startYear: 2014,
      endYear: null,
      highlights: [
        "40,000+ CT/MRI reads per year",
        "Led AI triage tool adoption across 3 departments",
      ],
      evidence: [{ source: "resume", quote: "Attending Radiologist, University Hospital (2,000+ beds, Seoul) — 2014–present" }],
    },
  ],
  hiddenStrengths: [
    {
      strength: "Coffee equipment knowledge",
      why: "Teardown-level understanding of espresso machines fits product, QA and technical sales roles at coffee equipment companies.",
      evidence: [{ source: "portfolio", quote: "Repaired and restored 15 vintage lever machines for local cafés" }],
    },
    {
      strength: "Public speaking",
      why: "Regular talks to both medical and consumer audiences translate to developer relations, education and evangelist roles.",
      evidence: [{ source: "portfolio", quote: "Monthly hospital \"AI & Medicine\" lunch talk host since 2021" }],
    },
    {
      strength: "Community building",
      why: "Founding and running a 60-member owners' group shows community management and partnership skills.",
      evidence: [{ source: "portfolio", quote: "Founded a neighborhood café owners' group (60 members)" }],
    },
  ],
  roleTypes: [
    "Clinical AI product specialist",
    "Coffee equipment product manager",
    "Medical education content lead",
  ],
  interests: ["specialty coffee", "medical AI", "public speaking", "community"],
  mustEmphasize: ["Explains complex technical detail to non-experts"],
  openQuestions: ["Would you accept a role outside healthcare with a lower starting salary?"],
  experienceMd: `# Experience

## Attending Radiologist
University hospital · 2,000+ beds · Seoul · 2014–present

- 40,000+ CT/MRI reads per year, chest imaging subspecialty
- Led AI triage tool adoption for chest X-rays across 3 departments
- Teaches imaging interpretation to 20 residents per year
`,
  strengthsMd: `# Strengths beyond the résumé

## Coffee equipment knowledge
Runs a 12k-reader espresso equipment blog and restored 15 vintage lever machines.

## Public speaking
Seoul Coffee Expo 2023 speaker; hosts a monthly "AI & Medicine" talk.

## Community building
Founded a 60-member café owners' group; organized a charity event raising $8,000.
`,
};

// 체험하기의 백지오 페르소나(data/demo/candidates/onboarding-example)를 개인 에이전트가 정리했다고 가정한 JSON.
// 본인 동의를 받은 공개 이력서·웹사이트·블로그·GitHub 내용만 담고 연락처는 뺐다.
export const demoAgentExport = JSON.stringify(
  {
    format: "beyond-cv/agent-export/v1",
    items: [
      { category: "work", title: "머신러닝 엔지니어, 음성 AI 스타트업 (2025–현재)", detail: "한·영 코드 스위칭 음성인식 모델 개발과 서비스화, 월 20만 건 이상 호출되는 STT API 운영, 팀 AI 전환 주도", quote: "월 20만건 이상 호출되는 고성능 STT API 개발, 운영 (Faster-Whisper, K8S)", source: "이력서", confidence: "high" },
      { category: "work", title: "팀 AI 전환 리드", detail: "비개발자의 주 15회 이상 PR 작성, 전체 PR 리뷰 수요 30% 감소", source: "이력서", confidence: "high" },
      { category: "work", title: "연구 인턴, 대형 클라우드·AI 플랫폼 (2024–2025)", detail: "시각-언어 모델 SFT 데이터 합성, 멀티 노드 미세조정, LLM-as-a-judge 벤치마크(MMRefine, ACL Findings 2025)", quote: "비전-언어 모델 SFT용 데이터셋 합성 & 멀티 노드 환경에서의 파인튜닝을 통한 성능 개선 연구 (HCX)", source: "이력서", confidence: "high" },
      { category: "work", title: "학부 연구생, 대학 컴퓨터 비전 연구실 (2023–2024)", detail: "영상 검색, 확률적 임베딩 기반 영상-언어 정렬 연구", quote: "확률적 임베딩을 활용하는 Video-Language Alignment 기술 연구", source: "이력서", confidence: "high" },
      { category: "work", title: "소프트웨어 개발병, 공군 정보체계 부대 (2021–2022)", detail: "AI 연구용 GPU 클라우드 운영, IT 뉴스레터 편집, IT 컨퍼런스 기획", source: "개인 웹사이트", confidence: "high" },
      { category: "education", title: "세종대학교 컴퓨터공학 학사 (2019–2025)", detail: "최우등 졸업, 문제 해결 동아리 code_high 창립", source: "개인 웹사이트", confidence: "high" },
      { category: "project", title: "Kitsch Labs 창업 (2026.07–현재)", detail: "사랑받는 AI 음성을 만드는 음성 AI 스타트업", quote: "CEO of Kitsch Labs (\"WE MAKE AI LOVABLE\" — AI Voice You Can Fall For), Jul. 2026 – Present.", source: "https://sites.google.com/view/giopaik", confidence: "high" },
      { category: "writing", title: "기술 블로그 (skyil.tistory.com)", detail: "딥러닝 공부 노트, 논문 리뷰, 회고. 'AI 학사 취업, 왜 어려울까?' 등 인기 글", quote: "컴퓨터공학, 딥러닝, 수학 등을 다룹니다.", source: "https://skyil.tistory.com", confidence: "high" },
      { category: "activity", title: "무료 딥러닝 강의와 YouTube 논문 리뷰", detail: "'나만 알기 아까운 딥러닝' 강의 저장소, 논문 리뷰 영상", quote: "\"나만 알기 아까운 딥러닝\" 무료 강의 공식 Repository", source: "https://github.com/skyil7", confidence: "high" },
      { category: "project", title: "Piano2Midi", detail: "피아노 연주 음원을 MIDI로 변환하는 딥러닝 프로젝트 (GitHub ★32)", quote: "Convert your .wav Piano Music to .mid File! Using Deep Learning.", source: "https://github.com/skyil7", confidence: "high" },
      { category: "project", title: "agent-onboarding", detail: "저장소를 AI 에이전트가 바로 쓸 수 있게 만드는 스킬", quote: "Make your repository AI-ready with single skill run", source: "https://github.com/skyil7", confidence: "high" },
      { category: "activity", title: "공군 정보체계관리단 동문 커뮤니티 리드", detail: "동문 커뮤니티와 기술 컨퍼런스 운영", source: "개인 웹사이트", confidence: "high" },
      { category: "interest", title: "음악, 여행과 스페셜티 커피", detail: "블로그에 '도쿄 스페셜티 커피 기행' 같은 여행 글", source: "https://skyil.tistory.com", confidence: "medium" },
    ],
    insights: {
      interests: [
        { text: "엔터테인먼트로서의 AI", why: "창업한 회사와 개인 사이트 소개 모두 '사랑받는 AI'를 말한다.", basedOn: ["Kitsch Labs 창업 (2026.07–현재)"], confidence: "high" },
        { text: "음악·오디오 AI", basedOn: ["Piano2Midi"], confidence: "medium" },
      ],
      talents: [
        { text: "어려운 기술을 쉽게 풀어 설명한다", why: "오래 운영한 블로그, 무료 강의, 논문 리뷰 영상", basedOn: ["기술 블로그 (skyil.tistory.com)", "무료 딥러닝 강의와 YouTube 논문 리뷰"], confidence: "high" },
      ],
      strengths: [
        { text: "연구부터 서비스 운영까지 끝까지 맡는다", basedOn: ["머신러닝 엔지니어, 음성 AI 스타트업 (2025–현재)"], confidence: "high" },
        { text: "사람들을 모으고 커뮤니티를 만든다", basedOn: ["세종대학교 컴퓨터공학 학사 (2019–2025)", "공군 정보체계관리단 동문 커뮤니티 리드"], confidence: "high" },
      ],
      workStyle: [
        { text: "작은 팀에서 연구와 제품을 함께 맡는 환경을 선호하는 것으로 보인다", basedOn: ["머신러닝 엔지니어, 음성 AI 스타트업 (2025–현재)", "Kitsch Labs 창업 (2026.07–현재)"], confidence: "low" },
      ],
      aiExposure: {
        automatable: ["반복적인 데이터 정제와 라벨링", "표준적인 모델 학습 스크립트 작성"],
        durable: ["데이터 레시피 설계와 평가 기준 정의", "제품 방향 결정과 팀의 AI 도입 설계"],
      },
      global: { languages: [{ name: "한국어", level: "native" }, { name: "영어", level: "business" }], openTo: "unsure" },
    },
    proposals: [
      { type: "transferable", text: "기술 교육·콘텐츠 역량을 살린 DevRel(개발자 관계) 엔지니어", industry: "AI 개발자 도구, 에듀테크", basedOn: ["기술 블로그 (skyil.tistory.com)", "무료 딥러닝 강의와 YouTube 논문 리뷰"], ownerResponse: "unanswered" },
      { type: "role_idea", text: "소비자 음성 AI 회사의 창업 엔지니어 또는 AI 총괄", industry: "엔터테인먼트, AI 컴패니언, 게임", basedOn: ["Kitsch Labs 창업 (2026.07–현재)"], ownerResponse: "unanswered" },
      { type: "interest_as_work", text: "음악·생성형 오디오 분야의 음성합성 엔지니어", industry: "음악 기술", basedOn: ["Piano2Midi"], ownerResponse: "unanswered" },
      { type: "role_idea", text: "해외 AI 기업의 AI 도입·개발자 생산성 엔지니어", industry: "개발자 도구", basedOn: ["agent-onboarding", "팀 AI 전환 리드"], ownerResponse: "unanswered" },
    ],
    gaps: [
      { topic: "Kitsch Labs를 운영하면서 이직하거나 겸업할 수 있는지", why: "정규직 제안이 가능한지 결정한다", guess: null },
      { topic: "해외 이주 또는 해외 기업 원격 근무 의향", why: "추천할 나라와 기업 범위가 달라진다", guess: "원격 우선일 가능성" },
      { topic: "희망 연봉과 최소 연봉", why: "연봉 협의 기준이 필요하다", guess: null },
      { topic: "연구 직무와 제품·창업형 직무 중 우선순위", why: "추천 직무의 방향을 정한다", guess: null },
    ],
  },
  null,
  2,
);
