import "server-only";

import { createClient } from "../supabase/server";
import type { CandidateFolder } from "./build";

// 확정 프로필을 Supabase에 저장한다. 테이블은 insert만 허용하므로 결과 행은 읽지 않는다.
export async function saveCandidate(folder: CandidateFolder): Promise<boolean> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return false;
  try {
    const supabase = await createClient();
    const { manifest, files } = folder;
    const { error } = await supabase.from("candidate_profiles").insert({
      candidate_id: manifest.publicProfile.candidateId,
      confirmed_at: manifest.confirmed_at,
      public_profile: manifest.publicProfile,
      private_profile: manifest.privateProfile,
      files,
    });
    if (error) console.error("candidate_profiles insert failed", error.message);
    return !error;
  } catch (error) {
    console.error("candidate_profiles insert failed", error);
    return false;
  }
}
