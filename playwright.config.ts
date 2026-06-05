/**
 * Playwright — suíte E2E do login (front + BFF + core-api reais, atrás do Caddy/HTTPS).
 *
 * Topologia: `docker compose up -d` sobe mysql + core-api + web + caddy. O browser fala com
 * `https://app.localhost` (Caddy). HTTPS é OBRIGATÓRIO: o cookie de sessão é `__Host-session`
 * (prefixo exige Secure), então em HTTP puro o login não persiste sessão. `ignoreHTTPSErrors`
 * aceita o cert local do Caddy.
 *
 * Globs disjuntos dos runners do app: aqui `e2e/**\/*.e2e.ts` — node:test usa `tests/**\/*.test.ts`
 * e Vitest `tests/**\/*.spec.ts(x)`. Sem sobreposição.
 */
import { defineConfig, devices } from '@playwright/test'

const BASE_URL = process.env['E2E_BASE_URL'] ?? 'https://app.localhost'

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  globalSetup: './e2e/global-setup.ts',

  // CI: sem .only, mais retries; local: falha rápido.
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 2 : 0,
  reporter: process.env['CI']
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    ignoreHTTPSErrors: true, // cert local do Caddy
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
