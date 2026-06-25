---
paths:
  - "src/modules/*/server/**/*.ts"
---

# Regras — Camada Server (BFF · DDD)

Fonte: ADR-0002, ADR-0004, ADR-0010; constituição §II, §III, §IV; `handbook/ARQUITETURA.md` §3.
Feature-modelo: `src/modules/auth/server/`.

## Invariantes

- **DDD com split por concern:** `domain/` (PURO, sem I/O — VOs branded, agregados, erros-valor) → `application/` (use-cases: commands/queries, `Result`, sem `throw`) → `adapters/` (a fronteira: `*.server-fn.ts`, clients core-api, schemas Zod, guards).
- **Dependência aponta para dentro:** `domain ← application ← adapters`. `domain` não importa nada de infra/HTTP.
- **Erros como valores (§II, ADR-0002):** retorne `Result<T,E>`; **sem `throw`** no domínio/aplicação. `throw` só na borda de infra (em `external/`/adapters), convertido na hora. A única `Error` permitida no caminho é `QueryError`.
- **Estados ilegais irrepresentáveis (§IV):** branded types + smart constructors; uniões discriminadas + `switch` exaustivo (guarda `const _: never`).
- **O token vive aqui (§IX):** nunca é serializado de volta ao client. O que cruza a fronteira é a `fn` completa (sem segredos).

## Skills oficiais a carregar (delegar)

`pnpm dlx @tanstack/intent@latest load @tanstack/start-client-core#start-core/server-functions` (e `#middleware`, `#auth-server-primitives`, `#execution-model`). Ver agentes `server-orchestrator`, `tanstack-start-expert`, `zod-expert`, `security-frontend-expert`.

> Em conflito, vence: ADR > constituição > este arquivo > `eslint.config.js`.
