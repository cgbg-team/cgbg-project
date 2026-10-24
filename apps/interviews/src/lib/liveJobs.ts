import "server-only";
import { z } from "zod";
import { jobSchema } from "./schemas";
import type { Job } from "./types";

// 미리 받은 풀에 없는 직무·국가는 로그인 없는 공개 API에서 바로 찾는다. LinkedIn 게스트 검색은 429로 막혀 쓰지 않는다.
const geo: Record<string, string> = { US: "usa", UK: "uk", CA: "canada", AU: "australia", DE: "germany", FR: "france", JP: "japan", IE: "ireland", NL: "netherlands", SG: "singapore", KR: "south-korea", IN: "india" };
const jobicySchema = z.object({ jobs: z.array(z.object({ id: z.coerce.string(), url: z.string(), jobTitle: z.string(), companyName: z.string(), jobGeo: z.string().default(""), jobDescription: z.string().default(""), salaryMin: z.coerce.string().optional(), salaryMax: z.coerce.string().optional(), salaryCurrency: z.string().optional() })).default([]) });
const remotiveSchema = z.object({ jobs: z.array(z.object({ id: z.coerce.string(), url: z.string(), title: z.string(), company_name: z.string(), candidate_required_location: z.string().default(""), salary: z.string().default(""), description: z.string().default("") })).default([]) });

const plain = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&nbsp;|&amp;|&#\d+;/g, " ").replace(/\s+/g, " ").trim().slice(0, 2500);

async function getJson(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(5000), headers: { "User-Agent": "Mozilla/5.0 cgbg-interviews" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function jobicy(term: string, country: string): Promise<Job[]> {
  const g = country ? geo[country] : "";
  if (country && !g) return [];
  const data = jobicySchema.parse(await getJson(`https://jobicy.com/api/v2/remote-jobs?count=50&tag=${encodeURIComponent(term)}${g ? `&geo=${g}` : ""}`));
  return data.jobs.map((j) => ({
    id: `LJ${j.id}`, title: j.jobTitle, company: j.companyName, country: country || "?", location: `Remote · ${j.jobGeo}`,
    salary: j.salaryMin && j.salaryMax ? `${j.salaryCurrency ?? ""} ${j.salaryMin}–${j.salaryMax}`.trim() : "",
    source: "jobicy (live)", url: j.url, text: plain(j.jobDescription),
  }));
}

async function remotive(term: string, country: string): Promise<Job[]> {
  const data = remotiveSchema.parse(await getJson(`https://remotive.com/api/remote-jobs?limit=50&search=${encodeURIComponent(term)}`));
  return data.jobs
    // 국가를 고르면 그 국가 또는 전 세계 지원 가능한 원격 공고만 남긴다.
    .filter((j) => !country || /worldwide|anywhere/i.test(j.candidate_required_location) || j.candidate_required_location.toLowerCase().includes((geo[country] ?? country).replace("-", " ")))
    .map((j) => ({
      id: `LR${j.id}`, title: j.title, company: j.company_name, country: country || "?", location: `Remote · ${j.candidate_required_location}`,
      salary: j.salary, source: "remotive (live)", url: j.url, text: plain(j.description),
    }));
}

// 같은 검색어·국가는 30분 동안 서버 메모리 결과를 재사용한다. 반복 검색을 빠르게 하고 공개 API 호출 제한을 피한다.
const cache = new Map<string, { at: number; jobs: Promise<Job[]> }>();
const ttl = 30 * 60 * 1000;
function cached(key: string, load: () => Promise<Job[]>) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.jobs;
  const jobs = load().catch((error) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, { at: Date.now(), jobs });
  return jobs;
}

export async function fetchLiveJobs(terms: string[], country = ""): Promise<Job[]> {
  const calls = terms.slice(0, 3).flatMap((term) => [cached(`jobicy|${term}|${country}`, () => jobicy(term, country)), cached(`remotive|${term}|${country}`, () => remotive(term, country))]);
  const settled = await Promise.allSettled(calls);
  const seen = new Set<string>();
  return settled
    .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    .filter((job) => jobSchema.safeParse(job).success && !seen.has(job.id) && Boolean(seen.add(job.id)));
}
