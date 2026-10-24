import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { JobContext, jobLocation } from "./job-context";
import type { Job } from "@/lib/types";

afterEach(cleanup);

test("도시·원격·미기재를 구분하고 연봉과 국가별 빅맥 달러 가격·출처를 표시한다", () => {
  expect(jobLocation({ location: "San Francisco, California", country: "US" })).toBe("San Francisco, 미국");
  expect(jobLocation({ location: "Remote - United States", country: "US" })).toBe("원격, 미국");
  expect(jobLocation({ location: "United States", country: "US" })).toBe("도시 미기재, 미국");
  expect(jobLocation({ location: "", country: "" })).toBe("도시 미기재, 국가 미기재");
  expect(jobLocation({ location: "Chicago; New York", country: "US" })).toBe("Chicago 외 1곳, 미국");
  const job: Job = { id: "one", company: "Example", title: "Engineer", country: "US", location: "San Francisco", salary: "$100K–150K", source: "test", url: "https://example.com", text: "" };
  const view = render(<JobContext job={job} />);
  expect(screen.getByText("공고 연봉 $100K–150K")).toBeDefined();
  const price = screen.getByRole("link", { name: "🍔 빅맥 가격: $6.22" });
  expect(price.getAttribute("title")).toContain("2026-07-01");
  expect(price.getAttribute("href")).toContain("TheEconomist/big-mac-data");
  view.rerender(<JobContext job={{ ...job, salary: "", country: "?" }} />);
  expect(screen.getByText("공고 연봉 미기재")).toBeDefined();
  expect(screen.queryByRole("link")).toBeNull();
});
