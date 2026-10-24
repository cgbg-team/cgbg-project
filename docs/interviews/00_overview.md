# 에이전트 면접 앱

`apps/interviews`의 독립된 Next.js App Router 앱이다. workspace 이름은 `@cgbg/interviews`, 개발·프로덕션 기본 포트는 3001이다.

루트에서 `npm run dev:interviews`로 실행한다. 현재는 앱을 구분하는 기본 화면과 유닛 테스트만 있다. 에이전트 면접, 진행 상태와 결과 조회는 이후 구현한다.

`@/*`는 이 앱의 `src/*`를 가리킨다. Supabase는 `@cgbg/shared/supabase/client` 또는 `@cgbg/shared/supabase/server`를 사용한다. 필요할 때 앱 내부 `.env.example`을 `.env.local`로 복사한다.

전체 실행·검증·배포는 [README](../../README.md), 기능 방향은 [제품 아이디어](../01_product_idea.md)를 따른다.
