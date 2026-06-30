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

// Dentro de um container (gerar baseline `-linux`), o Chromium resolve o TLD `.localhost` SEMPRE para
// 127.0.0.1 (RFC 6761), ignorando /etc/hosts e --add-host — então não alcança o Caddy na rede do
// compose. `E2E_HOST_RESOLVER_RULES` (ex.: "MAP app.localhost 172.20.0.6") sobrescreve a resolução do
// Chromium, mantendo a URL/SNI = app.localhost (necessário para o cert `tls internal`). No host (Mac),
// não é setada e nada muda. Ver .claude/guides/visual-testing.md.
const HOST_RESOLVER_RULES = process.env['E2E_HOST_RESOLVER_RULES']

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  // O globalSetup prepara usuários de teste via core-api + `docker compose exec` (MySQL) — só faz
  // sentido para suites AUTENTICADAS. Suites de telas/rotas PÚBLICAS (ex.: regressão visual de
  // organismos em /showcase/organisms) não precisam disso e podem rodar num container Playwright puro
  // (sem docker socket). `E2E_SKIP_GLOBAL_SETUP=1` pula o setup nesses casos. Default: mantém o setup.
  globalSetup: process.env['E2E_SKIP_GLOBAL_SETUP'] === '1' ? undefined : './e2e/global-setup.ts',

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

  // Regressão visual (e2e/visual/*.e2e.ts): tolerância mínima p/ antialiasing; animações desligadas
  // p/ snapshots determinísticos. Baselines OFICIAIS são `-linux` (Docker/CI); `-darwin` é feedback
  // local. Ver .claude/guides/visual-testing.md.
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    },
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(HOST_RESOLVER_RULES
          ? { launchOptions: { args: [`--host-resolver-rules=${HOST_RESOLVER_RULES}`] } }
          : {}),
      },
    },
  ],
})
