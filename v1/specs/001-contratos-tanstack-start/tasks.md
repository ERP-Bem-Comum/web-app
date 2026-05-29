# Tasks: Migração do Módulo de Contratos para TanStack Start

**Input**: Design documents from `/specs/001-contratos-tanstack-start/`

**Prerequisites**: plan.md (required), spec.md (required), handbook/contratos/openapi.yaml (contrato REST)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)

---

## Phase 1: Bootstrap Infraestrutura TanStack Start

**Purpose**: Substituir Next.js runtime por TanStack Start + Vite. O resto do sistema pode quebrar.

- [ ] T001 Remover Next.js runtime e instalar dependências TanStack Start
  - `yarn remove next @tailwindcss/postcss eslint-config-next`
  - `yarn add @tanstack/react-router @tanstack/react-start nitro vite @vitejs/plugin-react`
  - `yarn add -D @tailwindcss/vite tailwindcss vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom msw`
  - Arquivos: `package.json`

- [ ] T002 [P] Configurar `vite.config.ts`
  - Plugins: `tanstackStart({ srcDirectory: 'src', router: { routesDirectory: 'routes' } })`, `viteReact()`, `nitro()`, `tailwindcss()`, `tsconfigPaths()`
  - Porta 3000, resolve aliases
  - Arquivo: `vite.config.ts` (novo)

- [ ] T003 [P] Atualizar scripts e type module em `package.json`
  - `dev: "vite dev"`, `build: "vite build"`, `start: "node .output/server/index.mjs"`, `test:run: "vitest run"`
  - Arquivo: `package.json`

- [ ] T004 Criar entry points obrigatórios
  - `src/client.tsx` — entry client (hydrateRoot)
  - `src/ssr.tsx` — entry server (renderToPipeableStream)
  - `src/router.tsx` — createRouter + routeTree.gen + scrollRestoration
  - Arquivos: `src/client.tsx`, `src/ssr.tsx`, `src/router.tsx`

- [ ] T005 Criar root layout `src/app/__root.tsx`
  - Substitui `src/app/layout.tsx`
  - Usa `createRootRoute`, `HeadContent`, `Scripts`, `Outlet`
  - Importa CSS global (`appCss from "./globals.css?url"`)
  - Arquivo: `src/app/__root.tsx`

- [ ] T006 Adaptar Tailwind v4 para Vite
  - Remover `postcss.config.*`
  - CSS global com `@import "tailwindcss"`
  - Preservar customizações de cor/animate do `tailwind.config.ts`
  - Arquivos: `src/app/globals.css`, `tailwind.config.ts`

- [ ] T007 Configurar path aliases e ajustar `tsconfig.json`
  - Garantir `paths: { "@/*": ["./src/*"], "lib/*": ["./lib/*"] }`
  - Remover plugin `next` do compilerOptions
  - Ajustar `include` para não referenciar `.next/types`
  - Arquivo: `tsconfig.json`

**Checkpoint**: `pnpm dev` roda sem erro e mostra uma página básica na porta 3000

---

## Phase 2: Auth e Layout Principal (Foundational)

**Purpose**: Autenticação e layout compartilhado que bloqueiam TODAS as user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 Criar `src/server/env.ts`
  - Zod schema validando `API_URL`, `AUTH_SECRET`, `NODE_ENV`
  - Arquivo: `src/server/env.ts`

- [ ] T009 Criar `src/shared/http/result-fetch.ts`
  - Wrapper ao redor de `fetch` (ou axios interno) retornando `Result<T, HttpError>`
  - Tipos: `HttpError = { kind: 'http' | 'network' | 'timeout', status?: number, body?: unknown }`
  - Arquivo: `src/shared/http/result-fetch.ts`

- [ ] T010 Criar `src/server/middleware/auth.ts`
  - `createMiddleware` que lê cookie `HttpOnly` `session-token`
  - Decodifica JWT com `AUTH_SECRET`
  - Injeta `context.session = { userId, email, name, accessToken }`
  - Arquivo: `src/server/middleware/auth.ts`

- [ ] T011 Criar `src/server/auth.server.ts`
  - `login`: Server Function POST que chama `/auth/login` no NestJS, recebe token, seta cookie HttpOnly
  - `logout`: Server Function POST que remove o cookie
  - `getSession`: Server Function GET que retorna session atual (usa auth middleware)
  - Arquivo: `src/server/auth.server.ts`

- [ ] T012 Criar hook `useAuth()`
  - Substitui `useSession` do next-auth
  - Usa `useQuery` chamando `getSession`
  - Expõe `{ session, isLoading, isAuthenticated }`
  - Arquivo: `src/hooks/useAuth.ts`

- [ ] T013 Migrar página de login para `src/routes/login.tsx`
  - Formulário de email/senha
  - Chama `login` Server Function
  - Redireciona para `/contratos` em sucesso
  - Arquivo: `src/routes/login.tsx`

- [ ] T014 Criar layout autenticado `src/routes/_authenticated.tsx`
  - Route layout do TanStack Router
  - Verifica sessão; redireciona para `/login` se não autenticado
  - Renderiza sidebar (Navigation) + topbar (TopMain) + `<Outlet />`
  - Arquivo: `src/routes/_authenticated.tsx`

- [ ] T015 Migrar componentes de layout para funcionar sem `next/navigation`
  - `TopMain`: substituir `useSession` por `useAuth`, `signOut` por `logout`
  - `Navigation`/`ListMenu`: substituir `next/link` por `Link` do `@tanstack/react-router`
  - `PageContainer`: ajustar props se necessário
  - Arquivos: `src/components/layout/main/TopMain.tsx`, `src/components/layout/main/ListMenu.tsx`, `src/components/layout/main/PageContainer.tsx`

- [ ] T016 Adaptar `TopPages` e `TopPagesWithArrow` para TanStack Router
  - Substituir `useRouter` por `useNavigate`
  - `router.back()` → `navigate({ to: '..' })` ou `history.back()`
  - Arquivos: `src/components/TopPages.tsx`, `src/components/TopPagesWithArrow.tsx`

**Checkpoint**: Usuário consegue fazer login, ver layout autenticado, e fazer logout. Rotas não-autenticadas redirecionam para login.

---

## Phase 3: User Story 2 — Listar Contratos (Priority: P1) 🎯 MVP

**Goal**: Tela de listagem paginada com filtros e busca textual funcionando em TanStack Start.

**Independent Test**: Acessar `/contratos` autenticado e ver lista carregando com paginação, filtros e busca.

### Tests for User Story 2

- [ ] T017 [P] [US2] Teste de domain: smart constructors de `ContractId`, `ContractStatus` em `tests/features/contracts/domain/types.test.ts`
- [ ] T018 [P] [US2] Teste de adapter: `fetchContracts` com MSW (happy path + 401) em `tests/features/contracts/adapters/http/contracts.test.ts`

### Implementation for User Story 2

- [ ] T019 [US2] Domain: criar `src/features/contracts/domain/types.ts`
  - Branded types: `ContractId`, `ContractCode`, `Money`
  - Smart constructors com validação e retorno `Result`
  - Enums reexportados (ou novos tipos string-based)

- [ ] T020 [P] [US2] Domain: criar `src/features/contracts/domain/schemas.ts`
  - Zod schemas: `ContractListFiltersSchema`, `ContractRowSchema`, `PaginatedContractRowsSchema`
  - Baseados no OpenAPI
  - Arquivo: `src/features/contracts/domain/schemas.ts`

- [ ] T021 [P] [US2] Domain: criar `src/features/contracts/domain/errors.ts`
  - String literals: `'contract:not_found'`, `'contract:unauthorized'`, `'contract:invalid_value'`
  - Arquivo: `src/features/contracts/domain/errors.ts`

- [ ] T022 [US2] Application: criar `src/features/contracts/application/ports.ts`
  - `ContractRepo` com métodos: `list(filters)`, `getById(id)`, `create(input)`, `update(id, input)`, `delete(id)`
  - Arquivo: `src/features/contracts/application/ports.ts`

- [ ] T023 [US2] Application: criar use-case `src/features/contracts/application/use-cases/list-contracts.ts`
  - Factory pura: valida input com Zod → chama repo.list → retorna `Result`

- [ ] T024 [US2] Adapters HTTP: criar `src/features/contracts/adapters/http/contracts.ts`
  - `fetchContracts(filters)`: usa `resultFetch` para `GET /contracts`
  - `parseContractRow(dto)`: converte response → domain (smart constructor + Result)
  - Arquivo: `src/features/contracts/adapters/http/contracts.ts`

- [ ] T025 [US2] Adapters HTTP: criar `src/features/contracts/adapters/http/parse.ts`
  - Funções puras de parsing DTO → domain para cada entidade
  - Arquivo: `src/features/contracts/adapters/http/parse.ts`

- [ ] T026 [US2] Adapters queries: criar `src/features/contracts/adapters/queries.ts`
  - `contractKeys` factory e `contractQueries` com `queryOptions`
  - Arquivo: `src/features/contracts/adapters/queries.ts`

- [ ] T027 [US2] Server Function: criar `src/server/contracts.server.ts` — `getContracts`
  - `createServerFn({ method: 'GET' }).middleware([authMiddleware]).validator(FiltersSchema).handler(...)`
  - Chama NestJS via `resultFetch`, valida response, retorna domain

- [ ] T028 [US2] Views: criar `src/features/contracts/views/components/ContractsTable.tsx`
  - Tabela shadcn (ou div-based) com colunas: código, objeto, tipo, status, valor, período, fornecedor
  - Ordenação decrescente por ID
  - Sem MUI

- [ ] T029 [US2] Views: criar `src/features/contracts/views/components/ContractFilters.tsx`
  - Filtros: status, tipo, período, plano orçamentário
  - Busca textual com debounce

- [ ] T030 [US2] Views: criar `src/features/contracts/views/hooks/use-contracts.ts`
  - `useSuspenseQuery(contractQueries.list(filters))`

- [ ] T031 [US2] Route: criar `src/routes/_authenticated/contratos/index.tsx`
  - `createFileRoute('/_authenticated/contratos/')`
  - `validateSearch` para query params (page, limit, search, status, type)
  - `loader` com `ensureQueryData`
  - Componente: `<ContractsTable /> + <ContractFilters /> + <Paginator />`

**Checkpoint**: `/contratos` lista contratos com filtros, busca e paginação. Testes de domain e adapter passam.

---

## Phase 4: User Story 3 — Criar Contrato (Priority: P1) 🎯 MVP

**Goal**: Formulário de criação de contrato com validações, auto-save e regras de negócio.

**Independent Test**: Acessar `/contratos/adicionar`, preencher formulário e submeter. Ver contrato criado na listagem.

### Tests for User Story 3

- [ ] T032 [P] [US3] Teste de domain: validação de teto de OS (`totalValue <= 9999.99`) em `tests/features/contracts/domain/schemas.test.ts`
- [ ] T033 [P] [US3] Teste de adapter: `createContract` happy path + erro 400 em `tests/features/contracts/adapters/http/contracts.test.ts`

### Implementation for User Story 3

- [ ] T034 [US3] Domain: atualizar schemas com `ContractCreateInputSchema`
  - Discriminated union por `contractType`
  - Regras: teto OS, PIX/bancário obrigatório para COLLABORATOR/SUPPLIER/ACT
  - Arquivo: `src/features/contracts/domain/schemas.ts`

- [ ] T035 [US3] Application: criar use-case `src/features/contracts/application/use-cases/create-contract.ts`
  - Valida input → chama repo.create → retorna Result

- [ ] T036 [US3] Adapters HTTP: adicionar `createContract` em `src/features/contracts/adapters/http/contracts.ts`
  - POST /contracts via `resultFetch`

- [ ] T037 [US3] Server Function: adicionar `createContract` em `src/server/contracts.server.ts`
  - `createServerFn({ method: 'POST' }).middleware([authMiddleware]).validator(ContractCreateInputSchema).handler(...)`

- [ ] T038 [US3] Views: criar `src/features/contracts/views/components/ContractForm.tsx`
  - Formulário com react-hook-form + Zod resolver
  - Campos: classificação, modelo, objeto, valor, período, tipo, contratante, programa, plano, PIX/dados bancários
  - Auto-save em sessionStorage a cada 30s
  - Validação em tempo real

- [ ] T039 [US3] Views: criar `src/features/contracts/views/hooks/use-create-contract.ts`
  - `useMutation` chamando `createContract` Server Function
  - Invalida query cache de listagem no onSuccess

- [ ] T040 [US3] Route: criar `src/routes/_authenticated/contratos/adicionar.tsx`
  - `createFileRoute('/_authenticated/contratos/adicionar')`
  - Componente: `<ContractForm mode="create" />`

**Checkpoint**: `/contratos/adicionar` cria contratos com validações. Contrato aparece na listagem. Auto-save funciona.

---

## Phase 5: User Story 4 — Visualizar Detalhes e Timeline (Priority: P1) 🎯 MVP

**Goal**: Tela de detalhes com timeline cronológica correta e edição de rascunho.

**Independent Test**: Acessar `/contratos/detalhes/123` e ver detalhes + timeline ordenada.

### Tests for User Story 4

- [ ] T041 [P] [US4] Teste de domain: ordenação de timeline (base sempre primeiro nó) em `tests/features/contracts/domain/timeline.test.ts`

### Implementation for User Story 4

- [ ] T042 [US4] Application: criar use-case `src/features/contracts/application/use-cases/get-contract.ts`

- [ ] T043 [US4] Adapters HTTP: adicionar `fetchContractById` em `src/features/contracts/adapters/http/contracts.ts`
  - GET /contracts/:id

- [ ] T044 [US4] Server Function: adicionar `getContractById` em `src/server/contracts.server.ts`

- [ ] T045 [US4] Views: criar `src/features/contracts/views/components/ContractDetail.tsx`
  - Exibe todos os campos do contrato
  - Cards de resumo: valor, período, status, saldo

- [ ] T046 [US4] Views: criar `src/features/contracts/views/components/ContractTimeline.tsx`
  - Ordenação: mais recente primeiro, mas contrato base é sempre o último (primeiro nó)
  - Estados: past (cinza), ok (verde), current (azul)
  - Aditivos homologados: apenas evento de homologação
  - Aditivos pendentes: criação + pendente
  - Rascunhos: apenas criação

- [ ] T047 [US4] Views: criar `src/features/contracts/views/hooks/use-contract.ts`
  - `useSuspenseQuery` para detalhes

- [ ] T048 [US4] Route: criar `src/routes/_authenticated/contratos/detalhes.$id.tsx`
  - `createFileRoute('/_authenticated/contratos/detalhes/$id')`
  - `loader` com `ensureQueryData`
  - Permite editar contrato base se status === RASCUNHO

**Checkpoint**: `/contratos/detalhes/$id` exibe detalhes e timeline corretamente. Rascunho é editável.

---

## Phase 6: User Story 5 — Adicionar Aditivo (Priority: P2)

**Goal**: Criar aditivos vinculados a um contrato pai com regras de validação e status.

**Independent Test**: A partir da tela de detalhes, clicar "Novo Aditivo" e criar um aditivo.

### Tests for User Story 5

- [ ] T049 [P] [US5] Teste de adapter: `createAditive` happy path em `tests/features/contracts/adapters/http/contracts.test.ts`

### Implementation for User Story 5

- [ ] T050 [US5] Application: criar use-case `src/features/contracts/application/use-cases/create-aditive.ts`

- [ ] T051 [US5] Adapters HTTP: adicionar `createAditive` em `src/features/contracts/adapters/http/contracts.ts`
  - POST /contracts/aditive

- [ ] T052 [US5] Server Function: adicionar `createAditive` em `src/server/contracts.server.ts`

- [ ] T053 [US5] Views: criar `src/features/contracts/views/components/AditiveForm.tsx`
  - Tipo: prazo, valor, escopo, outro, distrato
  - Validação: valor obrigatório para tipo "valor", nova data fim para tipo "prazo"
  - Upload de documento + data de assinatura → status Homologado
  - Sem documento → status Pendente

- [ ] T054 [US5] Route: criar `src/routes/_authenticated/contratos/aditivo.$id.tsx`
  - `createFileRoute('/_authenticated/contratos/aditivo/$id')`
  - Recebe `id` do contrato pai

**Checkpoint**: Aditivos são criados e aparecem na timeline do contrato pai com status correto.

---

## Phase 7: User Story 6 — Atualizar Dados Bancários (Priority: P2)

**Goal**: Editar PIX e dados bancários do contrato na tela de detalhes.

**Independent Test**: Abrir modal de edição de dados bancários, alterar e salvar.

- [ ] T055 [US6] Adapters HTTP: adicionar `updateContractPaymentInfo` em `src/features/contracts/adapters/http/contracts.ts`
  - PUT /contracts/bancaryInfo/:id

- [ ] T056 [US6] Server Function: adicionar `editContractPaymentInfo` em `src/server/contracts.server.ts`

- [ ] T057 [US6] Views: criar modal de edição de dados bancários em `src/features/contracts/views/components/ContractBankInfoModal.tsx`
  - Reutiliza schemas de validação do domain
  - Validação: PIX ou bancário obrigatório

**Checkpoint**: Dados bancários/PIX são atualizados e persistidos.

---

## Phase 8: User Story 1 — Auth e Acesso (Priority: P1) — Integração

**Goal**: Garantir que auth funciona end-to-end com todas as rotas de contratos.

- [ ] T058 [US1] Testar redirecionamento: `/contratos` sem auth → `/login`
- [ ] T059 [US1] Testar redirecionamento: `/login` com auth → `/contratos`
- [ ] T060 [US1] Testar logout: cookie removido, session limpa, redireciona para login

**Checkpoint**: Fluxo de auth completo funciona com todas as rotas de contratos.

---

## Phase 9: Exportação e Arquivos (Cross-Cutting)

**Goal**: Exportar CSV/PDF e gerenciar arquivos anexos.

- [ ] T061 [P] Server Function: adicionar `exportContractsCsv` e `exportContractsPdf` em `src/server/contracts.server.ts`
  - GET /contracts/csv e /contracts/pdf
  - Retorna `Response` (blob) para download

- [ ] T062 [P] Server Function: adicionar upload de arquivos em `src/server/contracts.server.ts`
  - `uploadContractFiles`, `updateContractFiles`, `uploadSignedContract`, `uploadSettleTerm`, `uploadWithdrawal`
  - Aceita `FormData`, usa `resultFetch` sem setar `content-type`

- [ ] T063 Views: adicionar botões de exportação em `ContractsTable`

- [ ] T064 Views: adicionar upload de arquivos em `ContractForm` e `ContractDetail`

**Checkpoint**: Exportação e upload de arquivos funcionam.

---

## Phase 10: Cleanup e Breaking Changes

**Purpose**: Remover legado Next.js que não é mais necessário.

- [ ] T065 Remover `src/app/api/auth/[...nextauth]/route.ts`
- [ ] T066 Remover/quebrar rotas não-migradas (manter apenas login, contratos, layout)
- [ ] T067 Remover `next.config.js`, `postcss.config.*`
- [ ] T068 Remover dependências Next.js (`next`, `next-auth`, `nookies`, `eslint-config-next`)
- [ ] T069 Atualizar `firebase.json` para apontar para `.output/` do Nitro

**Checkpoint**: `pnpm build` gera output Nitro sem erros. Apenas rotas de login e contratos funcionam.

---

## Phase 11: Quality Gate

**Purpose**: Garantir que tudo passa nos checks de qualidade.

- [ ] T070 Rodar `pnpm format:check` — ALL GREEN
- [ ] T071 Rodar `pnpm lint` — ALL GREEN
- [ ] T072 Rodar `pnpm typecheck` — ALL GREEN (ou com ignoreBuildErrors temporariamente)
- [ ] T073 Rodar `pnpm test:run` — ALL GREEN (domain ≥ 80%, adapters happy+erro)
- [ ] T074 Rodar `pnpm build` — ALL GREEN

**Checkpoint**: Gate verde. Feature pronta para deploy.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Bootstrap)**: No dependencies → start immediately
- **Phase 2 (Auth/Layout)**: Depends on Phase 1 → BLOCKS all user stories
- **Phase 3 (US2 Listar)**: Depends on Phase 2 → can start after auth
- **Phase 4 (US3 Criar)**: Depends on Phase 3 (reusa domain/schemas) → sequential
- **Phase 5 (US4 Detalhes)**: Depends on Phase 3 → can run in parallel with Phase 4
- **Phase 6 (US5 Aditivo)**: Depends on Phase 5 (reusa detalhes) → sequential
- **Phase 7 (US6 Bancário)**: Depends on Phase 5 → can run in parallel with Phase 6
- **Phase 8 (US1 Auth Integração)**: Depends on Phase 2+3 → final integration
- **Phase 9 (Export/Files)**: Depends on Phase 3 → cross-cutting
- **Phase 10 (Cleanup)**: Depends on all above
- **Phase 11 (Quality Gate)**: Depends on Phase 10

### Parallel Opportunities

- T002, T003, T004, T005, T006, T007 (Phase 1) — all [P]
- T008, T009, T010, T011 (Phase 2 infra server) — all [P]
- T017, T018 (Phase 3 tests) — [P]
- T019, T020, T021 (Phase 3 domain) — [P]
- T032, T033 (Phase 4 tests) — [P]
- T041 (Phase 5 test) — [P] com T032/T033
- T061, T062 (Phase 9 server functions) — [P]
