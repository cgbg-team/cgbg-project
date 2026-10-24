"use client";
import { useEffect, useState } from "react";
import { applyEvent, emptySnapshot, type RunEvent } from "@/lib/types";

export function useInterviewRun(initialRun?: string) {
  const [runId, setRunId] = useState(initialRun);
  const [snapshot, setSnapshot] = useState(emptySnapshot);
  const [error, setError] = useState<string>();
  const [starting, setStarting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [reconnect, setReconnect] = useState(0);
  useEffect(() => {
    if (!runId) return;
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
  }, [runId, reconnect]);
  async function start() {
    setStarting(true);
    setError(undefined);
    try {
      const response = await fetch("/api/runs", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSnapshot(emptySnapshot);
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
  return { runId, snapshot, starting, connected, error, start, cancel, retry };
}
