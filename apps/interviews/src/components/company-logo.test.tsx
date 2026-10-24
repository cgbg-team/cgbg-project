import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { CompanyLogo } from "./company-logo";

afterEach(cleanup);

test("공식 도메인의 정적 로고를 표시하고 누락·로딩 실패 시 이니셜로 대체한다", () => {
  const view = render(<CompanyLogo company=" OpenAI " />);
  const logo = screen.getByRole("img");
  expect(new URL(logo.getAttribute("src")!, "http://localhost").pathname).toBe("/company-logos/openai.com.png");
  fireEvent.error(logo);
  expect(screen.queryByRole("img")).toBeNull();
  view.rerender(<CompanyLogo company="Anthropic" />);
  expect(screen.getByRole("img").getAttribute("alt")).toBe("Anthropic 로고");
  view.rerender(<CompanyLogo company="Unregistered company" />);
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.getByText("U")).toBeDefined();
});
