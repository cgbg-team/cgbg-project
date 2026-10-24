-- 실시간 공개 공고 API 검색 결과 캐시. 공개 공고만 담으므로 브라우저 공개 키로 읽고 쓴다.
-- 키 형식: "{source}|{검색어}|{국가}", jobs는 면접 앱 jobSchema 배열이다. 앱은 읽을 때 스키마와 출처 도메인을 다시 검증한다.
create table if not exists public.job_search_cache (
  key text primary key,
  jobs jsonb not null,
  fetched_at timestamptz not null default now()
);

alter table public.job_search_cache enable row level security;

drop policy if exists "anyone can read job search cache" on public.job_search_cache;
create policy "anyone can read job search cache"
  on public.job_search_cache for select
  to anon, authenticated
  using (true);

drop policy if exists "anyone can insert job search cache" on public.job_search_cache;
create policy "anyone can insert job search cache"
  on public.job_search_cache for insert
  to anon, authenticated
  with check (true);

drop policy if exists "anyone can refresh job search cache" on public.job_search_cache;
create policy "anyone can refresh job search cache"
  on public.job_search_cache for update
  to anon, authenticated
  using (true)
  with check (true);
