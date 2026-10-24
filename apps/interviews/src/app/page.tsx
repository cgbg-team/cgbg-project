import { InterviewDashboard } from "@/components/interview-dashboard";
import { configurationReady } from "@/lib/access";
import { loadDemoCandidate } from "@/lib/fixtures";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ run?: string }>;
}) {
  const candidate = await loadDemoCandidate();
  const params = await searchParams;
  return (
    <InterviewDashboard
      profile={candidate.publicProfile}
      ready={configurationReady()}
      initialRun={params.run}
    />
  );
}
