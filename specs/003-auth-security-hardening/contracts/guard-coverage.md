# Contract: Guard Coverage (sem rota autenticada órfã)

**Objetivo**: garantir que **nenhuma rota de conteúdo** exista fora do layout protegido `_authenticated/` sem ser explicitamente pública. Fecha o vetor de *forced browsing* por rota nova sem guard (FR-008/FR-010, OWASP cap. 3).

---

## Regra

- **Rotas públicas (allowlist explícita)**: `/` (`index.tsx`), `/login` (`login.tsx`), `/health` (`health.tsx`).
- **Parent protegido**: `/_authenticated` (`_authenticated/route.tsx`) — `beforeLoad` resolve sessão; sem sessão → `redirect('/login', { search: { redirect } })`.
- **Invariante**: todo arquivo de rota em `src/routes/` que renderiza conteúdo e **não** está na allowlist DEVE estar sob `src/routes/_authenticated/`.

## Server functions

- Toda server function **autenticada** resolve sessão via `session.guard` (cookie → store → token), retornando `auth:expired` quando ausente — **independente do verbo HTTP**.
- Server functions de **mutação** validam origem (`isSameOriginRequest`) antes de qualquer efeito.

## Critérios de aceite

1. Acessar `/_authenticated/*` sem cookie → `302/redirect` para `/login?redirect=<destino>` (destino preservado e saneado por `safeRedirect`).
2. Acessar com sessão válida → conteúdo renderiza.
3. Chamar server fn autenticada sem sessão (GET **ou** POST) → `auth:expired`, sem vazar dados.
4. Criar um arquivo de rota fora da allowlist e fora de `_authenticated/` → **o teste de cobertura falha**.

## Teste automatizado

`tests/routes/guard-coverage.test.ts` (node:test):
- varre `src/routes/` (lista de arquivos), aplica a allowlist, e **falha** se houver rota de conteúdo fora de `_authenticated/`.
- documenta a allowlist no próprio teste — adicionar rota pública exige editar a allowlist (decisão consciente).
