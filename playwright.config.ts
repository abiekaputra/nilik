/** Module responsible for configuring end-to-end operator validation. */

import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  use: { baseURL: "http://127.0.0.1:4610", trace: "retain-on-failure" },
  webServer: [
    {
      command: ".venv/bin/python -m nilik.cli.serve",
      url: "http://127.0.0.1:4600/api/health",
      reuseExistingServer: true,
    },
    {
      command: "pnpm --dir web dev",
      url: "http://127.0.0.1:4610",
      reuseExistingServer: true,
    },
  ],
});
