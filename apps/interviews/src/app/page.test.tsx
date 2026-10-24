import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { InterviewDashboard } from "@/components/interview-dashboard";
import candidate from "../../../../data/demo/candidates/onboarding-example/index.json";
import * as interviewRun from "@/components/use-interview-run";
import { emptySnapshot } from "@/lib/types";
import { publicProfileSchema } from "@/lib/schemas";

const navigation = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.clearAllMocks(); });

test("첫 화면에서 샘플과 내 페르소나를 선택하고 다시 선택할 수 있다", () => {
  render(<InterviewDashboard profile={publicProfileSchema.parse(candidate.publicProfile)} ready={false} />);
  expect(screen.getByRole("heading", { level: 1, name: "누구의 다음 기회를 찾아볼까요?" })).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "백지오 페르소나로 체험하기" }));
  expect(screen.getByText("실제 백지오 엔지니어의 블로그, Github 등에서 추출된 정보와 인터뷰를 바탕으로 생성된 프로필 정보로 체험해요.")).toBeDefined();
  expect(screen.getByRole("heading", { level: 1, name: /백지오.*다음 기회/ })).toBeDefined();
  expect(screen.getByRole("region", { name: "백지오가 원하는 직장" }).textContent).toContain("연봉 5천만원+");
  expect(screen.getByRole("region", { name: "사용자 프로필 요약" }).textContent).toContain("영상, 시각-언어, 음성 AI를 아우르는 연구·머신러닝 엔지니어");
  expect(screen.queryByRole("complementary")).toBeNull();
  expect(screen.queryByRole("region", { name: "면접 현황" })).toBeNull();
  expect(screen.getByRole("button", { name: "면접 시작 ↗" }).hasAttribute("disabled")).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "페르소나 다시 선택" }));
  fireEvent.click(screen.getByRole("button", { name: "내 페르소나로 체험하기" }));
  expect(navigation.push).toHaveBeenCalledWith("/onboarding");
  expect(screen.queryByRole("button", { name: "면접 시작 ↗" })).toBeNull();
  expect(screen.queryByText("90000")).toBeNull();
});


test("검색 일치 수와 전체 공고 수를 구분하고 면접 150개와 멤버십 안내를 표시한다", () => {
  vi.spyOn(interviewRun, "useInterviewRun").mockReturnValue({
    runId: "metrics-test",
    snapshot: { ...emptySnapshot, done: true, search: { total: 17237, countryTotal: 11746, matched: 1451, companies: 84, country: "" } },
    starting: false, connected: false, error: undefined, demo: true,
    start: vi.fn(async () => {}), cancel: vi.fn(async () => {}), retry: vi.fn(), reset: vi.fn(), skipReplay: vi.fn(),
  });
  render(<InterviewDashboard profile={publicProfileSchema.parse(candidate.publicProfile)} ready initialRun="metrics-test" />);
  expect(screen.getByText("검색 결과").parentElement?.textContent).toContain("1,451 / 17,237개 공고");
  expect(screen.queryByText("검색 대상")).toBeNull();
  expect(screen.getByText("면접 볼 기업").parentElement?.textContent).toContain("150개");
  const hint = screen.getByRole("button", { name: "면접 횟수 안내" });
  expect(hint.getAttribute("aria-describedby")).toBe("interview-membership-tooltip");
  expect(screen.getByRole("tooltip", { hidden: true }).textContent).toBe("플러스 맴버십에 가입하면 무제한으로 면접을 진행할 수 있어요.");
});
