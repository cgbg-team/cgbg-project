# 구직자 온보딩 앱

`apps/onboarding`의 독립된 Next.js App Router 앱이다. workspace 이름은 `@cgbg/onboarding`, 개발·프로덕션 기본 포트는 3000이다.

루트에서 `npm run dev:onboarding`으로 실행한다. 현재는 앱을 구분하는 기본 화면과 유닛 테스트만 있다. 자료 수집, 구직자 인터뷰와 프로필 확정은 이후 구현한다.

`@/*`는 이 앱의 `src/*`를 가리킨다. Supabase는 `@cgbg/shared/supabase/client` 또는 `@cgbg/shared/supabase/server`를 사용한다. 필요할 때 앱 내부 `.env.example`을 `.env.local`로 복사한다.

전체 실행·검증·배포는 [README](../../README.md), 기능 방향은 [제품 아이디어](../01_product_idea.md)를 따른다.

앱 간 구직자 프로필 형식은 [프로필 데이터 계약](../shared/00_profile_contract.md)을 따른다.
