import type { PublicProfile } from "@cgbg/shared/profile";
import type { Keyword } from "./types";

export function enrichSearchKeywords(profile: PublicProfile, extracted: Keyword[]): Keyword[] {
  const coreSkills = profile.skills.map(skill => skill.name.split(" / ")[0].trim())
    .filter(term => term.length >= 2 && term.length <= 60 && term.split(/\s+/).length <= 3)
    .slice(0, 3).map<Keyword>(term => ({ term, source: "skills", track: "primary" }));
  const activities = profile.transferableStrengths.filter(item => item.evidence.some(evidence => evidence.quote || evidence.docPath)).map(item => item.strength).join(" ").toLowerCase();
  const interests = profile.wants.interests.join(" ").toLowerCase();
  const exploration: Keyword[] = [];
  function add(term: string, basis: "evidence" | "interest", hypothesis: string) {
    exploration.push({ term, source: basis === "evidence" ? "transferableStrengths" : "wants", track: "exploration", basis, hypothesis });
  }
  // 모델이 희귀한 직업명만 제안해 재현율이 떨어지는 경우에도, 명시된 프로필 근거만으로 직업명 표현을 보완한다.
  if (/community|커뮤니티/.test(activities)) add("community manager", "evidence", "커뮤니티 운영 활동에서 제안한 전환 가설");
  if (/educat|teach|writ|content|교육|강의|콘텐츠/.test(activities)) {
    for (const term of ["technical writer", "instructor", "content creator"]) add(term, "evidence", "교육·콘텐츠 제작 활동에서 제안한 전환 가설");
  }
  if (/coffee|커피/.test(interests)) add("barista", "interest", "커피 관심사 기반·직무 적합성 확인 필요");
  if (/music|음악/.test(interests)) add("music instructor", "interest", "음악 관심사 기반·교육 역량 확인 필요");
  return [...new Map([...exploration, ...extracted, ...coreSkills].map(keyword => [keyword.term.trim().toLowerCase(), keyword])).values()];
}
