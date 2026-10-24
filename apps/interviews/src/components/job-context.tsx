import bigMac from "@/data/big-mac-prices.json";
import { countryLabel } from "@/lib/job-countries";
import type { Job } from "@/lib/types";

export function jobLocation(job: Pick<Job, "location" | "country">) {
  const country = job.country ? countryLabel(job.country) : "국가 미기재";
  const places = job.location.split(";").map(place => place.trim()).filter(Boolean);
  const first = places[0]?.split(",")[0].trim() ?? "";
  const remote = /\bremote\b|원격/i.test(first);
  const region = /^[A-Z]{2}$/.test(job.country) ? (job.country === "UK" ? "GB" : job.country) : undefined;
  const englishCountry = region ? new Intl.DisplayNames(["en"], { type: "region" }).of(region) : undefined;
  const countryOnly = [job.country, country, englishCountry, ...(job.country === "US" ? ["USA"] : [])].some(value => value && value.toLowerCase() === first.toLowerCase());
  const city = remote ? "원격" : !first || countryOnly ? "도시 미기재" : first;
  return `${city}${places.length > 1 ? ` 외 ${places.length - 1}곳` : ""}, ${country}`;
}

export function JobContext({ job }: { job: Job }) {
  const code = job.country === "GB" ? "UK" : job.country;
  const countries: Record<string, { date: string; usd: number }> = bigMac.countries;
  const prices = Object.hasOwn(countries, code) ? countries[code] : undefined;
  return <div className="job-economic-context">
      <span>{job.salary ? `공고 연봉 ${job.salary}` : "공고 연봉 미기재"}</span>
      {prices && <a href={bigMac.source} target="_blank" rel="noopener noreferrer" title={`The Economist · ${prices.date} 기준 국가별 빅맥 지수의 미국 달러 환산 가격. 현지 대체 제품이 포함될 수 있으며 도시·매장별 가격과 다릅니다.`}>🍔 빅맥 가격: ${prices.usd.toFixed(2)}</a>}
    </div>;
}
