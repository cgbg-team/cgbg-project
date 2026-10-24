# Repository Guidelines

## Project Structure & Module Organization

- npm workspaces 모노레포다. 두 Next.js App Router 앱과 공유 패키지를 TypeScript, Tailwind CSS, ESLint로 관리한다.
- `apps/onboarding/src/app/`: 구직자 온보딩 앱의 페이지, 레이아웃, 전역 스타일과 화면 유닛 테스트.
- `apps/interviews/src/app/`: 에이전트 면접 앱의 페이지, 레이아웃, 전역 스타일과 화면 유닛 테스트.
- 면접 앱의 `src/workflows/`, `src/lib/steps.ts`: Workflow 실행과 Claude 호출. 샘플 구직자는 루트 `data/demo/candidates/onboarding-example/`을 공통으로 읽는다. 새 개인정보는 요청 없이 커밋하지 않는다.
- 면접 공고 풀은 `apps/interviews/src/data/jobs/`에 있다. 전체 풀은 검색 step에서만 읽고 선택된 최대 2개 공고와 검색 통계만 Workflow에 반환한다.
- `packages/shared/src/onboarding/`: 두 앱이 함께 사용하는 온보딩 화면, 프로필 생성과 파싱 API. 면접 앱은 생성된 프로필을 재업로드 없이 면접 입력으로 연결한다.
- `packages/shared/src/profile.ts`: 프로필 계약 v1 타입. 필드 변경 시 계약 문서도 갱신한다.
- `packages/shared/src/supabase/`: 브라우저·서버 클라이언트, 환경변수 검증과 테스트.
- `tests/e2e/`: Playwright 시나리오. 현재 검증 브라우저는 Chromium이다.
- `docs/`: 프로젝트·제품 개요, 계획, 행사 참고 자료. 앱별 문서는 `docs/onboarding/`, `docs/interviews/`에 둔다.
- 정확한 버전과 명령은 `package.json`, 재현 가능한 의존성은 `package-lock.json`을 기준으로 한다.
- 구조가 바뀌면 이 문서와 README의 구조 설명을 함께 갱신한다.

## Documentation

- 프로젝트 목적, 범위, 파일·테스트 제한, 언어 정책의 기준은 [docs/00_overview.md](docs/00_overview.md)다.
- 실행, 환경변수, 테스트, 배포 절차의 기준은 [README.md](README.md)다.
- 해커톤 안내는 [docs/etc/hackathon.md](docs/etc/hackathon.md)에 영어 원문으로 보존한다. 예시 주제를 확정 요구사항으로 취급하지 않는다.
- 동작·설정·명령을 바꾸면 해당 문서도 갱신한다. 확인하지 못한 상태는 명시하며 구현 완료로 기록하지 않는다.
- Next.js API·설정은 설치된 버전의 `node_modules/next/dist/docs/`에서 확인한다. 앱별 자동 AGENTS 생성은 끄고 이 문서를 공통 작업 규칙으로 유지한다.
- 별도 계획이나 ADR 문서는 사용자가 요청하거나 실제 의사결정을 보존해야 할 때만 추가한다.

## Coding Style & Naming Conventions

- 기존 코드처럼 2칸 들여쓰기, 큰따옴표, 세미콜론을 사용한다.
- TypeScript strict 모드를 유지하고 불필요한 `any`, 타입 단언, 추상화를 추가하지 않는다.
- 컴포넌트 이름은 PascalCase, 함수·변수는 camelCase를 사용한다. Next.js 예약 파일명은 프레임워크 규칙을 따른다.
- 기본은 Server Component다. 상태, 이벤트, 브라우저 API가 필요한 경계에만 `"use client"`를 추가한다.
- Supabase는 `@cgbg/shared/supabase/client`와 `@cgbg/shared/supabase/server`를 재사용한다. 서버 클라이언트는 요청마다 생성하며 Client Component에서 import하지 않는다.
- 앱끼리 소스를 직접 import하지 않는다. 실제 공통 코드만 `@cgbg/shared`의 명시적 export로 공유한다. `@/*`는 각 앱의 `src/*`를 가리킨다.
- 주석은 코드만으로 드러나지 않는 이유에만 쓴다. 접근 가능한 HTML과 키보드 동작을 유지한다.
- 파일 길이와 테스트 수 제한은 [개요의 기준](docs/00_overview.md#코드-및-테스트-제한)을 따른다.

## Validation

- 변경에 맞는 검증을 실행한다. 앱·설정 초기화처럼 범위가 넓으면 `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`를 모두 확인한다.
- E2E는 두 앱의 프로덕션 빌드와 전용 서버를 실행한다. 같은 앱의 빌드·개발 서버·E2E를 동시에 실행하지 않는다. 서로 다른 두 앱의 개발 서버는 함께 실행할 수 있다.
- 새 기능이나 오류 수정에는 핵심 동작을 검증하는 최소 테스트를 추가한다. 단순 문서·스타일 변경에는 불필요한 테스트를 만들지 않는다.
- 통과하지 않은 검사와 실행하지 못한 검사는 최종 보고에서 구분한다.
- 면접 E2E는 테스트용 Claude 서버를 사용한다. Workflow 생성 소스와 실행 데이터는 Git·ESLint 검사 대상에서 제외한다.

## Commit Message & PR Guidelines

### Commit Message Format

- 커밋 제목은 `{Add | Fix | Refactor | Docs | Style | Test | Chore}: {imperative description}` 형식의 영어로 작성한다.
- 본문이 필요하면 변경 이유와 핵심 내용을 영어로 설명한다.
- PR 설명은 문제, 결과 동작, 검증 결과를 한국어로 작성한다.

### Atomic Commits

- 하나의 커밋은 하나의 목적을 담는다. 관련 없는 변경이나 사용자가 만든 변경을 임의로 묶지 않는다.
- Git 조회와 로컬 커밋은 허용된다. push와 이력 재작성은 사용자가 명시적으로 요청할 때만 수행한다.

## Agent Operation & Safety Rules

- 요청 범위의 로컬 파일 수정, 의존성 설치, 검사와 테스트는 진행할 수 있다.
- 기존 구현과 호출부를 먼저 읽고 재사용한다. 요청하지 않은 기능, 범용 계층, 임시 샘플 도메인을 만들지 않는다.
- 파일·데이터의 파괴적 변경, 비밀정보 노출, 실제 클라우드 리소스 변경은 사용자 요청 범위를 확인한다.
- `.env.local`, 비밀 키, 토큰을 커밋하거나 출력하지 않는다. 예시 환경변수는 `.env.example`로 관리한다.
- 브라우저에 공개되는 `NEXT_PUBLIC_`에는 Supabase secret 또는 `service_role` 키를 넣지 않는다.
- DB 테이블을 추가할 때 RLS와 권한을 함께 설계한다. 현재 저장소에는 DB 스키마와 로그인·세션 갱신 기능이 없다.
- Supabase 인증을 도입할 때 세션 갱신 Proxy와 서버의 사용자 검증까지 구현한다. 현재 클라이언트만으로 인증 흐름이 완성되었다고 간주하지 않는다.

## Language Policy

- 문서, 주석, 사용자와의 대화는 한국어를 사용한다. 커밋 메시지는 영어로 작성한다.
- 외부 참고 자료는 원문 언어를 유지한다. 코드 식별자와 도구 출력은 원래 형태를 유지한다.

## User Interaction

- 기능 범위나 완료 기준이 모호하면 개발자에게 질문해 확정한 뒤 구현한다.
- 확정 범위 안의 구현 선택은 에이전트가 결정할 수 있다. 대안 간 개발 시간이나 복잡도가 상당히 다르면 선택 전에 확인한다.
- 진행 상황과 검증 결과를 간결하게 알리고, 미완료 항목이나 알려진 제약을 숨기지 않는다.
