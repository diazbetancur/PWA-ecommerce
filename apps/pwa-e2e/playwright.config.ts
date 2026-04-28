import { workspaceRoot } from '@nx/devkit';
import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env['PLAYWRIGHT_PORT'] || '4200');
const baseURL = process.env['BASE_URL'] || `http://localhost:${port}`;

export default defineConfig({
  testDir: './src',
  testMatch: /.*\.(spec|e2e)\.ts/,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `npx nx run ecommerce:serve-static --buildTarget=ecommerce:build:dev --port=${port}`,
    url: baseURL,
    reuseExistingServer: true,
    cwd: workspaceRoot,
    timeout: 180000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
