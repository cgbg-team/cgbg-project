import { createStepHandler } from "@cgbg/shared/onboarding/step";
import { onboardingResearch } from "@/lib/onboarding-research";

// 미리 계산한 빅맥·공고 연봉을 먼저 쓰고, 연봉이 없을 때만 웹 검색한다.
export const POST = createStepHandler({ lookup: onboardingResearch });

// 웹 검색이 포함되면 한 요청이 1분 이상 걸릴 수 있다.
export const maxDuration = 300;
