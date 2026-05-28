# Plan 12-1: Integração com Backend core-api

**Phase:** 12 — Integração com Backend core-api
**Objective:** Integrar o módulo de Contratos do frontend TanStack Start com o backend real core-api (Fastify + MySQL + MinIO), substituindo a mock API H3 pela API REST real. Manter UX existente enquanto adapta domain model, auth real JWT ES256 + refresh tokens, e storage S3/MinIO.

## Tasks

### A. Infraestrutura e Dependências

1. **Instalar dependências do backend**
   - `yarn add ofetch iron-session jose unstorage @t3-oss/env-core`
   - `yarn add neverthrow fp-ts newtype-ts` (se ainda não instalados)
   - Verificar compatibilidade com Node 20+ e ESM

2. **Configurar variáveis de ambiente**
   - Atualizar `src/server/env.ts` com `CORE_API_URL`, `SESSION_SECRET`, `REDIS_URL` (opcional)
   - `API_URL` muda de `localhost:4010` para `localhost:3000/api/v2`
   - Adicionar `SESSION_SECRET` para `iron-session` (mínimo 32 chars)
   - Atualizar `.env.example` e `.env.local`

### B. Cross-Cutting (Shared)

3. **Criar `lib/fp-ts-neverthrow-bridge.ts`**
   - `teToResultAsync<L, R>(te: TE.TaskEither<L, R>): ResultAsync<R, L>`
   - `resultAsyncToTe<L, R>(ra: ResultAsync<R, L>): TE.TaskEither<L, R>`
   - Testes unitários básicos

4. **Refatorar `src/shared/http/result-fetch.ts`**
   - Trocar implementação base de `fetch` para `ofetch`
   - Manter interface pública: retorna `ResultAsync<T, HttpError>` (neverthrow)
   - Configurar retry 3x, timeout 10s, auto-parse JSON
   - Suporte a `responseType: 'blob'` para downloads
   - Suporte a upload de `Blob`/`Buffer` com `Content-Type: application/octet-stream`
   - Manter função `mapHttpError`

5. **Criar `src/server/http/result-fetch.ts`**
   - Wrapper server-side que reutiliza o shared mas injeta baseURL do env
   - Exportar instância configurada para uso nas Server Functions

### C. Auth Real (JWT ES256 + Refresh Tokens)

6. **Criar `features/auth/infrastructure/session-store.ts`**
   - Implementar `SessionStore` port usando `unstorage`
   - Driver: `memory` em dev, `redis` em prod (via env)
   - Estrutura: `{ accessToken, refreshToken, userId, email, expiresAt }`
   - Funções: `createSession`, `getSession`, `deleteSession`, `updateSession`

7. **Criar `features/auth/infrastructure/auth-session.ts`**
   - Configurar `iron-session` com `SESSION_SECRET`
   - Cookie: `HttpOnly; SameSite=Strict; Path=/; Secure` (prod)
   - Seal contém apenas `sessionId` opaco (nunca tokens)

8. **Criar `features/auth/infrastructure/refresh-token.server-fn.ts`**
   - Server Function `POST /api/v2/auth/refresh` com refresh token
   - Atualiza access token no session store
   - Retorna erro se refresh token inválido/expirado

9. **Refatorar `src/server/middleware/auth.ts`**
   - Usar `iron-session` para ler cookie e extrair `sessionId`
   - Lookup no `unstorage` → recupera access + refresh tokens
   - Se access token expirado → chama refresh token silenciosamente
   - Se refresh token inválido → limpa sessão + cookie → 401
   - Injeta `accessToken` no `context` (não mais token mock)
   - Atualizar tipos `Session` e `AuthContext`

10. **Criar `features/auth/infrastructure/login.server-fn.ts`**
    - Chama `POST /api/v2/auth/login` do backend real
    - Recebe `{ accessToken, refreshToken, userId }`
    - Cria sessão no `unstorage` + cookie `iron-session`
    - Retorna dados do usuário

11. **Criar `features/auth/infrastructure/logout.server-fn.ts`**
    - Chama `POST /api/v2/auth/logout` no backend (revoga refresh token)
    - Remove do `unstorage` + limpa cookie
    - Retorna `{ success: true }`

12. **Criar `features/auth/infrastructure/me.server-fn.ts`**
    - Chama `GET /api/v2/auth/me` com access token
    - Retorna dados do usuário logado

13. **Atualizar `src/hooks/useAuth.ts`**
    - Importar das novas Server Functions em `features/auth/infrastructure/`
    - Manter interface pública do hook (user, isAuthenticated, logout)

14. **Atualizar `src/routes/login.tsx`**
    - Usar nova `login` Server Function
    - Tratar erros do backend real (401, 403, 503)

### D. Domain Types (UUID + Centavos)

15. **Atualizar `src/features/contracts/domain/types.ts`**
    - `ContractId`: mudar de `number` para `string` (UUID v4)
    - `Money`: manter `number` (reais) no frontend domain
    - Atualizar `FileAttachment.id` para `string`
    - Adicionar `Contract.backendStatus` para mapear enums (Pending|Active|Expired|Terminated)
    - `ContractStatus` no frontend mantém português (Pendente|Vigente|Encerrado|Distrato)
    - Adicionar função `mapBackendStatus(backend: string): ContractStatus`

16. **Atualizar `src/features/contracts/domain/schemas.ts`**
    - `ContractListFiltersSchema`: `budgetPlanId` → `string.nullish()`
    - `BaseContractCreateSchema`: `supplierId`/`financierId`/`collaboratorId` → `string.nullish()`
    - `GetByIdSchema` (Server Functions): `z.string().uuid()` em vez de `z.number()`
    - `AditiveCreateInputSchema`: `parentId` → `z.string().uuid()`
    - Manter regras de negócio (teto OS, pagamento obrigatório, datas)

### E. Server Functions de Contratos (migrar para features)

17. **Criar `features/contracts/infrastructure/list-contracts.server-fn.ts`**
    - `GET /api/v2/contracts` com query params
    - Mapear resposta: `id` (UUID), `originalValueCents` → `totalValue` (reais)
    - Adicionar `contract:read` permission check
    - Tratar 403 → "Sem permissão"

18. **Criar `features/contracts/infrastructure/get-contract.server-fn.ts`**
    - `GET /api/v2/contracts/:id`
    - Mapear `currentValueCents`/`originalValueCents` → `totalValue`
    - Mapear `status` backend → frontend
    - Incluir `amendments[]`, `documents[]` do backend
    - Tratar 404 → "Contrato não encontrado"

19. **Criar `features/contracts/infrastructure/create-contract.server-fn.ts`**
    - `POST /api/v2/contracts`
    - Converter `totalValue` (reais) → `originalValueCents` (centavos, inteiro)
    - Converter datas para ISO strings
    - Enviar `mode: 'Pending'` ou `mode: 'Active'` conforme regra
    - Não enviar campos de parceiro/bancário (backend não aceita)
    - Tratar 409/422 → mensagem do backend

20. **Criar `features/contracts/infrastructure/create-amendment.server-fn.ts`**
    - `POST /api/v2/contracts/:id/amendments`
    - Mapear tipos frontend → backend: `prazo|valor|escopo` → `Term|Value|Scope`; `distrato` → `Misc` + descrição
    - Converter `totalValue` → `impactValueCents`

21. **Criar `features/contracts/infrastructure/homologate-amendment.server-fn.ts`**
    - `POST /api/v2/contracts/:id/amendments/:amendmentId/homologate`
    - Após sucesso, se era distrato → chamar `POST /api/v2/contracts/:id/activate` (ou endpoint de término)

22. **Criar `features/contracts/infrastructure/get-contract-history.server-fn.ts`**
    - `GET /api/v2/contracts/:id/history`
    - Mapear timeline para formato do frontend

23. **Criar `features/contracts/infrastructure/upload-document.server-fn.ts`**
    - `POST /api/v2/contracts/:id/documents` (ou `.../amendments/:amendmentId/documents`)
    - Upload via `application/octet-stream` com metadados na query string
    - Parâmetros: `category`, `fileName`, `mimeType`, `signedElectronically`
    - Body: `Buffer`/`Blob` do arquivo
    - Limitar a 20 MiB

24. **Criar `features/contracts/infrastructure/supersede-document.server-fn.ts`**
    - `POST /api/v2/contracts/:id/documents/:documentId/supersede`
    - Mesmo padrão de upload octet-stream

### F. Adapters HTTP (Refatorar)

25. **Refatorar `src/features/contracts/adapters/http/contracts.ts`**
    - Atualizar para usar novo `resultFetch` (ofetch base)
    - `fetchContracts`: receber `token` + `filters`; retornar `ResultAsync`
    - `fetchContractById`: `id: string`; mapear cents → reais
    - `createContract`: converter reais → cents antes de enviar
    - `createAmendment`: mapear tipos e valores
    - Adicionar `uploadDocument`, `downloadDocument`, `supersedeDocument`
    - Usar `fp-ts` internamente, converter para `neverthrow` na fronteira

26. **Atualizar `src/features/contracts/adapters/queries.ts`**
    - Atualizar `contractKeys.detail(id: string)`
    - Manter query key factory existente

### G. Views e Hooks (Adaptações)

27. **Atualizar `src/features/contracts/views/hooks/use-contracts.ts`**
    - Usar nova `listContracts` Server Function
    - Manter interface do hook

28. **Atualizar `src/features/contracts/views/hooks/use-contract.ts`**
    - Usar nova `getContract` Server Function
    - `id` como `string`

29. **Atualizar `src/features/contracts/views/hooks/use-create-aditive.ts`**
    - Usar nova `createAmendment` + `homologateAmendment`
    - Mapear `distrato` → `Misc`

30. **Atualizar `src/features/contracts/views/components/ContractForm.tsx`**
    - Adaptar para não enviar `supplier`/`financier`/`collaborator` completos ao backend
    - Manter campos na UI (stub)
    - Verificar conversão de valor monetário

31. **Atualizar `src/features/contracts/views/components/ContractDetail.tsx`**
    - Mostrar status mapeado (incluindo "Distrato" derivado)
    - Integrar preview de PDF via URL/S3
    - Manter seção de parceiro (mesmo que vazia)

32. **Atualizar `src/features/contracts/views/components/ContractTimeline.tsx`**
    - Ordenar com base sempre como último nó (regra existente)
    - Adaptar para novos tipos de evento do backend

33. **Atualizar rotas com parâmetro ID**
    - `src/routes/_authenticated/contratos/detalhes.$id.tsx`
    - `src/routes/_authenticated/contratos/editar.$id.tsx`
    - `src/routes/_authenticated/contratos/aditivo.$id.tsx`
    - `src/routes/_authenticated/contratos/historico.$id.tsx`
    - `id` como `string` (UUID), não `number`

### H. Documentos e Upload

34. **Criar helper `src/shared/http/upload-file.ts`**
    - Converter `File` → `ArrayBuffer` → `Uint8Array`
    - Validar mime type (`application/pdf`) e tamanho (< 20 MiB)
    - Retornar `ResultAsync<void, UploadError>`

35. **Criar componente `DocumentUploader.tsx`**
    - Input file com drag-and-drop (reutilizar padrão shadcn)
    - Chamar `uploadDocument` Server Function
    - Mostrar preview do PDF (signed URL ou URL pública do MinIO)

### I. Cleanup e Deprecação

36. **Remover/deprecar `src/server/contracts.ts`**
    - Mover todas as Server Functions para `features/contracts/infrastructure/`
    - Deixar `src/server/contracts.ts` como re-exports ou remover após migração

37. **Remover/deprecar `src/server/auth.ts`**
    - Substituir por `features/auth/infrastructure/*.server-fn.ts`

38. **Atualizar `mock-api.ts`**
    - Manter mock H3 na porta 4010 para features legado (payables, etc.)
    - Remover endpoints de contratos do mock (ou deixar como fallback dev opcional)

### J. Verificação Final

39. **Rodar quality gate**
    - `yarn typecheck` — passar sem erros em `src/features/contracts/` e `src/features/auth/`
    - `yarn lint` — sem erros
    - `yarn test:run` — domain tests ≥ 80%
    - `yarn build` — build passa

40. **Teste end-to-end manual**
    - Subir backend (`docker compose up -d` MySQL + MinIO; `pnpm run serve` na 3000)
    - Subir frontend (`yarn dev` na 3001 ou 5173)
    - Login com credenciais reais
    - Criar contrato → ver no backend
    - Criar aditivo → homologar → ver valor atualizado
    - Upload de PDF → ver no MinIO
    - Logout → cookie limpo

## Success Criteria

- `docker compose up -d` sobe MySQL + MinIO sem erro; backend health ok
- Login com credenciais reais cria sessão válida; cookie HttpOnly seguro
- Após 15 min, refresh token acontece silenciosamente
- Listagem de contratos exibe contratos reais do backend com UUIDs
- Criar contrato persiste no backend MySQL; aparece na listagem
- Criar aditivo (prazo/valor/escopo/distrato) persiste e reflete no contrato pai
- Homologar aditivo atualiza `currentValue`/`currentPeriod` no backend
- Upload de PDF salva no MinIO; preview funciona
- Contrato `Terminated` com aditivo Misc de distrato aparece como "Distrato"
- Campos de parceiro/bancários permanecem visíveis na UI (stub)
- Logout limpa cookie e revoga refresh token no backend
- Erros 401 redirecionam para login; 403 mostram "Sem permissão"; 409/422 mostram mensagem do backend
- `yarn typecheck` passa sem erros
- `yarn build` passa sem erros
