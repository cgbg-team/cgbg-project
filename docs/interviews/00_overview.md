# 에이전트 면접 앱

`apps/interviews`의 독립된 Next.js App Router 앱이다. workspace 이름은 `@cgbg/interviews`, 개발·프로덕션 기본 포트는 3001이다.

루트에서 `npm run dev:interviews`로 실행한다. 서버 전용 `ANTHROPIC_API_KEY`, `INTERVIEW_SESSION_SECRET`(32자 이상)을 앱의 `.env.local`에 설정한다. 기본 모델은 `claude-sonnet-4-6`이다. 비밀 키 생성 명령은 [README](../../README.md#면접-앱-실행)를 따른다.

`@/*`는 이 앱의 `src/*`를 가리킨다. Supabase는 `@cgbg/shared/supabase/client` 또는 `@cgbg/shared/supabase/server`를 사용한다. 필요할 때 앱 내부 `.env.example`을 `.env.local`로 복사한다.

전체 실행·검증·배포는 [README](../../README.md), 기능 방향은 [제품 아이디어](../01_product_idea.md)를 따른다.

앱 간 구직자 프로필 형식은 [프로필 데이터 계약](../shared/00_profile_contract.md)을 따른다.

## 현재 동작

자료 폴더를 선택하면 프로필과 희망 조건을 미리 보여준다. 사용자가 확인 체크 후 면접 시작을 누르면 업로드한 프로필로 실제 Claude가 검색어를 추출한다. 자료가 없으면 샘플로 체험할 수 있다. 공고는 기존 가상 공고 3개를 사용한다. 제목·본문·역량과 대소문자 구분 없이 부분 일치로 검색하고, 일치 키워드 수가 많은 공고 2개까지 선택한다. 동점이면 공고 ID 순서다. 1개만 일치하면 1개만 면접하며, 0개이면 정상 종료한다. 미선정 이유도 표시한다.

기업별로 독립된 대화 이력을 만든다. 경험 확인 → 근무 조건 → 연봉 협상 각 1왕복 후 추천·보류·조건 불일치 결과를 생성한다. 두 기업은 병렬로 실행하고 한 기업의 Claude 오류가 다른 기업을 중단시키지 않는다. 정보가 부족하면 확인 질문과 보류 결과를 남긴다. 사용자 답변 제출·재개와 일정 조율은 아직 없다. 추천은 실제 채용 합격이 아니다.

`src/workflows/interviews.ts`가 실행을 조율하고 `src/lib/steps.ts`가 파일 읽기·Claude 호출·진행 기록을 담당한다. 프론트엔드는 저장된 NDJSON 진행 기록을 읽어 갱신하며 재접속 시 처음부터 복원한다. 명시적 중지는 서버 실행을 취소한다. 이미 전송된 Claude 요청의 비용까지 취소된다고 보장하지 않는다.

## 샘플 입력과 프로필 v1

계약 타입은 `@cgbg/shared/profile`, 런타임 검증은 앱의 `schemas.ts`에 있다. 샘플 위치는 `src/data/demo/`다.

```text
candidate/index.json
candidate/public/experience.md
candidate/public/strengths.md
candidate/private/interview.md
jobs/orbit/index.json
jobs/relay/index.json
jobs/folio/index.json
```

구직자 `index.json`은 `confirmed_at`(ISO 시각), `salaryPeriod: "annual"`, `publicProfile: PublicProfile`, `privateProfile: PrivateProfile`을 묶는 **면접 앱 입력 봉투 형식**이다. 온보딩의 업로드 형식으로 강제하지 않는다. 두 프로필 ID가 같아야 한다. 프로필과 공개 문서를 시작 시 실행 입력 스냅샷으로 보관한다. 서버는 확인 후 시작한 시각으로 `confirmed_at`을 갱신한다.

폴더 전체는 파일 20개·합계 1MB 이하이며, index에 등록한 Markdown 파일과 index.json만 허용한다. 누락·중복·경로 이탈·없는 근거 앵커는 시작 전에 안내한다. 폴더 선택은 브라우저에서 읽기·미리보기만 수행하며, 시작할 때 프로필 JSON과 공개 문서 내용만 서버로 전송한다. 비공개 Markdown 원문은 전송하지 않는다. 서버에서 같은 검증을 다시 수행하고 요청 본문도 1MB로 제한한다. PDF·원본 이력서의 프로필 변환은 포함하지 않는다.

공고 JSON은 `id`, `company`, `title`, `description`, `skills`, `remote`, `weeklyHours`, `salary: { currency, min, max, period: "annual" }`이다. USD 또는 KRW의 연간 급여만 지원한다. 통화가 다르면 환산하지 않고 보류하며, 공고 상한이 구직자 하한보다 작으면 서버에서 조건 불일치로 처리한다.

자료는 모두 가상 정보다. 공개 문서만 읽고 루트 이탈·상위 경로 이동·잘못된 JSON·누락 근거와 앵커를 거부한다. 비공개 Markdown 원문은 모델에 넣지 않고 구조화된 비공개 조건만 구직자 프롬프트에 사용한다. 연봉 하한은 양측 모델에서 제외하고 서버 비교에만 쓴다. 채용 에이전트는 공개 요약·공개 문서·자기 공고·해당 기업 대화만 받는다.

## 실행·저장·접근 제어

Workflow SDK 5.2.3의 실행 로그와 저장 스트림을 사용한다. 로컬은 앱의 `.workflow-data/`에 저장하며 서버 프로세스가 켜져 있어야 진행된다. 폴더를 삭제하면 기록을 잃는다. Vercel 배포는 관리형 Workflow 실행을 전제로 하며 아직 검증하지 않았다. 다른 서버리스 호스트에서 로컬 파일 저장으로 운영하지 않는다. Supabase 테이블·온보딩 데이터 조회·양 앱 간 전달은 아직 연결하지 않았다. 기존 계획의 Supabase 상태 복제는 샘플 구현에 포함하지 않는다.

실행 ID만으로 조회할 수 없다. 서버가 실행 ID와 만료 시각을 서명한 HttpOnly·SameSite 쿠키를 발급하고 조회·중지 시 검증한다. 새 실행 시 쿠키가 교체되므로 같은 브라우저의 **가장 최근 실행 1개**를 24시간 동안 복원한다. 제어 토큰·프로필을 URL에 넣지 않는다. Workflow 내부 로그에는 비공개 프로필이 있으므로 관리자 접근을 제한해야 한다.

| API | 동작 |
| --- | --- |
| `POST /api/runs` | 업로드한 입력 JSON으로 시작, 본문이 없으면 샘플 시작. 진행 중인 실행이 있으면 새 프로필 요청은 409, 샘플 요청은 같은 ID 반환 |
| `GET /api/runs/{id}` | 실행 상태 |
| `GET /api/runs/{id}?stream=1` | 공개 이벤트 재생·실시간 수신 |
| `DELETE /api/runs/{id}` | 실행 취소 |

변경 요청은 같은 출처에서만 허용한다. 새 실행은 프로세스·IP당 분당 1회, 공고 2개, 기업별 3왕복, 호출당 출력 최대 900토큰·60초 타임아웃이다. 정상 실행은 키워드 1회 + 기업당 7회로 최대 15번의 Claude 요청이다. SDK와 모델 step의 오류 자동 재시도는 끈다. 장애 시 외부 요청의 중복 비용이 절대 없다고 보장하지 않으며 입력·이력 토큰도 과금된다. 전체 배포의 금액 상한·공유 동시 실행 제한은 아니므로 공개 운영 전 Firewall 또는 공유 제한과 API 사용량 한도가 필요하다.

## 검증과 후속 작업

유닛 테스트는 계약·업로드 검증·프롬프트 경계·스크리닝·상태 복원·서명을 검사한다. E2E는 테스트용 Claude HTTP 서버와 실제 Workflow 런타임으로 사용자 폴더 선택·확인·서버 대화 입력·창 닫기·서버 완료·재접속·권한을 확인한다. 모의 응답은 앱 실행 코드에 없다.

실제 Claude의 두 기업 병렬 면접은 로컬 프로덕션 서버에서 확인했다. Vercel은 [별도 면접 프로젝트](https://cgbg-interviews.vercel.app)에서 프로덕션 빌드와 공개 화면 HTTP 200을 확인했다. 클라우드의 실제 면접은 서버 키 등록 후 확인이 필요하며, 서버 장애 복구·Supabase 연결은 미검증이다. 설치·환경변수·Git 연결 상태는 [README](../../README.md#vercel-배포)를 따른다. 후속 작업은 온보딩 확정 프로필 연결, 사용자 질문 응답·재개, 기업별 재시도다. 전체 방향은 [개발 계획](../plan/20261024_1132_onboarding_agents_plan.md)을 참고한다.

Workflow의 간접 의존성 Zod·Undici에서 npm audit의 high 경고 23건을 확인했다. 호환 범위의 자동 수정으로 해소되지 않았으며, 공개 운영 전 의존성 업데이트와 재검토가 필요하다.
