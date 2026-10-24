# cgbg-project

구직자 온보딩과 에이전트 면접을 독립된 Next.js 앱으로 개발하는 npm workspaces 모노레포다. 면접 앱은 가상 프로필과 공고로 Claude 검색·1:N 면접을 서버에서 실행한다. 실제 온보딩 데이터 연결과 DB 스키마는 아직 없다.

[프로젝트 개요](docs/00_overview.md) · [제품 아이디어](docs/01_product_idea.md) · [개발 계획](docs/plan/20261024_1119_monorepo_plan.md) · [에이전트 규칙](AGENTS.md)

## 빠른 시작

Node.js 24.x와 npm을 권장한다. 저장소 루트에서 설치한다. 지원 Node.js 범위와 의존성은 [package.json](package.json), 재현 가능한 설치는 `package-lock.json`으로 관리한다.

```bash
npm ci
```

온보딩 앱을 실행한다.

```bash
npm run dev:onboarding
```

[http://localhost:3000](http://localhost:3000)에서 확인한다. 면접 앱은 별도 터미널에서 실행한다.

```bash
npm run dev:interviews
```

[http://localhost:3001](http://localhost:3001)에서 확인한다. 두 앱은 동시에 실행할 수 있다. `npm run dev`는 온보딩 앱의 단축 명령이다. 기본 화면과 테스트는 환경변수 없이 실행된다.

## 구조

```text
apps/
  onboarding/             # @cgbg/onboarding: 독립된 Next.js 앱
  interviews/             # @cgbg/interviews: 독립된 Next.js 앱
packages/
  shared/src/supabase/    # @cgbg/shared: 클라이언트·설정 검증·테스트
tests/e2e/               # 두 앱의 프로덕션 화면 검사
docs/
  onboarding/            # 온보딩 앱 문서
  interviews/            # 면접 앱 문서
  00_overview.md          # 공통 규칙과 현재 상태
  01_product_idea.md      # 제품 구상
  plan/                  # 개발 계획
  etc/hackathon.md        # 영어 행사 안내 원문
```

앱마다 `package.json`, Next.js·TypeScript·Vitest 설정과 `.env.example`이 있다. `@/*` 경로 별칭은 각 앱의 `src/*`를 가리킨다. TypeScript strict 모드와 Server Component 기본 원칙을 유지한다. 앱끼리 소스를 직접 가져오지 않으며, 실제 공통 코드는 shared의 명시적인 export를 사용한다.

프로필 v1 타입은 `@cgbg/shared/profile`에서 제공한다. 필드의 기준은 [프로필 계약](docs/shared/00_profile_contract.md)이다. 공용 UI 패키지는 없다.

## 면접 앱 실행

`apps/interviews/.env.example`을 같은 폴더의 `.env.local`로 복사하고 서버 전용 `ANTHROPIC_API_KEY`, `INTERVIEW_SESSION_SECRET`을 설정한다. 세션 비밀 키는 다음 명령으로 생성한다.

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
npm run dev:interviews
```

`index.json`과 등록된 Markdown이 있는 구직자 폴더를 선택하고 프로필·희망 조건을 확인한 뒤 **면접 시작**을 누른다. 파일은 20개·합계 1MB 이하로 준비한다. 자료가 없으면 **샘플로 체험하기**를 선택한다. 최대 2개 기업과 각각 3왕복 대화를 진행하며, 창을 닫아도 서버 작업은 계속되고 같은 브라우저에서 다시 열면 업로드한 프로필과 진행 기록을 복원한다. 기본 모델은 `claude-sonnet-4-6`이며 `ANTHROPIC_MODEL`로 변경한다. 키가 없으면 설정 안내를 표시한다. 입력 형식·API·저장 방식·제약은 [면접 앱 문서](docs/interviews/00_overview.md)를 따른다.

## Supabase 설정

Supabase를 사용하는 앱 안에서 `.env.example`을 `.env.local`로 복사하고 공개 URL과 publishable key를 설정한다. 두 앱에서 사용하면 두 앱 모두 설정한다. 루트 `.env.local`에 의존하지 않는다.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

- 브라우저: `@cgbg/shared/supabase/client`에서 `createClient`를 import한다.
- 서버: `@cgbg/shared/supabase/server`에서 `createClient`를 import하고 요청마다 `await createClient()`로 생성한다.
- 환경변수 누락은 클라이언트를 생성할 때 알린다. URL 형식 등의 검증은 SDK가 수행한다.
- `NEXT_PUBLIC_`는 [브라우저에 공개된다](https://nextjs.org/docs/app/guides/environment-variables#bundling-environment-variables-for-the-browser). secret 또는 `service_role` 키를 넣지 않는다. 테이블 추가 시 [RLS와 권한](https://supabase.com/docs/guides/database/postgres/row-level-security)을 함께 설정한다.
- 로그인·세션 갱신·실제 DB 연결은 없다. 인증 도입 시 [공식 SSR 안내](https://supabase.com/docs/guides/auth/server-side/creating-a-client)에 따라 세션 갱신 Proxy와 서버 사용자 검증도 구현한다.

## 명령어 및 검증

아래 명령은 저장소 루트에서 실행한다.

| 명령어 | 용도 |
| --- | --- |
| `npm run dev:onboarding` | 온보딩 개발 서버, 포트 3000 |
| `npm run dev:interviews` | 면접 개발 서버, 포트 3001 |
| `npm run build` | 두 앱의 프로덕션 빌드 |
| `npm run lint` | 전체 소스 ESLint 검사 |
| `npm run typecheck` | 두 앱의 Next.js 타입 생성 및 앱·shared·루트 설정 타입 검사 |
| `npm test` | 앱별 alias·환경을 적용해 모든 유닛 테스트 실행 |
| `npm run test:watch` | 유닛 테스트 감시 모드 |
| `npm run test:e2e` | 두 앱 빌드 후 Chromium으로 기본 화면·서버 면접·재접속 검사 |

특정 앱만 빌드하거나 실행할 수도 있다.

```bash
npm run build --workspace=@cgbg/onboarding
npm run start --workspace=@cgbg/onboarding
```

면접 앱은 workspace를 `@cgbg/interviews`로 바꾼다. `start`는 해당 앱을 먼저 빌드해야 한다. 개발 포트와 동일하게 온보딩은 3000, 면접은 3001을 사용한다.

최초 E2E 실행 전 `npx playwright install chromium`으로 브라우저를 설치한다. E2E는 전용 프로덕션 서버를 `127.0.0.1:3100`, `127.0.0.1:3101`과 테스트용 Claude HTTP 서버를 `4312`에 실행하고 종료 시 정리한다. 해당 포트는 비워둔다. 자동 검사는 테스트용 키를 사용하여 Claude 비용을 발생시키지 않는다.

각 앱은 자기 `.next`를 사용한다. 같은 앱의 dev·build·E2E를 동시에 실행하지 않는다. E2E는 두 앱 모두 빌드하므로 개발 서버를 모두 종료한 뒤 실행한다. 실패한 테스트의 추적 파일은 `test-results/`에 남긴다.

유닛 테스트는 각 workspace의 `src/**/*.test.ts(x)`에, E2E는 `tests/e2e/*.spec.ts`에 둔다. [비동기 Server Component는 E2E로 검증한다](https://nextjs.org/docs/app/guides/testing/vitest). 테스트 제한은 앱별이 아니라 [저장소 전체 기준](docs/00_overview.md#코드-및-테스트-제한)이다.

## Vercel 배포

같은 Git 저장소에서 Vercel 프로젝트를 두 개 만들고 Root Directory를 각각 `apps/onboarding`, `apps/interviews`로 지정한다. 각 프로젝트에서 루트 workspaces와 lockfile, shared 패키지를 포함해 설치·빌드되는지 확인한다. 설정 절차는 [Vercel 모노레포 안내](https://vercel.com/docs/monorepos)를 따른다.

면접 앱은 Kitsch Labs 팀의 별도 프로젝트 `cgbg-interviews`에 배포했다: [프로덕션 페이지](https://cgbg-interviews.vercel.app). Root Directory는 `apps/interviews`, Node.js는 24.x다. 모노레포 루트의 개발 의존성도 설치하도록 Install Command는 `cd ../.. && npm ci --include=dev`, Build Command는 `npm run build`로 설정한다. 루트 외부 파일 접근, 시스템 환경변수 노출과 Workflow OIDC를 활성화한다.

프로덕션 환경에 `ANTHROPIC_API_KEY`와 32자 이상의 `INTERVIEW_SESSION_SECRET`을 등록한 뒤 재배포해야 면접을 시작할 수 있다. 키가 없으면 설정 안내가 표시된다. Supabase를 사용할 때 필요한 환경변수도 앱별 Vercel 프로젝트에 설정한다. 비밀값은 Git에 저장하지 않는다.

GitHub의 `cgbg-team` 조직에 Vercel App을 설치했고 `main` 소스로 API 배포했다. 현재 프로젝트의 Git 연결과 push 자동 배포는 미설정이며, [Git 설정](https://vercel.com/kitsch-labs/cgbg-interviews/settings/git)에서 저장소를 연결할 수 있다. 온보딩의 Vercel 프로젝트는 이번 배포 작업에서 변경하지 않았다.

## 알려진 도구 제약

Next.js ESLint 프리셋의 일부 플러그인이 ESLint 10을 지원하지 않아 ESLint 9를 사용한다. 지원 종료 경고가 있으므로 프리셋의 호환성이 갱신되면 함께 업그레이드한다.
