import "server-only";
import { z } from "zod";
import { jobSchema } from "./schemas";
import type { Job } from "./types";

// 미리 받은 풀에 없는 직무·국가는 로그인 없는 공개 API에서 바로 찾는다. LinkedIn 게스트 검색은 429로 막혀 쓰지 않는다.
const geo: Record<string, string> = { US: "usa", UK: "uk", CA: "canada", AU: "australia", DE: "germany", FR: "france", JP: "japan", IE: "ireland", NL: "netherlands", SG: "singapore", KR: "south-korea", IN: "india" };
const jobicySchema = z.object({ jobs: z.array(z.object({ id: z.coerce.string(), url: z.string(), jobTitle: z.string(), companyName: z.string(), jobGeo: z.string().default(""), jobDescription: z.string().default(""), salaryMin: z.coerce.string().optional(), salaryMax: z.coerce.string().optional(), salaryCurrency: z.string().optional() })).default([]) });
const remotiveSchema = z.object({ jobs: z.array(z.object({ id: z.coerce.string(), url: z.string(), title: z.string(), company_name: z.string(), candidate_required_location: z.string().default(""), salary: z.string().default(""), description: z.string().default("") })).default([]) });

// 국가를 고르면 그 국가가 명시된 공고만 남긴다. "Anywhere"·"Worldwide" 원격 공고를 그 나라 공고처럼 보이지 않게 한다.
const inCountry = (where: string, country: string) => !country || new RegExp(`\\b${(geo[country] ?? country).replace("-", " ")}\\b`, "i").test(where.replace(/-/g, " "));
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
  return data.jobs.filter((j) => inCountry(j.jobGeo, country)).map((j) => ({
    id: `LJ${j.id}`, title: j.jobTitle, company: j.companyName, country: country || "?", location: `Remote · ${j.jobGeo}`,
    salary: j.salaryMin && j.salaryMax ? `${j.salaryCurrency ?? ""} ${j.salaryMin}–${j.salaryMax}`.trim() : "",
    source: "jobicy (live)", url: j.url, text: plain(j.jobDescription),
  }));
}

async function remotive(term: string, country: string): Promise<Job[]> {
  const data = remotiveSchema.parse(await getJson(`https://remotive.com/api/remote-jobs?limit=50&search=${encodeURIComponent(term)}`));
  return data.jobs
    .filter((j) => inCountry(j.candidate_required_location, country))
    .map((j) => ({
      id: `LR${j.id}`, title: j.title, company: j.company_name, country: country || "?", location: `Remote · ${j.candidate_required_location}`,
      salary: j.salary, source: "remotive (live)", url: j.url, text: plain(j.description),
    }));
}

// Supabase job_search_cache에 12시간 공유 캐시를 둔다. 서버 인스턴스가 바뀌어도 미리 채운 결과를 바로 쓴다.
// 공개 키로 누구나 쓸 수 있는 테이블이라 읽을 때 스키마와 출처 도메인을 다시 검증한다.
const dbTtl = 12 * 60 * 60 * 1000;
const liveHosts = /^https:\/\/(jobicy\.com|remotive\.com)\//;
// supabase-js는 Node 20에서 실시간 WebSocket 초기화로 실패해 PostgREST를 fetch로 직접 부른다.
function rest(path: string, init: RequestInit = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return fetch(`${url}/rest/v1/job_search_cache${path}`, { ...init, signal: AbortSignal.timeout(2000), headers: { apikey: key, "Content-Type": "application/json", ...init.headers } });
}
const cacheRowSchema = z.array(z.object({ jobs: z.array(jobSchema), fetched_at: z.string() })).max(1);
async function fromDb(key: string): Promise<Job[] | null> {
  const res = await rest(`?select=jobs,fetched_at&key=eq.${encodeURIComponent(key)}`);
  if (!res?.ok) return null;
  const row = cacheRowSchema.safeParse(await res.json()).data?.[0];
  if (!row || Date.now() - Date.parse(row.fetched_at) > dbTtl) return null;
  return row.jobs.filter((job) => liveHosts.test(job.url));
}
async function toDb(key: string, jobs: Job[]) {
  await rest("", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ key, jobs, fetched_at: new Date().toISOString() }) });
}
async function loadShared(key: string, load: () => Promise<Job[]>) {
  const stored = await fromDb(key).catch(() => null);
  if (stored) return stored;
  const jobs = await load();
  await toDb(key, jobs).catch(() => undefined);
  return jobs;
}

// 같은 검색어·국가는 30분 동안 서버 메모리 결과를 재사용한다. 반복 검색을 빠르게 하고 공개 API 호출 제한을 피한다.
const cache = new Map<string, { at: number; jobs: Promise<Job[]> }>();
const ttl = 30 * 60 * 1000;
function cached(key: string, load: () => Promise<Job[]>) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.jobs;
  const jobs = loadShared(key, load).catch((error) => {
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
