import type { Job } from "./types";

export function jobHighlights(job: Job): { label: string; evidence: string }[] {
  const lines = `${job.text}\n${job.salary}`.split(/\n+|[.!?]\s+/).map(line => line.trim()).filter(Boolean);
  const highlights: { label: string; evidence: string }[] = [];
  function add(label: string, positive: RegExp, negative?: RegExp) {
    if (negative && lines.some(line => negative.test(line))) return;
    const evidence = lines.find(line => positive.test(line) && !/not (?:provided|offered|available)|unavailable|제공하지|미지원/i.test(line));
    if (evidence) highlights.push({ label, evidence });
  }
  add("비자 지원", /visa sponsorship|immigration (?:support|assistance)|비자.{0,12}지원/i, /(?:no|not|cannot|unable|without|won.t).{0,60}(?:sponsor|visa|immigration)|(?:sponsor|visa).{0,50}(?:not available|not provided|unavailable)|비자.{0,20}(?:불가|미지원|지원하지)/i);
  add("주거비 지원", /housing (?:allowance|stipend|support|assistance)|(?:rent|rental) (?:subsidy|assistance)|주거비.{0,10}지원|주택.{0,10}수당/i, /(?:no|not|without).{0,30}(?:housing|rental)|주거비.{0,10}(?:미지원|지원하지)/i);
  add("이주 지원", /relocation (?:assistance|support|package|benefits)|이주.{0,10}지원|이사비.{0,10}지원/i, /(?:no|not|without).{0,30}relocation|relocation.{0,30}(?:not provided|unavailable)|이주.{0,10}(?:미지원|지원하지)/i);
  add("지분 보상", /(?:eligible for|offer|plus|and|including|competitive).{0,35}(?:equity|stock options)|스톡옵션|주식.{0,10}보상/i, /(?:no|without).{0,15}(?:equity|stock options)/i);
  add("의료보험 지원", /(?:health|medical|dental) insurance|(?:health|medical).{0,20}(?:coverage|benefits)|의료보험.{0,10}지원/i, /(?:no|without).{0,20}(?:health|medical|dental) insurance/i);
  add("유연한 휴가", /unlimited (?:paid time off|pto|vacation)|무제한.{0,10}휴가/i, /(?:no|not).{0,15}unlimited/i);
  if (/\bremote\b|원격/i.test(job.location) && !/not remote|no remote|원격 불가/i.test(job.location)) highlights.push({ label: "원격 근무", evidence: job.location });
  else if (/\bhybrid\b|하이브리드/i.test(job.location)) highlights.push({ label: "하이브리드", evidence: job.location });
  if (job.salary.trim()) highlights.push({ label: "연봉 공개", evidence: job.salary });
  return highlights.slice(0, 5);
}
