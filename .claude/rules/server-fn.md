---
paths:
  - "src/modules/*/server/adapters/**/*.ts"
---

# Regras — Server Functions (A ÚNICA FRONTEIRA)

Fonte: ADR-0010, ADR-0011; constituição §III, §V, §IX; `handbook/ARQUITETURA.md` §2 e §6.

## Invariantes

- **Uma `fn` completa por caso de uso (ADR-0010, §III):** o BFF **compõe e orquestra**; o client **não compõe**. Entrega a resposta pronta por caso de uso.
- **Nomenclatura (ADR-0010):** `*.query.fn.ts` (leitura) / `*.service.fn.ts` (escrita/comando). A fronteira física pode aparecer como `*.server-fn.ts`.
- **Zod na borda (§IX):** todo input é validado com `inputValidator` (schema Zod). Nada confia no client.
- **Auth no handler, não na rota (CRÍTICO):** um `beforeLoad`/route guard protege a **UI**, não o **RPC**. `createServerFn` é um endpoint chamável por POST direto — aplique `authMiddleware` ou cheque sessão **dentro do handler**.
- **`useServerFn` no client** quando a fn faz `throw redirect()`/`notFound()` (senão o redirect não navega).
- **Cadeia de erro (§V):** `mapToServerResponse` preserva o status; o erro trafega como **valor** até o `switch` exaustivo da UI. A UI nunca olha status HTTP.
- **Sem mocks em produção (ADR-0011):** use `not-implemented` como placeholder; fixtures só em `tests/` (governance test).

## Skills oficiais a carregar (delegar)

`load @tanstack/start-client-core#start-core/server-functions` · `#start-core/middleware` · `#start-core/auth-server-primitives` · `load @tanstack/router-core#router-core/auth-and-guards`.

> Em conflito, vence: ADR > constituição > este arquivo > `eslint.config.js`.
