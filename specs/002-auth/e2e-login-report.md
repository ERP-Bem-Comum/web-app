# Relatório de Execução — Suíte E2E de Login

**Projeto:** ERP Bem Comum — Frontend v2
**Data/hora do run:** 01/06/2026, 14:49 (-03) · relatório gerado 01/06/2026 17:30 (-03)
**Comando:** `pnpm test:e2e` (Playwright)
**Browser:** Chromium · 2 workers
**Matriz de cobertura:** `specs/002-auth/e2e-login-coverage.md` *(referenciada pelos testes; ainda não versionada — ver §6)*

---

## 1. Resultado geral

| Métrica | Valor |
|---|---|
| **Status** | ✅ **PASSOU** |
| Testes executados | **16** |
| Aprovados | **16** |
| Falhas | **0** |
| Flaky / pulados | **0** |
| Duração total | **22,8s** |

Run confirmado ao vivo (não é o resultado em cache anterior). Corroborado por `test-results/.last-run.json` → `"status": "passed"`.

---

## 2. Ambiente

Executado contra a **stack real** atrás de Caddy/HTTPS (`https://app.localhost`), não contra mocks:

| Container | Estado |
|---|---|
| `bemcomum-caddy` | Up 15h (proxy HTTPS :443) |
| `bemcomum-core-api` | Up 15h **healthy** (backend, exposto em :3001) |
| `bemcomum-mysql` | Up 2h **healthy** (db `core`) |
| `bemcomum-web` | Up 5h **healthy** (BFF + front) |

**Preparação (globalSetup):** o usuário `valid` (admin) já vem seedado pelo serviço `core-api-seed`. O usuário `disabled` é preparado de forma idempotente: registro via core-api (`/auth/register`, aceitando 201 ou 409) seguido de `UPDATE auth_user SET status='disabled', disabled_at=NOW(3)` direto no MySQL — necessário porque o backend modela o estado `disabled` mas não expõe rota de transição. Log do setup: `[e2e:setup] usuário disabled pronto: disabled@e2e.local`. ✓

---

## 3. Casos felizes (H1–H6) — todos ✅

| ID | O que valida | Duração |
|---|---|---|
| **H1** | Credenciais válidas (sem "lembrar") autenticam, saem da `/login`, caem no fallback `/` (Home renderiza "Bem Comum") e o botão de submit some. | 3,6s |
| **H2** | "Lembrar este dispositivo" cria **sessão persistente**: cookie `__Host-session` com `expires` futuro, `secure=true`, `path=/` (atributos do prefixo `__Host-`). | 3,0s |
| **H3** | `?redirect=/dashboard` leva ao destino correto após autenticar (heading "Dashboard" visível). | 3,0s |
| **H4** | Usuário **já autenticado** que visita `/login` é redirecionado para fora pelo `beforeLoad` — o formulário não chega a renderizar. | 2,4s |
| **H5** | 🔒 **Token NUNCA chega ao browser.** Cookie `__Host-session` é opaco e `httpOnly`; nenhum cookie (nome ou valor) e nenhuma entrada de `localStorage`/`sessionStorage` casa com `accessToken`/`refreshToken`/`Bearer `/JWT (`^eyJ`). Cobre Princípio I / ADR-0005 / SC-002. | 2,2s |
| **H6** | Guard de rota: acessar `/dashboard` **sem sessão** redireciona para `/login` preservando o destino em `?redirect=` (US2 / FR-004). | 887ms |

---

## 4. Casos tristes (S1–S8) — todos ✅

Os textos asseridos vêm do catálogo i18n pt-BR (`src/shared/i18n/catalog.pt-BR.ts`) — **a UI nunca expõe status HTTP**.

| ID | O que valida | Duração |
|---|---|---|
| **S1** | Senha errada → erro genérico `"E-mail ou senha inválidos."`, permanece em `/login`. | 3,6s |
| **S2** | 🔒 **Anti-enumeração:** e-mail inexistente mostra **exatamente o mesmo** erro de S1 (não revela se a conta existe). | 2,4s |
| **S3** | Conta **desabilitada** com senha correta → mensagem específica `"Sua conta está desativada. Procure o administrador."` | 3,2s |
| **S4** | E-mail com formato inválido (`semarroba`) → submit **bloqueado no client**. | 2,5s |
| **S5** | E-mail vazio → submit bloqueado no client. | 2,0s |
| **S6** | Senha vazia → submit bloqueado no client. | 2,4s |
| **S7** | 🔒 **Anti open-redirect** (3 variações): `//evil.com`, `https://evil.com`, `https://evil.com/phish`. O `safeRedirect` descarta o destino externo e cai no fallback `/` — nunca navega para host externo. | ~1,2s cada |
| **S8** | Durante o submit o botão entra em **estado de carregamento**: `disabled` + `aria-busy="true"` (resposta do BFF atrasada em 1,5s para tornar o estado observável). | 1,3s |

---

## 5. Leitura para o Tech Lead

- **Segurança comprovada end-to-end pelos invariantes do projeto:** isolamento do token (H5), anti-enumeração (S2), anti open-redirect (S7) e atributos `__Host-`/`httpOnly` do cookie de sessão (H2/H5). Esses são exatamente os pontos cobrados pela constituição (Princípio I) e pelo ADR-0005.
- **Acessibilidade no loop de feedback:** S8 valida `aria-busy` no estado transitório — não só o visual.
- **Cobertura honesta:** roda contra core-api + MySQL reais via Caddy/HTTPS, então o verde aqui reflete o comportamento de produção, não um mock.

**Conclusão:** a suíte E2E do login está **100% verde** e a feature de autenticação está validada de ponta a ponta no ambiente real.

---

## 6. Observações / follow-ups

- A pasta `specs/` não existia neste checkout; foi criada para abrigar este relatório.
- Os arquivos de teste (`e2e/auth/login.happy.e2e.ts` e `login.sad.e2e.ts`) referenciam a matriz `specs/002-auth/e2e-login-coverage.md`, que **não está versionada**. Vale criá-la (ou ajustar a referência) para a documentação ficar consistente.
- O relatório HTML interativo do Playwright (com trace/screenshots por teste) está em `playwright-report/index.html` — não versionado.
