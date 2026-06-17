# E2E — Playwright

Suíte de testes ponta a ponta da v2. Exercita o fluxo **real**: browser → SSR → server function (BFF)
→ core-api → cookie `__Host-session` → navegação. Hoje cobre o **login** (a primeira camada).

> Matriz de cobertura (casos felizes/tristes + o que fica fora) vive em
> [`specs/002-auth/e2e-login-coverage.md`](../specs/002-auth/e2e-login-coverage.md).

## Topologia

```
Playwright (Chromium) ──HTTPS──► Caddy ──► web (front+BFF) ──► core-api ──► mysql
                                 https://app.localhost
```

**Por que HTTPS (`app.localhost`) e não `localhost:3000`:** o cookie de sessão é `__Host-session`,
cujo prefixo **exige `Secure` + HTTPS**. Em HTTP puro o login não persistiria sessão. Rodar atrás do
Caddy também exercita CSP e SSR reais. O Playwright usa `ignoreHTTPSErrors: true` (cert local do Caddy).

## Pré-requisitos

1. **Stack de pé** (sobe mysql + core-api + seed + web + caddy):
   ```bash
   docker compose up -d        # aguarde os healthchecks ficarem healthy
   ```
   O serviço `core-api-seed` registra o usuário válido `admin@bemcomum.dev` (idempotente).
2. **Browser do Playwright** (só na 1ª vez — ~150 MB, baixado do CDN da Microsoft, fora do pnpm):
   ```bash
   pnpm exec playwright install chromium
   ```

## Rodar

```bash
pnpm test:e2e                 # roda toda a suíte (headless)
pnpm test:e2e --ui           # modo interativo (debug visual)
pnpm test:e2e --headed       # vê o browser
pnpm exec playwright show-report   # relatório HTML da última execução
```

## Seed dos usuários de teste

| Usuário                                   | Estado           | Como é preparado                                                  |
| ----------------------------------------- | ---------------- | ----------------------------------------------------------------- |
| `admin@bemcomum.dev` / `DevPassw0rd!2027` | válido           | serviço `core-api-seed` do `docker-compose.yml` (via `/register`) |
| `disabled@e2e.local` / `DevPassw0rd!2027` | **desabilitado** | `global-setup.ts`: `/register` + `UPDATE` no MySQL                |

**Por que o `disabled` precisa de `UPDATE` no MySQL:** o domínio do core-api modela
`status='disabled'` + `disabled_at`, mas **não expõe transição** (não há use-case nem rota para
desativar, e o seed só cria contas `active`). O `global-setup.ts` registra o usuário e roda:

```sql
UPDATE auth_user SET status='disabled', disabled_at=NOW(3), updated_at=NOW(3) WHERE email='disabled@e2e.local';
```

via `docker compose exec -T mysql …`. As duas colunas são setadas **juntas** — há um CHECK
bicondicional (`auth_user_disabled_consistency_chk`); setar só uma viola a constraint.

## Variáveis de ambiente (opcionais)

Defaults batem com o `docker-compose.yml`; sobrescreva só se mudar a stack.

| Var                                        | Default                        | Uso                                                            |
| ------------------------------------------ | ------------------------------ | -------------------------------------------------------------- |
| `E2E_BASE_URL`                             | `https://app.localhost`        | URL do app (browser)                                           |
| `E2E_CORE_API_URL`                         | `http://localhost:3001/api/v2` | core-api para o `register` do seed (exposto pelo override dev) |
| `MYSQL_ROOT_PASSWORD`                      | `rootdev`                      | root do MySQL para o `UPDATE` do disabled                      |
| `E2E_MYSQL_SERVICE` / `E2E_MYSQL_DATABASE` | `mysql` / `core`               | serviço/DB no `docker compose exec`                            |

## Convenções

- **Localização:** `e2e/` (fora de `tests/`). Arquivos de teste terminam em **`*.e2e.ts`** — glob
  disjunto dos runners do app (`tests/**/*.test.ts` no node:test; `tests/**/*.spec.ts(x)` no Vitest).
- **Fora dos boundaries do app:** `e2e/` é ignorado pelo ESLint do app e tem `tsconfig` próprio
  (`e2e/tsconfig.json`); a validação estática vem do próprio Playwright em runtime.
- Helpers e fixtures (`*.helpers.ts`, `fixtures/`) não casam o glob `*.e2e.ts` → não viram testes.

## Notas

- **Logout:** ainda **não há UI de logout** (a `/dashboard` é um stub). O caso H6 cobre o **guard**
  (rota protegida sem sessão → `/login?redirect=`). Quando existir botão de logout, adicionar o caso.
- **Infra (timeout/5xx/connectivity):** fora do E2E por design — o browser não força falha de uma
  chamada server-side (BFF→core-api). Já coberto por unit em
  `tests/modules/auth/server/adapters/core-api-auth-client.test.ts`.
- **Rate-limit** do core-api é global (200/min/IP); a suíte é pequena, sem risco de colisão.
