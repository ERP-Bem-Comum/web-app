# Quickstart — Auth

## Pré-requisitos
- Fundação (spec 001) no lugar: `shared/` (Result, http, bus, i18n), `external/` (core-api, config), QueryClient.
- Backend acessível: `CORE_API_URL` (dev local: core-api exposto em `3001:3000` → `http://localhost:3001/api/v2`;
  ou dockerizado `http://core-api:3000/api/v2`).
- Credenciais de dev (semeadas): `admin@bemcomum.dev` / `DevPassw0rd!2024`.

## Rodar e validar (após implementação)
```bash
pnpm dev                      # /login disponível em http://localhost:3000/login
pnpm lint                     # boundaries (server/client) + MVVM + invariantes
pnpm typecheck
pnpm test                     # node:test (puro) + Vitest (DOM) — TDD
pnpm build
```

## Critérios de aceite verificáveis (mapeiam SC-001..008)
- [ ] Login com `admin@bemcomum.dev`/`DevPassw0rd!2024` → cria sessão + cookie `__Host-session`; redireciona a `/` (ou `?redirect`).
- [ ] **Inspeção do browser** (DevTools → Application/Network): cookie tem só id opaco; **nenhum** access/refresh token, segredo ou URL do backend (SC-002).
- [ ] Credencial inválida → mensagem genérica (tag i18n); conta desabilitada → tag própria; sem stack.
- [ ] Após 15 min (access expira), uma ação autenticada → **refresh silencioso** (sem novo login) (SC-003); requests concorrentes não quebram a sessão (single-flight).
- [ ] Rota protegida sem sessão → redireciona a `/login?redirect=<rota>`; pós-login volta ao destino; URL externa no `redirect` é ignorada (SC-004).
- [ ] Logout → cookie limpo + refresh revogado no backend; área protegida exige novo login (SC-005).
- [ ] `pnpm lint/typecheck/test/build` verdes (SC-007).
- [ ] Um dev/agente lê `modules/auth/README.md` e explica camadas + fluxo; replica o padrão sem erro de boundary (SC-008).

## Notas
- `/me` só devolve `{ userId }` — a UI mostra autenticado + userId; perfil rico é módulo futuro.
- Textos das mensagens (tags i18n) são **pendentes da P.O. @lekadecastro** — default genérico por ora.
