# Cobertura E2E — Login

Matriz de comportamento do login exercitada pela suíte Playwright (`e2e/auth/`), contra a stack real
(browser → BFF → core-api → MySQL, atrás do Caddy/HTTPS). Como rodar: [`e2e/README.md`](../../e2e/README.md).

**Escopo:** todos os casos **observáveis pelo usuário** no fluxo de login. A UI nunca mostra status HTTP —
asserimos os textos do catálogo i18n (`src/shared/i18n/catalog.pt-BR.ts`). Os casos de **infra** (falha
server-side BFF→core-api) ficam fora por design (ver fim do doc).

## Usuários de teste

| Alias | Credenciais | Estado | Preparo |
|---|---|---|---|
| `valid` | `admin@bemcomum.dev` / `DevPassw0rd!2024` | ativo | seed do `docker-compose.yml` |
| `disabled` | `disabled@e2e.local` / `DevPassw0rd!2024` | desabilitado | `global-setup.ts` (`/register` + `UPDATE` MySQL) |
| `unknown` | `naoexiste@e2e.local` / … | inexistente | — (anti-enumeração) |

## Casos felizes — `e2e/auth/login.happy.e2e.ts`

| # | Caso | Ação | Resultado esperado |
|---|---|---|---|
| **H1** | Login válido | `valid`, sem "lembrar" | sai da `/login` → Home (`/`, fallback `safeRedirect`); form some |
| **H2** | Sessão persistente | `valid` + "lembrar" | cookie `__Host-session` com `expires` futuro, `Secure`, `path=/` |
| **H3** | Redirect pós-login | `?redirect=/dashboard`, `valid` | navega para `/dashboard` |
| **H4** | Guard (já logado) | logar, revisitar `/login` | redireciona p/ fora da `/login`; form não renderiza |
| **H5** | **Token nunca no browser** (SC-002) | logar, inspecionar | `__Host-session` opaco + `httpOnly`; nenhum `accessToken`/`refreshToken`/`Bearer`/JWT em cookies ou local/sessionStorage |
| **H6** | Guard sem sessão | `GET /dashboard` deslogado | redireciona p/ `/login?redirect=/dashboard` (destino preservado) |

## Casos tristes — `e2e/auth/login.sad.e2e.ts`

| # | Caso | Ação | Resultado esperado (tag i18n → texto) |
|---|---|---|---|
| **S1** | Senha errada | `valid` + senha errada | `auth.error.invalid-credentials` → "E-mail ou senha inválidos." em `role="alert"`; fica na `/login` |
| **S2** | E-mail inexistente | `unknown` | **mesma** mensagem de S1 (anti-enumeração — indistinguível) |
| **S3** | Conta desabilitada | `disabled` + senha correta | `auth.error.user-disabled` → "Sua conta está desativada. Procure o administrador." |
| **S4** | E-mail inválido | `semarroba` + senha | submit **bloqueado** no client (Zod): sem request de login, sem navegação, sem alerta/loading |
| **S5** | E-mail vazio | só senha | submit bloqueado (idem S4) |
| **S6** | Senha vazia | só e-mail | submit bloqueado (idem S4) |
| **S7** | **Anti open-redirect** | `?redirect=//evil.com`, `https://evil.com`, `https://evil.com/phish` + login válido | nunca sai do host do app; cai no fallback `/` (`safeRedirect`) |
| **S8** | Estado de carregamento | submit válido (resposta atrasada) | botão fica `disabled` + `aria-busy="true"` (loading) |

## Mapa erro do core-api → tag i18n (referência)

`invalid-credentials` (401) → `auth.error.invalid-credentials` · `user-disabled` (403) →
`auth.error.user-disabled` · `connectivity` → `auth.error.connectivity` · demais/5xx/refresh-* →
`auth.error.unexpected`. (Login colapsa e-mail malformado e senha fora de policy em
`invalid-credentials` — anti-enumeração no backend; o client ainda barra formato antes via Zod.)

## Fora de escopo do E2E (coberto por unit)

O browser **não** consegue forçar falha de uma chamada **server-side** (BFF → core-api). Estes casos são
cobertos por testes unitários e ficam **deliberadamente fora** da suíte E2E:

| Caso | Tag resultante | Coberto por |
|---|---|---|
| `connectivity` (rede fora / timeout) | `auth.error.connectivity` | `tests/modules/auth/server/adapters/core-api-auth-client.test.ts` |
| `server` (5xx / parse / aborted) | `auth.error.unexpected` | idem + `tests/.../core-api/map-to-server-response` |
| refresh-* (expired/revoked/rotated) | — (fluxo de sessão, não login) | `tests/modules/auth/server/refresh-flow.test.ts`, `refresh-session.test.ts` |
| rate-limit (429) | `auth.error.unexpected` | mapeamento HTTP em `core-api-auth.ts` (unit) |
| Mapeamento `AuthError` → tag | (todas) | `tests/modules/auth/client/data/auth-error-tag.test.ts`, `view-model/login-view.test.ts` |

## Pendências (futuro)

- **Logout via UI:** não há botão de logout ainda (a `/dashboard` é stub). Adicionar caso E2E de logout
  quando a UI existir; hoje o H6 cobre o guard de rota protegida.
- **`user-disabled` sem `UPDATE` SQL:** depende de o core-api expor um use-case/rota `disable-user` ou
  estender `AuthSeedUser` com `status`. Enquanto não houver, o seed via MySQL é o caminho (ver README).
