import summary from "../data/jobs/summary.json";

export { summary as jobSummary };
const names = new Intl.DisplayNames(["ko"], { type: "region" });
export function countryLabel(country: string) {
  if (!country) return "전체 국가";
  if (country === "?") return "국가 미상";
  if (country === "AU") return "호주";
  return names.of(country === "UK" ? "GB" : country) ?? country;
}
