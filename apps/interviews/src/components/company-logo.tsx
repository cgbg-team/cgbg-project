"use client";

import { useState } from "react";
import Image from "next/image";
import companyDomains from "@/data/company-domains.json";

export function CompanyLogo({ company }: { company: string }) {
  const domains: Record<string, string> = companyDomains;
  const key = company.trim().toLowerCase();
  const domain = Object.hasOwn(domains, key) ? domains[key] : undefined;
  const [failedDomain, setFailedDomain] = useState<string>();
  // shortcut: 등록한 기업만 표시하며 새 기업은 공식 도메인과 정적 아이콘을 함께 추가합니다.
  return <span className="company-emblem">
    {domain && failedDomain !== domain ? <Image src={`/company-logos/${domain}.png`} alt={`${company} 로고`} width={36} height={36} unoptimized onError={() => setFailedDomain(domain)} /> : <span aria-hidden="true">{company.slice(0, 1).toUpperCase()}</span>}
  </span>;
}
