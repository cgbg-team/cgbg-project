# 구직자 온보딩 앱

`apps/onboarding`의 독립된 Next.js App Router 앱이다. workspace 이름은 `@cgbg/onboarding`, 개발·프로덕션 기본 포트는 3000이다.

루트에서 `npm run dev:onboarding`으로 실행한다. 이력서 PDF 또는 텍스트, 추가 자료, 질문 3개와 희망 조건을 받아 `POST /api/onboarding/parse`에서 Claude로 프로필을 추출한다. 결과는 [프로필 데이터 계약 v1](../shared/00_profile_contract.md)과 면접 앱의 구직자 폴더 형식(`index.json`, `public/*.md`, `private/interview.md`)으로 만들고 zip으로 내려받는다. 사용자는 압축을 풀어 면접 앱에서 폴더를 선택한다.

`skills`·`experience`는 이력서에서만, `transferableStrengths`는 추가 자료에서만 추출하며 근거 문장이 없는 역량은 `verified: false`다. 희망·최저 연봉과 조건은 사용자가 직접 입력한 값만 비공개 프로필에 넣는다. `ANTHROPIC_API_KEY`가 없으면 가상 데모 결과를 반환한다. 화면 문구는 `src/lib/onboarding/messages.ts`의 한국어·영어 사전을 사용한다. 링크 수집, 실제 저장소 연동과 디자인은 아직 없다.

`@/*`는 이 앱의 `src/*`를 가리킨다. Supabase는 `@cgbg/shared/supabase/client` 또는 `@cgbg/shared/supabase/server`를 사용한다. 필요할 때 앱 내부 `.env.example`을 `.env.local`로 복사한다.

전체 실행·검증·배포는 [README](../../README.md), 기능 방향은 [제품 아이디어](../01_product_idea.md)를 따른다.

앱 간 구직자 프로필 형식은 [프로필 데이터 계약](../shared/00_profile_contract.md)을 따른다.

다음 개발 범위는 [온보딩·서버 면접 개발 계획](../plan/20261024_1132_onboarding_agents_plan.md)에 정리했다. 입력 폴더와 프로필 확정 과정을 이 앱에서 구현하고, 면접 실행은 면접 앱의 서버에 위임한다.
