import path from "node:path";
import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
  agentRules: false,
  outputFileTracingRoot: path.join(__dirname, "../.."),
  outputFileTracingIncludes: { "/*": ["./src/data/demo/candidate/public/*.md", "./src/data/jobs/jobs_pool.json.gz"] },
  turbopack: {
    root: path.join(__dirname, "../.."),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withWorkflow(nextConfig);
