import { OnboardingForm } from "@/components/onboarding-form";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16">
      <p className="text-sm font-medium text-neutral-600">BEYOND CV</p>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">구직자 온보딩</h1>
      <OnboardingForm />
    </main>
  );
}
