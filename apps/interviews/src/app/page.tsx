import { cookies } from "next/headers";
import { InterviewDashboard } from "@/components/interview-dashboard";
import { configurationReady, sessionCookie, sessionRun } from "@/lib/access";
import { loadDemoCandidate } from "@/lib/fixtures";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ run?: string }>;
}) {
  const candidate = await loadDemoCandidate();
  const params = await searchParams;
  const current = sessionRun((await cookies()).get(sessionCookie)?.value);
  return (
    <InterviewDashboard
      profile={candidate.publicProfile}
      ready={configurationReady()}
      initialRun={params.run ?? current}
    />
  );
}
