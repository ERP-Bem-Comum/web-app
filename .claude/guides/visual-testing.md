# Guia de Testes de Regressão Visual (web-app)

> **Versão adaptada à infra real deste repo.** O guia genérico de Playwright assume `pnpm dev` +
> `localhost:3000`. **Aqui não funciona** para telas autenticadas: o cookie de sessão é `__Host-session`
> (prefixo exige `Secure`/HTTPS), então a suíte roda contra a **stack completa** atrás do Caddy
> (`https://app.localhost`), reusando o `login()` helper. Isso é mais forte: testa o shell/dashboard
> **autenticados** de verdade, não só o login.

## Objetivo

Pegar mudanças visuais **não intencionais** em telas/componentes. Playwright `toHaveScreenshot()` compara
pixel a pixel contra um baseline `.png` versionado. Mudou sem querer → o teste falha com um diff. Mudou de
propósito → você atualiza o baseline (com revisão).

## Como funciona aqui

- Testes em **`e2e/visual/*.e2e.ts`** (o `testMatch` do projeto é `**/*.e2e.ts`; `testDir: ./e2e`).
- Baselines em `e2e/visual/<arquivo>.e2e.ts-snapshots/<nome>-chromium-<os>.png` — **commitados no git**.
- Config já pronta em `playwright.config.ts` (`expect.toHaveScreenshot`: `maxDiffPixelRatio 0.01`,
  `animations: 'disabled'`). `baseURL = https://app.localhost`, `ignoreHTTPSErrors` (cert do Caddy).

## Pré-requisito: a stack de pé

Diferente do guia genérico (que sobe `pnpm dev`), aqui **não há `webServer`** — você sobe a stack:

```bash
cd ../ERP-INFRA/local && ./up.sh        # mysql + core-api + web + caddy (healthy)
# (após mexer no front, rebuilde o web: docker compose build web && docker compose up -d --wait)
```

O `global-setup.ts` prepara os usuários de teste (admin seedado + `disabled` via MySQL). Credenciais em
`e2e/fixtures/users.ts` (`USERS.valid` = `admin@bemcomum.dev`).

## Escrevendo um teste visual

**Tela pública** (login): use `gotoLogin()` (espera a hidratação). **Tela autenticada** (shell): use
`login(page, USERS.valid)` — ele faz o login real e fica numa rota autenticada. Sempre aguarde
`document.fonts.ready` antes do screenshot (fontes self-host via @fontsource).

```ts
import { test, expect } from '@playwright/test'
import { login } from '../auth/login.helpers.ts'
import { USERS } from '../fixtures/users.ts'

test('shell em /dashboard', async ({ page }) => {
  await login(page, USERS.valid)
  await page.goto('/dashboard')
  await page.waitForLoadState('networkidle')
  await page.evaluate(async () => { await document.fonts.ready })
  await expect(page).toHaveScreenshot('shell-dashboard.png', { fullPage: true })
})
```

**Dicas de estabilidade:** screenshot de elemento (`page.locator(...).toHaveScreenshot()`) quando só o
componente importa; `mask: [page.locator(...)]` para esconder conteúdo dinâmico (datas, contadores);
`animations: 'disabled'` (já global) congela transições.

## Scripts

```bash
pnpm test:visual           # roda os visuais e compara com o baseline
pnpm test:visual:update    # (re)gera os baselines — SÓ após revisão humana do diff
pnpm test:visual:ui        # modo interativo (debug do diff)
```

## ⚠️ Baselines e o sistema operacional (a regra de ouro)

Screenshots **diferem por OS** (renderização de fonte/subpixel). Os nomes incluem o OS
(`...-chromium-darwin.png` vs `...-chromium-linux.png`), então os dois coexistem no repo.

**Política deste repo (decidida 2026-06-07):**

- **Baseline OFICIAL = `-linux`** (versionado, é o que o CI e os outros devs comparam). Gere no container
  oficial do Playwright (Linux). **Receita validada (2026-06-07, macOS Docker Desktop):**

  ```bash
  # 1) Rebuilde o web se mexeu no front (a rota/tela tem que existir no build de produção):
  #    cd ../ERP-INFRA/local && docker compose build web && docker compose up -d --wait web
  # 2) Gere no container, conectado à REDE do compose (erp-net):
  CADDY_IP=$(docker inspect erp-caddy --format '{{(index .NetworkSettings.Networks "erp-net").IPAddress}}')
  docker run --rm --ipc=host \
    --network erp-net \
    -e "E2E_HOST_RESOLVER_RULES=MAP app.localhost $CADDY_IP" \
    -e E2E_SKIP_GLOBAL_SETUP=1 \
    -v "$(pwd):/app" -v pw_node_modules:/app/node_modules \
    -w /app \
    mcr.microsoft.com/playwright:v1.60.0-noble \
    /bin/sh -c "corepack enable && pnpm install --frozen-lockfile && \
      pnpm exec playwright test e2e/visual/<arquivo>.e2e.ts --update-snapshots"
  ```

  **Por que cada flag (aprendido na marra):**
  - `--network erp-net` — o container precisa enxergar o Caddy; `--add-host host-gateway` **NÃO funciona**
    aqui. Descubra a rede com `docker inspect erp-caddy` (alias do Caddy: `caddy`).
  - `E2E_HOST_RESOLVER_RULES=MAP app.localhost <IP_DO_CADDY>` — o **Chromium resolve `.localhost` sempre
    para `127.0.0.1`** (RFC 6761), ignorando `/etc/hosts`/`--add-host`. Sem isso → `ERR_CONNECTION_REFUSED`.
    Mantenha a URL/SNI = `app.localhost` (o cert `tls internal` é desse host). O config lê essa env.
  - `E2E_SKIP_GLOBAL_SETUP=1` — o `global-setup` usa `docker compose exec mysql`, que não existe no
    container. Suites de **rota pública** (ex.: `/showcase/organisms`) não precisam de usuários. O config
    pula o setup com essa env. **Suites autenticadas** precisam do setup → não use essa env (e o
    `docker compose exec` exigiria o socket do Docker no container).
  - `-v pw_node_modules:/app/node_modules` — volume nomeado: protege o `node_modules` do macOS (binários
    diferentes) e acelera re-runs.
  - Prefira `playwright test <arquivo> --update-snapshots` (só a suíte alvo) a `test:visual:update` (todas).
  > No Linux/CI puro, `--network host` costuma bastar (o `127.0.0.1` do container = host com a stack).

- **`-darwin` (local) = feedback rápido.** Rode `pnpm test:visual:update` direto no Mac pra iterar; **mas
  o que vale no CI/PR é o `-linux`.** Evite commitar `-darwin` desatualizado (ou ignore-os se preferir).

> **Regra:** baseline gerado num ambiente, comparado **no mesmo ambiente**. Misturar OS = falso-positivo.

## Workflow com IA (Claude/Kimi)

- Mudança visual **não intencional** → `pnpm test:visual` falha → o relatório HTML mostra o diff em
  vermelho → **reverter/corrigir**, NUNCA atualizar o baseline sem revisão.
- Mudança visual **intencional e aprovada** → revisar o diff → regenerar o baseline `-linux` (Docker) →
  **commitar os `.png` junto com o código**.

A regra automática para os agentes está no **`AGENTS.md`** (seção "Testes visuais").

## Referências

- [Playwright — Visual Comparisons](https://playwright.dev/docs/test-snapshots) ·
  [`toHaveScreenshot`](https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-screenshot-1) ·
  [Docker](https://playwright.dev/docs/docker) · [CI](https://playwright.dev/docs/ci)
- Infra E2E deste repo: `e2e/README.md`, `e2e/auth/login.helpers.ts`, `e2e/global-setup.ts`.
