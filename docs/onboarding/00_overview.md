# 구직자 온보딩 앱

`apps/onboarding`의 독립된 Next.js App Router 앱이다. workspace 이름은 `@cgbg/onboarding`, 개발·프로덕션 기본 포트는 3000이다.

루트에서 `npm run dev:onboarding`으로 실행한다. 이력서 PDF 또는 텍스트, 추가 자료, 질문 3개와 희망 조건을 받아 `POST /api/onboarding/parse`에서 Claude로 프로필을 추출한다. 결과는 [프로필 데이터 계약 v1](../shared/00_profile_contract.md)과 면접 앱의 구직자 폴더 형식(`index.json`, `public/*.md`, `private/interview.md`)으로 만들고 zip으로 내려받는다. 면접 앱의 **내 페르소나로 체험하기**에서도 같은 화면과 API를 사용한다. 생성 결과의 **이 프로필로 면접 준비하기**로 재업로드 없이 면접 입력을 전달한다. 독립 온보딩 앱은 기존 zip 다운로드를 유지하며, 압축을 푼 폴더를 면접 앱에서 선택할 수도 있다.

`skills`·`experience`는 이력서에서만, `transferableStrengths`는 추가 자료에서만 추출하며 근거 문장이 없는 역량은 `verified: false`다. 희망·최저 연봉과 조건은 사용자가 직접 입력한 값만 비공개 프로필에 넣는다. `ANTHROPIC_API_KEY`가 없으면 가상 데모 결과를 반환한다. 화면 문구는 `packages/shared/src/onboarding/messages.ts`의 한국어·영어 사전을 사용한다. 링크 수집, 실제 저장소 연동과 디자인은 아직 없다.

## 단계별 온보딩 (현재 화면)

화면은 ① 프롬프트 복사 → ② 에이전트 결과 붙여넣기 → ③ 맞춤 질문(최대 3라운드) → ④ 완료 순서로 한 단계씩 진행한다. 상태는 화면이 들고 다니며 `POST /api/onboarding/step`(온보딩·면접 앱 공통, `@cgbg/shared/onboarding/step`)에 `agentExport`, 지난 라운드의 질문·답(`rounds`), 연봉 조사 결과(`research`)를 보낸다. 서버는 다음 질문 또는 완료(구직자 폴더)를 돌려준다.

- 질문은 에이전트 JSON의 `gaps`, 응답 전 `proposals`, 외국어 수준, 관심 분야를 바탕으로 Claude가 만든다. 관심 분야는 "이 분야 직무도 추천할지"를 확실히 묻고, 추천에 동의한 분야만 `roleTypes`에 넣는다. 국가는 한국·미국 외 후보를 복수 선택으로 묻는다. 선택형 질문에는 "기타" 직접 입력과 덧붙일 말 입력칸이 있다.
- 특정 국가를 제안하거나 연봉을 묻기 전에는 Claude 웹 검색으로 해당 국가·직무의 평균 연봉과 빅맥지수를 찾아 출처와 함께 보여준다. 연봉 답은 USD 또는 만원 단위 숫자로 받는다.
- 완료 시 답변을 반영해 프로필을 다시 만들고 `candidate_profiles` 테이블에 저장한다(`supabase/migrations/`). 테이블은 insert만 허용하고 select 정책이 없어 공개 키로 비공개 프로필을 읽을 수 없다. Supabase 환경변수가 없으면 저장을 건너뛴다.
- 웹 검색이 포함되면 한 요청이 1분 이상 걸릴 수 있어 라우트에 `maxDuration = 300`을 둔다.

## 이전 입력 방식

`POST /api/onboarding/parse`의 고정 질문 3개·PDF 입력은 API로만 남아 있다. 자료 입력은 두 가지였다. 기본인 "내 AI 에이전트로 가져오기"는 사용자가 복사한 프롬프트로 개인 AI 에이전트가 `beyond-cv/agent-export/v1` JSON(`items[]`: `category`, `title`, `detail`, `quote`, `source`)을 만들고, 사용자가 그 JSON을 붙여넣는다. 서버는 `work`·`education` 항목을 이력서 자리로, 나머지를 추가 자료로 나눠 같은 파서로 검증·분석한다. 개인 에이전트는 원자료만 제공하고 검증·숨은 강점 분석은 이 앱의 Claude가 맡는다. 질문 3개와 연봉은 화면에서 사용자가 직접 입력한다. 선택 필드 `insights`에는 에이전트가 본 관심사·재능·강점·약점·일하는 스타일과 직무·산업 가설(`roleIdeas`, 회사명 제외)을 담는다. 관심사·재능·강점·직무 가설은 Claude에 가설로만 전달해 자료로 뒷받침될 때만 반영하고, 약점과 일하는 스타일은 Claude에 보내지 않고 비공개 문서 `private/self-insight.md`에만 저장한다. "자료 직접 올리기"는 기존 PDF·텍스트 입력이다.

`@/*`는 이 앱의 `src/*`를 가리킨다. Supabase는 `@cgbg/shared/supabase/client` 또는 `@cgbg/shared/supabase/server`를 사용한다. 필요할 때 앱 내부 `.env.example`을 `.env.local`로 복사한다.

전체 실행·검증·배포는 [README](../../README.md), 기능 방향은 [제품 아이디어](../01_product_idea.md)를 따른다.

앱 간 구직자 프로필 형식은 [프로필 데이터 계약](../shared/00_profile_contract.md)을 따른다.

다음 개발 범위는 [온보딩·서버 면접 개발 계획](../plan/20261024_1132_onboarding_agents_plan.md)에 정리했다. 입력 폴더와 프로필 확정 과정을 이 앱에서 구현하고, 면접 실행은 면접 앱의 서버에 위임한다.
