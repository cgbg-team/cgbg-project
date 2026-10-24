# cgbg-project

구직자 온보딩과 에이전트 면접을 독립된 Next.js 앱으로 개발하는 npm workspaces 모노레포다. 현재는 두 앱의 기본 화면, 공용 Supabase 클라이언트와 테스트 설정만 제공한다. 온보딩 인터뷰, 면접 엔진, DB 스키마는 아직 구현하지 않았다.

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

공유 타입과 공용 UI는 필요해질 때 추가한다. 현재 도메인 타입이나 UI 패키지는 만들지 않았다.

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
| `npm run test:e2e` | 두 앱 빌드 후 Chromium으로 기본 화면 검사 |

특정 앱만 빌드하거나 실행할 수도 있다.

```bash
npm run build --workspace=@cgbg/onboarding
npm run start --workspace=@cgbg/onboarding
```

면접 앱은 workspace를 `@cgbg/interviews`로 바꾼다. `start`는 해당 앱을 먼저 빌드해야 한다. 개발 포트와 동일하게 온보딩은 3000, 면접은 3001을 사용한다.

최초 E2E 실행 전 `npx playwright install chromium`으로 브라우저를 설치한다. E2E는 전용 프로덕션 서버를 `127.0.0.1:3100`, `127.0.0.1:3101`에 실행하고 종료 시 정리한다. 해당 포트는 비워둔다.

각 앱은 자기 `.next`를 사용한다. 같은 앱의 dev·build·E2E를 동시에 실행하지 않는다. E2E는 두 앱 모두 빌드하므로 개발 서버를 모두 종료한 뒤 실행한다. 실패한 테스트의 추적 파일은 `test-results/`에 남긴다.

유닛 테스트는 각 workspace의 `src/**/*.test.ts(x)`에, E2E는 `tests/e2e/*.spec.ts`에 둔다. [비동기 Server Component는 E2E로 검증한다](https://nextjs.org/docs/app/guides/testing/vitest). 테스트 제한은 앱별이 아니라 [저장소 전체 기준](docs/00_overview.md#코드-및-테스트-제한)이다.

## Vercel 배포

같은 Git 저장소에서 Vercel 프로젝트를 두 개 만들고 Root Directory를 각각 `apps/onboarding`, `apps/interviews`로 지정한다. 각 프로젝트에서 루트 workspaces와 lockfile, shared 패키지를 포함해 설치·빌드되는지 확인한다. 설정 절차는 [Vercel 모노레포 안내](https://vercel.com/docs/monorepos)를 따른다.

Supabase를 사용할 때 필요한 환경변수는 각 Vercel 프로젝트에 설정한다. 공개 환경변수 변경 후에는 다시 빌드·배포한다. 현재 클라우드 프로젝트 생성·연결이나 배포는 수행하지 않았다.

## 알려진 도구 제약

Next.js ESLint 프리셋의 일부 플러그인이 ESLint 10을 지원하지 않아 ESLint 9를 사용한다. 지원 종료 경고가 있으므로 프리셋의 호환성이 갱신되면 함께 업그레이드한다.
