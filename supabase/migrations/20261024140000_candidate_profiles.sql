-- 온보딩에서 확정한 구직자 프로필. 브라우저 공개 키로는 저장만 가능하고 읽을 수 없다.
create table if not exists public.candidate_profiles (
  candidate_id text primary key,
  confirmed_at timestamptz not null,
  public_profile jsonb not null,
  private_profile jsonb not null,
  files jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.candidate_profiles enable row level security;

drop policy if exists "onboarding can insert candidate profiles" on public.candidate_profiles;
create policy "onboarding can insert candidate profiles"
  on public.candidate_profiles
  for insert
  to anon, authenticated
  with check (true);
-- select·update·delete 정책은 두지 않는다. 비공개 프로필(최저 연봉 등)은 서비스 키로만 읽는다.
