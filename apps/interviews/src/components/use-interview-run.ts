"use client";
import { useEffect, useRef, useState } from "react";
import { applyEvent, emptySnapshot, type RunEvent } from "@/lib/types";
import type { CandidateInput } from "@/lib/candidate-input";

export function useInterviewRun(initialRun?: string) {
  const [runId, setRunId] = useState(initialRun);
  const [snapshot, setSnapshot] = useState(emptySnapshot);
  const [error, setError] = useState<string>();
  const [starting, setStarting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [reconnect, setReconnect] = useState(0);
  const replayTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const replayVersion = useRef(0);
  const replayEvents = useRef<RunEvent[]>([]);
  const [demo, setDemo] = useState(false);
  useEffect(() => () => { replayVersion.current++; clearTimeout(replayTimer.current); }, []);
  useEffect(() => {
    if (!runId || demo) return;
    const abort = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let finished = false;
    async function status() {
      try {
        const response = await fetch(`/api/runs/${runId}`, {
          signal: abort.signal,
        });
        if (!response.ok)
          throw new Error("면접 기록 접근 권한이 없거나 만료되었습니다.");
        const data = await response.json();
        if (["cancelled", "failed"].includes(data.status)) {
          finished = true;
          setSnapshot((state) => ({
            ...state,
            stage: data.status === "cancelled" ? "cancelled" : "error",
            done: true,
          }));
          abort.abort();
        }
      } catch (cause) {
        if (!abort.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "서버 상태를 확인하지 못했습니다.",
          );
      }
      if (!abort.signal.aborted && !finished) timer = setTimeout(status, 2500);
    }
    async function listen() {
      try {
        const response = await fetch(`/api/runs/${runId}?stream=1`, {
          signal: abort.signal,
        });
        if (!response.ok || !response.body)
          throw new Error("진행 기록에 연결하지 못했습니다.");
        setConnected(true);
        const reader = response.body
          .pipeThrough(new TextDecoderStream())
          .getReader();
        let buffer = "";
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          buffer += chunk.value;
          let boundary: number;
          while ((boundary = buffer.indexOf("\n")) >= 0) {
            const event: RunEvent = JSON.parse(buffer.slice(0, boundary));
            buffer = buffer.slice(boundary + 1);
            setSnapshot((state) => applyEvent(state, event));
            if (
              event.type === "done" ||
              (event.type === "error" && !event.jobId)
            )
              finished = true;
          }
        }
        if (!finished && !abort.signal.aborted)
          throw new Error(
            "연결이 끊겼습니다. 다시 연결하면 기록을 복원합니다.",
          );
      } catch (cause) {
        if (!abort.signal.aborted)
          setError(
            cause instanceof Error ? cause.message : "기록을 읽지 못했습니다.",
          );
      } finally {
        setConnected(false);
      }
    }
    void status();
    void listen();
    return () => {
      abort.abort();
      clearTimeout(timer);
    };
  }, [runId, reconnect, demo]);
  async function startDemo() {
    const startedAt = Date.now();
    const version = ++replayVersion.current;
    clearTimeout(replayTimer.current);
    setStarting(true);
    setError(undefined);
    try {
      const response = await fetch("/api/demo");
      if (!response.ok) throw new Error("체험 데이터를 불러오지 못했습니다.");
      const data: { events: RunEvent[] } = await response.json();
      if (version !== replayVersion.current) return;
      if (!data.events.some(event => event.type === "done")) throw new Error("완료된 체험 데이터가 없습니다.");
      replayEvents.current = data.events;
      setDemo(true);
      setSnapshot(emptySnapshot);
      setRunId("demo-gio");
      window.history.replaceState(null, "", window.location.pathname);
      let cursor = 0;
      const advance = () => {
        const elapsed = Date.now() - startedAt;
        // 검색 단계를 읽을 여유를 주고, 경과 시간에 맞춰 약 67초에 재생을 마친다.
        const target = Math.min(data.events.length, elapsed < 8000
          ? Math.floor(elapsed / (8000 / 6)) + 1
          : 6 + Math.ceil(Math.max(0, data.events.length - 6) * Math.min(1, (elapsed - 8000) / 58667)));
        const batch = data.events.slice(cursor, target);
        cursor = target;
        setSnapshot(state => batch.reduce(applyEvent, state));
        if (cursor < data.events.length) replayTimer.current = setTimeout(advance, 250);
      };
      advance();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "체험을 시작하지 못했습니다.");
    } finally { setStarting(false); }
  }
  async function start(candidate: CandidateInput | null = null, country = "") {
    if (!candidate) return startDemo();
    replayVersion.current++;
    clearTimeout(replayTimer.current);
    setDemo(false);
    setStarting(true);
    setError(undefined);
    try {
      const response = await fetch(`/api/runs${country ? `?country=${encodeURIComponent(country)}` : ""}`, {
        method: "POST",
        ...(candidate
          ? {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(candidate),
            }
          : {}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSnapshot({
        ...emptySnapshot,
        profile: candidate?.publicProfile,
        source: candidate ? "upload" : "demo",
      });
      setRunId(data.runId);
      window.history.replaceState(
        null,
        "",
        `?run=${encodeURIComponent(data.runId)}`,
      );
      setReconnect((value) => value + 1);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "면접을 시작하지 못했습니다.",
      );
    } finally {
      setStarting(false);
    }
  }
  async function cancel() {
    if (demo) {
      clearTimeout(replayTimer.current);
      setSnapshot(state => ({ ...state, stage: "cancelled", done: true }));
      return;
    }
    try {
      const response = await fetch(`/api/runs/${runId}`, { method: "DELETE" });
      if (!response.ok)
        throw new Error("중지하지 못했습니다. 다시 시도해주세요.");
      setReconnect((value) => value + 1);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "중지 요청에 실패했습니다.",
      );
    }
  }
  function retry() {
    setSnapshot(emptySnapshot);
    setError(undefined);
    setReconnect((value) => value + 1);
  }
  function skipReplay() {
    if (!demo || snapshot.done) return;
    clearTimeout(replayTimer.current);
    setSnapshot(replayEvents.current.reduce(applyEvent, emptySnapshot));
  }
  function reset() {
    replayVersion.current++;
    clearTimeout(replayTimer.current);
    setRunId(undefined);
    setDemo(false);
    setSnapshot(emptySnapshot);
    setError(undefined);
    window.history.replaceState(null, "", window.location.pathname);
  }
  return { runId, snapshot, starting, connected, error, start, cancel, retry, demo, reset, skipReplay };
}
