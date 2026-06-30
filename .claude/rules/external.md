---
paths:
  - "src/external/**/*.ts"
---

# Regras — External (I/O real + segredos · SERVER-ONLY)

Fonte: ADR-0003, ADR-0005, ADR-0006; constituição §VIII, §IX; `handbook/ARQUITETURA.md` §2 e §5.

## Invariantes

- **Server-only:** `external/` **nunca** entra no bundle do client. Aqui vivem env/config, fetch do core-api, session store + cookie, http.
- **Erros como valores na borda (§V):** `result-fetch.ts` converte I/O em `Result` — 4xx/5xx viram `Result.err(HttpError)` **sem `throw`** propagado; depois `mapToServerResponse` → `QueryError` → `AppError.kind`.
- **Token nunca volta ao browser (ADR-0005, §IX):** o cookie carrega só um `sessionId` **opaco** (`__Host-session`); access/refresh tokens ficam server-side no SessionStore. Refresh é **single-flight**.
- **Segredos só aqui:** nada de segredo fora de `external/config`. Nunca logar valor de segredo (logging estruturado com redaction — ADR-0014).
- **Supply-chain (ADR-0003, §VIII):** pnpm 11, mínimo de dependências, prefira o nativo.
- **core-api dev como referência:** ao consultar contratos do core-api, use `origin/dev`.

> Em conflito, vence: ADR > constituição > este arquivo > `eslint.config.js`.
