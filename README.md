# Anthropic 해커톤 보일러플레이트

주제 공개 후 빠르게 개발을 시작하기 위한 Next.js + Vercel + Supabase 보일러플레이트다. 프로젝트 목적과 개발 범위는 [개요](docs/00_overview.md), 에이전트 작업 규칙은 [AGENTS.md](AGENTS.md), 행사 안내는 [영어 원문](docs/etc/hackathon.md)을 참고한다.

## 빠른 시작

Node.js 24.x와 npm을 권장한다. 지원 Node.js 범위와 정확한 의존성 버전은 [package.json](package.json), 재현 가능한 설치는 `package-lock.json`으로 관리한다.

```bash
npm ci
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 기본 화면을 확인한다. Supabase 환경변수 없이도 기본 화면과 테스트를 실행할 수 있다.

## Supabase 설정

Supabase 기능을 사용할 때 `.env.example`을 `.env.local`로 복사하고 두 값을 설정한다. `.env.local`은 Git에 포함되지 않는다.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

- 브라우저: `@/lib/supabase/client`의 `createClient()`를 호출한다.
- 서버: `@/lib/supabase/server`의 `createClient()`를 `await`해서 사용한다. 요청별로 생성하며 클라이언트 간 사용자 세션을 공유하지 않는다.
- 환경변수 누락은 클라이언트를 생성할 때 오류로 알린다. URL 형식 등 클라이언트 생성 검증은 Supabase SDK에 맡긴다.
- `NEXT_PUBLIC_` 값은 [브라우저에 공개된다](https://nextjs.org/docs/app/guides/environment-variables#bundling-environment-variables-for-the-browser). publishable key만 사용하고 secret 또는 `service_role` 키를 넣지 않는다. 테이블을 추가할 때 [RLS와 권한](https://supabase.com/docs/guides/database/postgres/row-level-security)을 함께 설정한다.
- 현재는 클라이언트 생성 코드만 제공한다. 로그인, 세션 갱신 Proxy, 테이블, 마이그레이션, 실제 프로젝트 연결은 포함하지 않는다. 인증 기능을 도입할 때는 [공식 SSR 안내](https://supabase.com/docs/guides/auth/server-side/creating-a-client)에 따라 세션 갱신과 서버의 사용자 검증을 함께 구현한다.

## 구조

```text
src/
  app/                   # App Router, 기본 화면, 전역 스타일, 화면 유닛 테스트
  lib/supabase/          # 서버·브라우저 클라이언트, 환경변수 검증과 테스트
tests/e2e/              # Playwright 시나리오
docs/
  00_overview.md         # 목적, 확정 스택, 개발 범위, 코드·테스트 제한, 언어 정책
  etc/hackathon.md        # 제공된 영어 행사 안내 원문
```

TypeScript strict 모드, `@/* → src/*` 경로 별칭, Tailwind CSS, ESLint를 사용한다. 화면은 기본적으로 Server Component로 작성하며 브라우저 기능이 필요한 부분에만 Client Component를 사용한다. 컴포넌트나 도메인 폴더는 실제 기능을 추가할 때 만든다.

## 명령어 및 검증

| 명령어 | 용도 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드 결과 제공; 먼저 build 실행 |
| `npm run lint` | ESLint 검사 |
| `npm run typecheck` | Next.js 타입 생성 후 TypeScript 검사 |
| `npm test` | Vitest 유닛 테스트를 한 번 실행 |
| `npm run test:watch` | 유닛 테스트 감시 모드 |
| `npm run test:e2e` | 빌드 후 프로덕션 서버에서 Chromium E2E 테스트 실행 |

최초 E2E 실행 전 브라우저를 설치한다.

```bash
npx playwright install chromium
```

유닛 테스트는 `src/**/*.test.ts` 또는 `src/**/*.test.tsx`, E2E 테스트는 `tests/e2e/*.spec.ts`에 추가한다. Vitest는 E2E 파일을 수집하지 않는다. [비동기 Server Component는 E2E로 검증한다](https://nextjs.org/docs/app/guides/testing/vitest). 테스트 제한과 범위 조정 원칙은 [개요](docs/00_overview.md#코드-및-테스트-제한)를 따른다.

E2E는 `127.0.0.1:3100`에 전용 서버를 띄우고 종료 시 정리한다. 해당 포트를 비워두고, 같은 작업 디렉터리에서 빌드·개발 서버·E2E를 동시에 실행하지 않는다. 모두 `.next`를 사용하므로 충돌할 수 있다. 실패 시 `test-results/`에 추적 파일을 남긴다.

## Vercel 배포

원격 저장소에 코드를 올린 후 Vercel에서 해당 저장소를 가져와 Next.js 프로젝트로 연결한다. 설치·빌드 명령은 기본 설정을 사용하고, Supabase를 쓰기 시작할 때 두 공개 환경변수를 필요한 환경에 등록한 뒤 다시 배포한다. 공개 환경변수는 빌드에 반영되므로 값 변경 후 재배포가 필요하다.

현재 Vercel 프로젝트 생성·연결이나 배포는 수행하지 않았다. 별도 `vercel.json` 없이 기본 Next.js 배포 설정을 사용한다. 자세한 절차는 [Next.js 배포 안내](https://nextjs.org/docs/app/getting-started/deploying)를 참고한다.

## 알려진 도구 제약

Next.js ESLint 프리셋의 일부 플러그인이 ESLint 10을 지원하지 않아 ESLint 9를 사용한다. ESLint 9의 지원 종료 경고가 있으므로 프리셋의 호환성이 갱신되면 함께 업그레이드한다.
