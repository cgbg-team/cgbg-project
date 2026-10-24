import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { useInterviewRun } from "./use-interview-run";
import type { RunEvent } from "@/lib/types";

afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

test("캐시를 67초에 재생하고 중지·건너뛰기 후에는 타이머로 갱신하지 않는다", async () => {
  vi.useFakeTimers();
  const events: RunEvent[] = [
    ...Array.from({ length: 2000 }, (): RunEvent => ({ type: "stage", stage: "interviewing", at: "now" })),
    { type: "done", at: "now" },
  ];
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ events }) });
  vi.stubGlobal("fetch", fetchMock);
  const { result } = renderHook(() => useInterviewRun());
  await act(async () => { await result.current.start(null); });
  act(() => vi.advanceTimersByTime(66000));
  expect(result.current.snapshot.done).toBe(false);
  act(() => vi.advanceTimersByTime(1000));
  expect(result.current.snapshot.done).toBe(true);
  expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/api/demo");
  await act(async () => { await result.current.start(null); });
  act(() => vi.advanceTimersByTime(1000));
  await act(async () => { await result.current.cancel(); });
  act(() => vi.advanceTimersByTime(90000));
  expect(result.current.snapshot.stage).toBe("cancelled");
  await act(async () => { await result.current.start(null); });
  act(() => vi.advanceTimersByTime(5000));
  expect(result.current.snapshot.done).toBe(false);
  const requests = fetchMock.mock.calls.length;
  act(() => result.current.skipReplay());
  expect(result.current.snapshot).toMatchObject({ done: true, stage: "completed" });
  const completed = result.current.snapshot;
  act(() => vi.advanceTimersByTime(90000));
  expect(result.current.snapshot).toBe(completed);
  expect(fetchMock).toHaveBeenCalledTimes(requests);
});
