// 공고 풀과 The Economist 빅맥 지수로 국가별 물가 참고값과 직무·연차별 공고 연봉 범위를 미리 계산한다.
// node apps/interviews/scripts/build-benchmarks.mjs  → src/data/jobs/benchmarks.json
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const bigMacUrl = "https://raw.githubusercontent.com/TheEconomist/big-mac-data/master/output-data/big-mac-full-index.csv";
const iso3 = { US: "USA", UK: "GBR", CA: "CAN", AU: "AUS", JP: "JPN", KR: "KOR", SG: "SGP", IN: "IND", DE: "EUZ", FR: "EUZ", IE: "EUZ", NL: "EUZ" };
const roles = [
  ["ml_engineer", /machine learning|\bml\b|\bai engineer|applied ai/],
  ["research", /research (scientist|engineer)|researcher/],
  ["data", /data (scientist|analyst|engineer)|analytics/],
  ["devrel", /developer (relations|advocate)|devrel|developer experience/],
  ["solutions", /solutions? (engineer|architect)|forward deployed|field engineer|sales engineer/],
  ["technical_writer", /technical writer|documentation/],
  ["software_engineer", /software|backend|frontend|full[- ]?stack|infrastructure engineer|platform engineer|mobile|\bios\b|android|engineer/],
  ["product_manager", /product manager/],
  ["designer", /designer|design lead/],
  ["customer_success", /customer success|customer experience|\bcx\b|support/],
  ["sales", /account executive|account manager|sales|business development/],
  ["marketing", /marketing|growth|communications|brand/],
  ["recruiting", /recruit|talent/],
  ["operations", /operations|program manager|chief of staff/],
  ["finance_legal", /financ|account(ing|ant)|counsel|legal|payroll|tax/],
];
const levels = { skip: /intern/, entry: /junior|new grad|graduate|entry|early career|associate|\bi\b/, senior: /senior|\bsr\b|staff|principal|lead|director|head|manager|\bvp\b/ };
const level = (title) => (levels.skip.test(title) ? "" : levels.entry.test(title) ? "entry" : levels.senior.test(title) ? "senior" : "mid");
const currencies = [["CA$", "CAD"], ["A$", "AUD"], ["S$", "SGD"], ["£", "GBP"], ["€", "EUR"], ["¥", "JPY"], ["₩", "KRW"], ["$", "USD"], ["USD", "USD"], ["CAD", "CAD"], ["GBP", "GBP"], ["EUR", "EUR"]];

function parseSalary(text) {
  const first = text.split("•")[0];
  const currency = currencies.find(([mark]) => first.includes(mark))?.[1];
  const nums = [...first.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*([kK])?/g)].map(([, n, k]) => Number(n.replaceAll(",", "")) * (k ? 1000 : 1));
  const annual = nums.filter((n) => n >= 20_000).slice(0, 2);
  return currency && annual.length ? { currency, mid: annual.reduce((a, b) => a + b) / annual.length } : null;
}

const quantile = (sorted, q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];

const csv = (await (await fetch(bigMacUrl)).text()).trim().split("\n").map((line) => line.split(","));
const header = csv[0];
const latest = csv.slice(1).reduce((max, row) => (row[0] > max ? row[0] : max), "");
const bigMac = Object.fromEntries(csv.filter((row) => row[0] === latest).map((row) => [row[1], Object.fromEntries(header.map((h, i) => [h, row[i]]))]));
const usdPer = Object.fromEntries(Object.values(bigMac).map((r) => [r.currency_code, 1 / Number(r.dollar_ex)]));

const countries = Object.fromEntries(Object.entries(iso3).filter(([, code]) => bigMac[code]).map(([country, code]) => {
  const r = bigMac[code];
  return [country, { bigMacLocal: Number(r.local_price), currency: r.currency_code, bigMacUsd: Math.round(Number(r.dollar_price) * 100) / 100, gdpPerCapitaUsd: r.GDP_bigmac ? Math.round(Number(r.GDP_bigmac)) : null, region: code === "EUZ" ? "Euro area" : r.name }];
}));

const pool = JSON.parse(gunzipSync(readFileSync(path.join(root, "src/data/jobs/jobs_pool.json.gz"))).toString("utf8"));
const groups = {};
const seen = new Set();
for (const job of pool) {
  // 한 회사가 같은 연봉 범위로 여러 공고를 내면 한 건으로 센다.
  const dup = `${job.company}|${job.salary}`;
  if (seen.has(dup)) continue;
  seen.add(dup);
  const salary = job.salary && parseSalary(job.salary);
  const title = job.title.toLowerCase();
  const role = roles.find(([, re]) => re.test(title))?.[0];
  const lv = level(title);
  if (!salary || !role || !lv || !usdPer[salary.currency] || job.country === "?") continue;
  (groups[`${job.country}|${role}|${lv}`] ??= []).push(salary.mid * usdPer[salary.currency]);
}
const salaries = Object.fromEntries(Object.entries(groups).filter(([, v]) => v.length >= 3).sort().map(([key, values]) => {
  const sorted = values.sort((a, b) => a - b);
  return [key, { n: sorted.length, p25: Math.round(quantile(sorted, 0.25)), median: Math.round(quantile(sorted, 0.5)), p75: Math.round(quantile(sorted, 0.75)) }];
}));

const out = {
  sources: { bigMac: `The Economist Big Mac index ${latest} (${bigMacUrl})`, salaries: "jobs_pool.json.gz 공고에 적힌 연봉 범위의 중간값, USD 연봉 환산. 대부분 미국 테크 기업 공고라 시장 평균이 아니다." },
  // 앱이 같은 규칙으로 공고 제목을 분류하도록 패턴 원문을 함께 저장한다.
  rules: { roles: roles.map(([name, re]) => [name, re.source]), levels: Object.fromEntries(Object.entries(levels).map(([name, re]) => [name, re.source])) },
  countries,
  salaries,
};
writeFileSync(path.join(root, "src/data/jobs/benchmarks.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`국가 ${Object.keys(countries).length}개 · 연봉 그룹 ${Object.keys(salaries).length}개 (빅맥 ${latest})`);
