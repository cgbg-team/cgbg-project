import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { useInterviewRun } from "./use-interview-run";
import type { RunEvent } from "@/lib/types";

afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

test("대용량 캐시도 100초에 완료하고 재생 중지는 이후 갱신을 막는다", async () => {
  vi.useFakeTimers();
  const events: RunEvent[] = [
    ...Array.from({ length: 2000 }, (): RunEvent => ({ type: "stage", stage: "interviewing", at: "now" })),
    { type: "done", at: "now" },
  ];
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ events }) });
  vi.stubGlobal("fetch", fetchMock);
  const { result } = renderHook(() => useInterviewRun());
  await act(async () => { await result.current.start(null); });
  act(() => vi.advanceTimersByTime(99000));
  expect(result.current.snapshot.done).toBe(false);
  act(() => vi.advanceTimersByTime(1000));
  expect(result.current.snapshot.done).toBe(true);
  expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/api/demo");
  await act(async () => { await result.current.start(null); });
  act(() => vi.advanceTimersByTime(1000));
  await act(async () => { await result.current.cancel(); });
  act(() => vi.advanceTimersByTime(90000));
  expect(result.current.snapshot.stage).toBe("cancelled");
});
