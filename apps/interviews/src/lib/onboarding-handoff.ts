import type { CandidateInput } from "./candidate-input";

// /onboarding에서 확정한 프로필을 메인 면접 화면으로 넘긴다. 한 번 읽으면 지운다.
const key = "cgbg-onboarding-candidate:v1";

export function storeOnboardingCandidate(candidate: CandidateInput) {
  try {
    sessionStorage.setItem(key, JSON.stringify(candidate));
    return true;
  } catch {
    return false;
  }
}

export function takeOnboardingCandidate(): CandidateInput | null {
  try {
    const raw = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
    return raw ? (JSON.parse(raw) as CandidateInput) : null;
  } catch {
    return null;
  }
}
