import { expect, test, vi } from "vitest";
import { getSupabaseEnv } from "@cgbg/shared/supabase/env";

test.each(["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"])(
  "%s 누락 시 설정 오류를 알린다",
  (name) => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_example");
    vi.stubEnv(name, "");
    expect(() => getSupabaseEnv()).toThrow("설정하세요");
  },
);

test("설정한 Supabase 공개 환경변수를 반환한다", () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_example");
  expect(getSupabaseEnv()).toEqual({
    url: "https://example.supabase.co",
    key: "sb_publishable_example",
  });
});
