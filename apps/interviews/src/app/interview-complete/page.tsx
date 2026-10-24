import { InterviewComplete } from "@/components/interview-complete";

export default async function Page({ searchParams }: { searchParams: Promise<{ run?: string; job?: string; company?: string }> }) {
  const params = await searchParams;
  return <InterviewComplete runId={params.run ?? ""} jobId={params.job ?? ""} company={params.company ?? "선택한 기업"} />;
}
