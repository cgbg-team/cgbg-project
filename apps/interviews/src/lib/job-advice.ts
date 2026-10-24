const sentences = new Intl.Segmenter("ko", { granularity: "sentence" });

export function normalizeAdvice(advice: string[]): string[] {
  return advice.slice(0, 3).map(text => {
    const parts = [...sentences.segment(text)].map(part => part.segment.trim());
    if (parts.length <= 1) return text;
    return parts.map(part => part.replace(/[.!?。]+$/u, "")).join("; ") + ".";
  });
}
