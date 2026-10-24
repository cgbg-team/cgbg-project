import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  forbidOnly: !!process.env.CI,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node --experimental-strip-types tests/fixtures/anthropic-server.mjs",
      url: "http://127.0.0.1:4312/health",
      reuseExistingServer: false,
    },
    {
      command: "npm run build --workspace=@cgbg/onboarding && npm run start --workspace=@cgbg/onboarding -- --hostname 127.0.0.1 --port 3100",
      url: "http://127.0.0.1:3100",
      reuseExistingServer: false,
      timeout: 180_000,
    },
    {
      command: "npm run build --workspace=@cgbg/interviews && npm run start --workspace=@cgbg/interviews -- --hostname 127.0.0.1 --port 3101",
      url: "http://127.0.0.1:3101",
      env: {
        ANTHROPIC_API_KEY: "test-only-key",
        ANTHROPIC_BASE_URL: "http://127.0.0.1:4312",
        INTERVIEW_SESSION_SECRET: "test-only-session-secret-at-least-32-characters",
        WORKFLOW_LOCAL_DATA_DIR: ".workflow-test-data",
        WORKFLOW_LOCAL_BASE_URL: "http://127.0.0.1:3101",
        WORKFLOW_LOCAL_RECOVER_ACTIVE_RUNS: "false",
      },
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
});
