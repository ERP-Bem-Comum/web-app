# Phase 12: Integração com Backend core-api - Context

**Gathered:** 2026-05-28
**Status:** Ready for planning

## Phase Boundary

O módulo de Contratos do frontend TanStack Start passa a consumir a API REST real do backend core-api (Fastify 5 + MySQL + MinIO) em vez da mock API H3 local, mantendo 100% da UX existente enquanto adapta o domain model, auth JWT ES256 real, e storage S3/MinIO para documentos.

## Requirements (locked via SPEC.md)

**8 requirements are locked.** See `12-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `12-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- Subir backend core-api localmente (Docker Compose MySQL + MinIO) + backend na porta 3000
- Auth real JWT ES256 + refresh tokens (login, logout, refresh, me)
- Mapeamento de IDs para UUID e valores monetários para centavos no BFF
- Todas as Server Functions de contratos apontando para `/api/v2/*` do backend real
- Upload/download de PDF via octet-stream + MinIO
- Distrato mapeado como aditivo Misc + término de contrato
- Manter campos de parceiros/bancários na UI para futura integração
- Adaptação de status enums (backend Pending|Active|Expired|Terminated → frontend Pendente|Vigente|Encerrado|Distrato)
- Tratamento de erros HTTP 400/401/403/404/409/422/502/503 com mensagens amigáveis

**Out of scope (from SPEC.md):**
- Módulo Gestão de Parceiros (fornecedores/financieiros/colaboradores) — será Phase futura; campos ficam como stub
- Módulo Financial (contas a pagar) — backend tem CLI mas sem HTTP surface
- Módulo Notifications — sem HTTP surface
- Migração de dados do mock para o backend real — banco começa vazio
- Alterações no backend core-api — frontend se adapta ao contrato existente
- Feature flags ou toggle entre mock e real — migração é definitiva
- Deploy em produção — apenas ambiente local de desenvolvimento
- Testes E2E do backend — assumimos que backend já passa em seus próprios testes

## Implementation Decisions

### D-01: Estrutura de pastas — Colocation completo
- **Todas as Server Functions ficam dentro da feature:** `features/<feature>/infrastructure/*.server-fn.ts`
- **Cross-cutting permanece em `src/server/`:** `middleware/`, `config/env.ts`, `http/result-fetch.ts`
- **Auth também colocado:** `features/auth/infrastructure/login.server-fn.ts`, `logout.server-fn.ts`, `refresh.server-fn.ts`, `me.server-fn.ts`
- **Contratos:** `features/contracts/infrastructure/list-contracts.server-fn.ts`, `get-contract.server-fn.ts`, `create-contract.server-fn.ts`, `create-amendment.server-fn.ts`, `upload-document.server-fn.ts`, etc.
- **Rationale:** Features self-contained; `src/server/` não depende de schemas de features específicas

### D-02: Ordem de refatoração — Features vertical, Shared horizontal
- **Features (contratos, auth):** Vertical slices — endpoint por endpoint
  - Auth mínimo primeiro (login + cookie)
  - GET /contracts (listagem) — read-only, menor risco
  - GET /contracts/:id (detalhe) — read-only
  - POST /contracts (criar)
  - POST /amendments + homologate
  - Upload de documentos
  - Refresh token + logout robusto
- **Shared/cross-cutting:** Horizontal (camada por camada)
  - `lib/result.ts` + `lib/brand.ts` de uma vez
  - `server/http/result-fetch.ts` refatorado de uma vez
  - `lib/fp-ts-neverthrow-bridge.ts` de uma vez
- **Rationale:** Shared é usado por todos; features entregam valor incremental

### D-03: Ponte neverthrow ↔ fp-ts
- **Helper centralizado:** `lib/fp-ts-neverthrow-bridge.ts` com funções genéricas:
  - `teToResultAsync<L, R>(te: TE.TaskEither<L, R>): ResultAsync<R, L>`
  - `resultAsyncToTe<L, R>(ra: ResultAsync<R, L>): TE.TaskEither<L, R>`
- **Conversão inline** só em adapters com lógica custom complexa
- **Ports (interfaces de repo):** Usam `ResultAsync<T, E>` (neverthrow) — contrato entre application e adapter
- **Adapters internos:** Usam `TaskEither` (fp-ts) livremente para composição
- **Rationale:** 90% dos casos usam o helper; port é agnóstica de implementação

### D-04: Auth — OWASP-compliant session management
- **`iron-session`:** Cookie criptografado contendo **apenas session ID opaco** (nunca access/refresh tokens)
- **`unstorage`:** Session store server-side (memory em dev, Redis em prod)
  - Key: session ID
  - Value: `{ accessToken, refreshToken, userId, email, expiresAt }`
- **`jose`:** Verify/sign JWT quando necessário (mesma lib do backend)
- **Cookie config:** `HttpOnly; SameSite=Strict; Secure` (em prod); `Path=/`; curto Max-Age
- **Refresh automático:** No `authMiddleware` (server-side)
  1. Lê session ID do cookie
  2. Lookup no `unstorage` → recupera access + refresh tokens
  3. Se access token expirado → chama `POST /api/v2/auth/refresh` com refresh token
  4. Se refresh token expirado/inválido → limpa sessão do storage + cookie → redireciona login
  5. Injeta `accessToken` no `context` para Server Functions usarem
- **Rationale:** OWASP Session Management Cheat Sheet — tokens nunca expostos ao browser; revogação instantânea

### D-05: resultFetch — ofetch como base
- **`resultFetch` vira wrapper:** `ofetch → ResultAsync<T, HttpError>`
- **Configuração do ofetch:** retry 3x, timeout 10s, auto-parse JSON
- **Adapters usam `resultFetch`** sem saber que `ofetch` existe por baixo
- **Response validation:** Zod schema parse após `resultFetch` retornar `ResultAsync`
- **File upload:** `ofetch` com `responseType: 'blob'` para downloads; `Blob`/`Buffer` para uploads octet-stream
- **Rationale:** `ofetch` já tem retry, timeout, interceptors; não reinventar

### Claude's Discretion
- Nome exato dos arquivos `.server-fn.ts` pode variar (kebab-case vs camelCase)
- Estrutura interna de cada Server Function segue padrão existente: `createServerFn().middleware([authMiddleware]).validator(z.object({...})).handler(async ({ data, context }) => {...})`
- Se `unstorage` com Redis em prod não estiver disponível, fallback para memory com warning em startup

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Backend API Contract
- `docs/02-http-api.md` (core-api) — Endpoints, auth, RBAC, error mapping
- `docs/03-domain-contracts.md` (core-api) — Domain model, aggregates, state machines
- `docs/04-dev-guide.md` (core-api) — Setup, CLI, Docker Compose
- `handbook/api_documentations/contracts/openapi.yaml` (core-api) — OpenAPI legado de referência

### Frontend Architecture
- `.planning/phases/12-integra-o-com-backend-core-api/12-SPEC.md` — Requirements, boundaries, acceptance criteria
- `AGENTS.md` — Next.js docs index, project conventions
- `src/features/contracts/domain/types.ts` — Domain types atuais
- `src/features/contracts/domain/schemas.ts` — Zod schemas atuais
- `src/server/contracts.ts` — Server Functions atuais (mock API)
- `src/server/auth.ts` — Auth atual (mock)
- `src/shared/http/result-fetch.ts` — HTTP client atual

### External Specs
- OWASP Session Management Cheat Sheet — Cookie security, token storage, refresh patterns
- OWASP Cross-Site Request Forgery Prevention — SameSite, anti-CSRF

## Existing Code Insights

### Reusable Assets
- `src/features/contracts/views/components/ContractDetail.tsx` — Detalhe completo, pode ser adaptado para novos campos
- `src/features/contracts/views/components/ContractForm.tsx` — Formulário de criação com RHF + Zod
- `src/features/contracts/views/components/AditiveModal.tsx` — Modal de aditivo
- `src/features/contracts/adapters/queries.ts` — Query key factory (manter padrão)
- `src/server/middleware/auth.ts` — Auth middleware atual (será substituído)

### Established Patterns
- Server Functions usam `createServerFn` com `middleware([authMiddleware])`
- Views usam `useSuspenseQuery` + `useMutation` do TanStack Query
- Formulários usam React Hook Form + Zod resolver
- Componentes UI usam shadcn/ui + Tailwind v4
- Datas no frontend: `date-fns` para formatação; backend envia ISO strings

### Integration Points
- `src/routes/_authenticated.tsx` — Route guard que verifica sessão; precisa integrar com novo auth
- `src/server/env.ts` — Env vars; `API_URL` muda de `localhost:4010` para `localhost:3000/api/v2`
- `src/routes/_authenticated/contratos/` — Todas as rotas de contratos
- `mock-api.ts` — Mock H3; será descontinuado para contratos (manter para outras features legado)

## Specific Ideas

- Manter mock API H3 na porta 4010 para features legado não-migradas (payables, etc.)
- Usar `xstate` apenas para fluxos complexos (wizard de criação de contrato multi-step, se houver)
- `newtype-ts` usado com `fp-ts` nos adapters; branded types manuais com `neverthrow` no domain
- Upload de PDF: converter File → Buffer/Uint8Array → `ofetch` com `body: buffer` e `headers: { 'content-type': 'application/octet-stream' }`

## Deferred Ideas

- **Módulo Gestão de Parceiros** — Integração real de fornecedores/financieiros/colaboradores. Campos permanecem como stub na UI.
- **Módulo Financial** — Contas a pagar. Backend tem CLI mas sem HTTP surface ainda.
- **Módulo Notifications** — Sem HTTP surface.
- **Deploy em produção** — Após estabilização do ambiente local.
- **Testes E2E do backend** — Fora do escopo do frontend.
- **Feature flag mock/real** — Não implementar; migração é definitiva para contratos.

---

*Phase: 12-integra-o-com-backend-core-api*
*Context gathered: 2026-05-28*
