import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import Home from "./page";

afterEach(cleanup);

test("기본 화면에 프로젝트 제목을 표시한다", () => {
  render(<Home />);
  expect(
    screen.getByRole("heading", {
      level: 1,
      name: "Anthropic 해커톤 보일러플레이트",
    }),
  ).toBeDefined();
});
