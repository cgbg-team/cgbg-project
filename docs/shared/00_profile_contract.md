# 구직자 프로필 데이터 계약 (v1)

상태: v1을 면접 샘플 구현의 기준으로 사용한다. 타입은 `packages/shared/src/profile.ts`에 구현했으며 테이블은 아직 없다. 온보딩의 저장·전달 연결은 담당자와 별도로 맞춘다. 면접 샘플 봉투 형식은 [면접 앱 문서](../interviews/00_overview.md)에 정의한다.

onboarding 앱이 확정한 구직자 프로필을 interviews 앱이 읽는 형식을 정한다. 제품 흐름은 [제품 아이디어](../01_product_idea.md), 앱 책임은 [개발 계획](../plan/20261024_1119_monorepo_plan.md#앱과-데이터의-책임)을 따른다.

## 원칙

1. 코드가 값으로 비교하는 정보는 JSON 프로필에, 에이전트가 맥락으로 읽는 긴 내용은 Markdown 문서에 둔다. 협상·필터링에 쓰는 값을 Markdown에만 두지 않는다.
2. 공개 프로필과 비공개 프로필을 별도 테이블로 분리한다. 채용 에이전트에게는 공개 프로필과 `visibility: "public"` 문서만 전달한다.
3. 자료에 없는 정보는 추측하지 않고 `openQuestions`에 남긴다.
4. 모든 역량·경력 주장에 근거를 붙인다. 제공된 자료로 확인되지 않으면 `verified: false`다.
5. 사용자가 확인하고 확정한 프로필(`confirmed_at` 존재)만 면접에 사용한다.

## interviews 단계별 사용 필드

| interviews 단계 | 사용하는 필드 |
| --- | --- |
| 후보기업 검색 | `wants`, `transferableStrengths`, `skills`, `experience` |
| 경험 조회 | `skills[].verified`, `skills[].evidence`, `experience[].evidence`, 공개 문서 |
| 연봉 협의 | `PrivateProfile.salary` (구직자 에이전트만) |
| 조건 불일치 | `PrivateProfile.dealbreakers` (구직자 에이전트만) |
| 사용자 확인 필요 | `PrivateProfile.openQuestions` |

## 타입

[개발 계획](../plan/20261024_1119_monorepo_plan.md#목표-구조)에 따라 `packages/shared`의 데이터 계약 파일에 정의하고 두 앱이 명시적 export로 import한다.

```ts
export type Evidence = {
  source: "resume" | "interview" | "github" | "portfolio";
  docPath?: string; // 예: "public/experience.md#acme"
  quote?: string; // 근거 원문 한 줄
};

export type Skill = {
  name: string;
  level?: "basic" | "working" | "expert";
  years?: number;
  verified: boolean; // 자료로 확인됨 = true, 본인 주장만 = false
  evidence: Evidence[];
};

export type Experience = {
  title: string;
  orgDescription: string; // 회사명 대신 "핀테크 · 50~200명 · 서울"
  startYear: number;
  endYear?: number; // 없으면 재직 중
  highlights: string[];
  evidence: Evidence[];
};

export type ProfileDoc = {
  path: string; // "public/experience.md"
  about: string; // 한 줄 설명
  visibility: "public" | "private";
};

export type PublicProfile = {
  schemaVersion: 1;
  candidateId: string;
  headline: string;
  summary: string; // 3~5줄, 에이전트 프롬프트에 바로 넣는 용도
  location: { country: string; remoteOk: boolean; relocateOk: boolean };
  languages: { name: string; level: "native" | "fluent" | "business" | "basic" }[];
  skills: Skill[];
  experience: Experience[];
  transferableStrengths: { strength: string; why: string; evidence: Evidence[] }[];
  wants: { roleTypes: string[]; interests: string[]; workStyle?: string[] };
  docs: ProfileDoc[]; // public 문서만
};

export type PrivateProfile = {
  schemaVersion: 1;
  candidateId: string;
  salary: {
    currency: "USD" | "KRW";
    target: number;
    floor: number; // 외부 노출 금지
    flexibleOn: string[]; // 예: "원격이면 10% 양보 가능"
  };
  dealbreakers: string[]; // 예: "주 50시간 이상 근무"
  mustEmphasize: string[]; // 면접에서 꼭 강조할 강점
  openQuestions: string[]; // 온보딩에서 확인하지 못한 것
  docs: ProfileDoc[]; // private 문서만
};
```

## Markdown 문서

| 경로 | 공개 | 내용 |
| --- | --- | --- |
| `public/experience.md` | 공개 | 경력 상세, 프로젝트와 성과 |
| `public/strengths.md` | 공개 | 전환 가능한 강점 분석과 근거 |
| `private/interview.md` | 비공개 | 온보딩 인터뷰 원문 |

`docPath`의 `#` 뒤는 문서 안의 제목 앵커다. 문서를 추가하면 해당 프로필의 `docs`에도 등록한다.

## Supabase 테이블

| 테이블 | 컬럼 | 읽는 쪽 |
| --- | --- | --- |
| `candidate_public` | `candidate_id`, `profile jsonb`, `confirmed_at` | 채용·구직자 에이전트, 화면 |
| `candidate_private` | `candidate_id`, `profile jsonb` | 구직자 에이전트만 |
| `candidate_docs` | `candidate_id`, `path`, `visibility`, `content text` | `visibility`에 따라 구분 |

`candidate_id`는 온보딩 실행마다 새로 만들어 서로 다른 시연이 결과를 덮어쓰지 않게 한다. 정확한 컬럼 타입, RLS와 접근 정책은 테이블을 만들 때 작성한다. 앱 간 이동 URL에는 `candidate_id`만 넣고 프로필 내용은 넣지 않는다.

## interviews에서 사용하는 규칙

- 채용 에이전트 프롬프트에는 `PublicProfile.summary`와 필요한 공개 문서만 넣는다.
- `PrivateProfile`은 구직자 에이전트만 읽는다. `salary.floor`는 조건 비교에만 사용하고 대화에서 밝히지 않는다.
- 근거가 없는 경험이나 수락 의사를 만들어내지 않는다. 필요하면 `openQuestions`처럼 사용자에게 질문한다.

## 변경 절차

필드를 추가·삭제하면 `schemaVersion`을 올리고 이 문서와 타입을 함께 갱신한 뒤 상대 앱 담당자에게 알린다. 합의 전까지 interviews는 샘플 프로필 1명분으로 개발할 수 있다.
