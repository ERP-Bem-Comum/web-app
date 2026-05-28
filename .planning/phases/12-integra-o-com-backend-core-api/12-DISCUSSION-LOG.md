# Phase 12: Integração com Backend core-api — Discussion Log

**Date:** 2026-05-28
**Areas discussed:** 5
**Decisions captured:** 5

---

## Area 1: Estrutura de pastas — onde ficam as Server Functions?

**Question:** Server Functions em colocation dentro das features ou centralizadas em `src/server/`?

**Options presented:**
- A. Colocation completo: `features/<feature>/infrastructure/*.server-fn.ts`
- B. Híbrido: `src/server/<feature>/` para features, `src/server/shared/` para cross-cutting
- C. Centralizado: manter `src/server/contracts.ts` organizado por submódulos

**User selection:** A (Colocation completo) para tudo

**Decision locked (D-01):**
- Todas as Server Functions ficam em `features/<feature>/infrastructure/*.server-fn.ts`
- Cross-cutting (middleware, env, result-fetch) permanece em `src/server/`
- Auth também colocado: `features/auth/infrastructure/*.server-fn.ts`
- Contratos: `features/contracts/infrastructure/*.server-fn.ts`

**Rationale:** Features self-contained; elimina dependência invertida de `src/server/` para `@/features/*/domain/schemas`

---

## Area 2: Ordem de refatoração

**Question:** Refatorar por camada (horizontal) ou por endpoint (vertical slices)?

**Options presented:**
- A. Auth primeiro, depois contratos
- B. Por endpoint de contrato (vertical slices)
- C. Por camada horizontal (domain → application → adapters → UI)

**User constraint:** Camada horizontal só aceito para shareds ou compartilhadas entre domínios

**Decision locked (D-02):**
- **Features (contratos, auth):** Vertical slices — endpoint por endpoint
  - Auth mínimo (login + cookie)
  - GET /contracts (listagem)
  - GET /contracts/:id (detalhe)
  - POST /contracts (criar)
  - POST /amendments + homologate
  - Upload de documentos
  - Refresh token + logout robusto
- **Shared/cross-cutting:** Horizontal
  - `lib/result.ts`, `lib/brand.ts`, `lib/fp-ts-neverthrow-bridge.ts`
  - `server/http/result-fetch.ts`

**Rationale:** Shared é base para todos; features entregam valor incremental e validam a arquitetura

---

## Area 3: Ponte neverthrow ↔ fp-ts

**Question:** Como fica a conversão entre `TaskEither` (fp-ts no adapter) e `ResultAsync` (neverthrow na port)?

**Options presented:**
- A. Helper centralizado em `lib/fp-ts-neverthrow-bridge.ts`
- B. Cada adapter faz conversão inline
- C. Ports usam `Promise<Result>` e adapters convertem no retorno

**User selection:** Siga com a recomendação (A + B híbrido)

**Decision locked (D-03):**
- Helper centralizado: `lib/fp-ts-neverthrow-bridge.ts` com `teToResultAsync()` e `resultAsyncToTe()`
- Conversão inline em adapters complexos com lógica custom
- Ports (interfaces de repo) usam `ResultAsync<T, E>` (neverthrow)
- Adapters internos usam `TaskEither` (fp-ts) livremente

**Rationale:** 90% dos casos usam o helper genérico; port é agnóstica de implementação

---

## Area 4: Auth — OWASP-compliant session management

**Question:** Como configurar auth com iron-session + jose + unstorage seguindo OWASP?

**Options presented:**
- A. `iron-session` criptografa cookie inteiro (sessão opaca)
- B. Cookie simples com `jose` JWT assinado
- C. Cookie contém session ID; tokens em `unstorage` server-side

**User constraint:** Siga a recomendação do OWASP Security

**Decision locked (D-04):**
- **`iron-session`:** Cookie criptografado com **apenas session ID opaco** (nunca access/refresh tokens)
- **`unstorage`:** Session store server-side (memory em dev, Redis em prod)
  - Key: session ID
  - Value: `{ accessToken, refreshToken, userId, email, expiresAt }`
- **`jose`:** Verify/sign JWT quando necessário
- **Cookie config:** `HttpOnly; SameSite=Strict; Secure` (prod); `Path=/`
- **Refresh automático:** No `authMiddleware` (server-side)
  - Lê session ID → lookup no storage → recupera tokens
  - Access expirado → chama `POST /api/v2/auth/refresh`
  - Refresh expirado → limpa sessão + cookie → redireciona login

**Rationale:** OWASP Session Management Cheat Sheet — tokens nunca expostos ao browser; revogação instantânea; CSRF protection via SameSite

---

## Area 5: resultFetch — ofetch como base

**Question:** Substituir `resultFetch` por `ofetch` ou criar wrapper?

**Options presented:**
- A. Substituir `resultFetch` usando `ofetch` como base + transformação em `ResultAsync`
- B. Wrapper em cima do fetch atual (retry/timeout manual)
- C. `ofetch` direto nos adapters

**User selection:** Aplique a opção A

**Decision locked (D-05):**
- `resultFetch` vira wrapper centralizado: `ofetch → ResultAsync<T, HttpError>`
- Configuração: retry 3x, timeout 10s, auto-parse JSON
- Adapters usam `resultFetch` sem saber que `ofetch` existe por baixo
- Response validation: Zod schema parse após `resultFetch` retornar
- Upload: `ofetch` com `Blob`/`Buffer` para octet-stream

**Rationale:** `ofetch` já tem retry, timeout, interceptors; centralizar evita repetição

---

## Deferred Ideas

| Idea | Reason deferred |
|------|-----------------|
| Módulo Gestão de Parceiros | Future phase — HTTP surface não existe no backend ainda |
| Módulo Financial | Backend tem CLI mas sem HTTP surface |
| Módulo Notifications | Sem HTTP surface |
| Deploy em produção | Após estabilização do ambiente local |
| Feature flag mock/real | Migração é definitiva para contratos |

---

*Phase: 12-integra-o-com-backend-core-api*
*Discussion completed: 2026-05-28*
