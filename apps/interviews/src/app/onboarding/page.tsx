"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { OwnOnboarding } from "@/components/own-onboarding";
import { storeOnboardingCandidate } from "@/lib/onboarding-handoff";

export default function OnboardingPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  return (
    <>
      <OwnOnboarding
        onBack={() => router.push("/")}
        onPrepared={(candidate) => {
          if (storeOnboardingCandidate(candidate)) router.push("/?from=onboarding");
          else setError("프로필을 넘기지 못했습니다. 브라우저 저장 설정을 확인해주세요.");
        }}
      />
      {error && <p role="alert">{error}</p>}
    </>
  );
}
