# ROADMAP — Migração Contratos Next.js → TanStack Start

## Milestone v1.0 — Módulo de Contratos Funcional

**Goal:** Migrar o módulo de Contratos do Next.js legado para TanStack Start com arquitetura em camadas DDD. O restante do sistema intencionalmente quebra.

---

### Phase 1: Bootstrap Infraestrutura TanStack Start

**Goal:** Substituir Next.js runtime por TanStack Start + Vite. Dev server roda na porta 3000.

**Dependencies:** None

**UI hint:** no

**Tasks:** Remover Next.js runtime, configurar Vite, criar entry points, adaptar Tailwind v4, ajustar path aliases, criar root layout.

**Spec ref:** `specs/001-contratos-tanstack-start/tasks.md` T001–T007

---

### Phase 2: Auth e Layout Principal

**Goal:** Autenticação cookie HttpOnly e layout autenticado que bloqueiam TODAS as user stories.

**Dependencies:** Phase 1

**UI hint:** yes

**Tasks:** Env validation, resultFetch, auth middleware, login/logout/getSession Server Functions, useAuth hook, páginas login e layout autenticado, migrar componentes de layout (TopMain, Navigation, PageContainer).

**Spec ref:** `specs/001-contratos-tanstack-start/tasks.md` T008–T016

---

### Phase 3: Listar Contratos (US2)

**Goal:** Tela de listagem paginada com filtros e busca textual.

**Dependencies:** Phase 2

**UI hint:** yes

**Tasks:** Domain types (branded types, smart constructors), schemas (Zod), errors, ports, list-contracts use-case, HTTP adapters, queryKey factory, Server Function getContracts, ContractsTable, ContractFilters, use-contracts hook, route `/contratos`.

**Spec ref:** `specs/001-contratos-tanstack-start/tasks.md` T017–T031

---

### Phase 4: Criar Contrato (US3)

**Goal:** Formulário de criação com validações, auto-save e regras de negócio.

**Dependencies:** Phase 3

**UI hint:** yes

**Tasks:** ContractCreateInputSchema (discriminated union, teto OS, PIX/bancário obrigatório), create-contract use-case, createContract adapter + Server Function, ContractForm (RHF + Zod + auto-save sessionStorage), use-create-contract hook, route `/contratos/adicionar`.

**Spec ref:** `specs/001-contratos-tanstack-start/tasks.md` T032–T040

---

### Phase 5: Visualizar Detalhes e Timeline (US4)

**Goal:** Tela de detalhes com timeline cronológica correta e edição de rascunho.

**Dependencies:** Phase 3 (can run parallel with Phase 4)

**UI hint:** yes

**Tasks:** get-contract use-case, fetchContractById adapter + Server Function, ContractDetail, ContractTimeline (ordenada: base sempre último nó), use-contract hook, route `/contratos/detalhes/$id`.

**Spec ref:** `specs/001-contratos-tanstack-start/tasks.md` T041–T048

---

### Phase 6: Adicionar Aditivo (US5)

**Goal:** Criar aditivos vinculados a contrato pai.

**Dependencies:** Phase 5

**UI hint:** yes

**Tasks:** create-aditive use-case, createAditive adapter + Server Function, AditiveForm (tipos: prazo, valor, escopo, distrato), route `/contratos/aditivo/$id`.

**Spec ref:** `specs/001-contratos-tanstack-start/tasks.md` T049–T054

---

### Phase 7: Atualizar Dados Bancários (US6)

**Goal:** Editar PIX e dados bancários na tela de detalhes.

**Dependencies:** Phase 5 (can run parallel with Phase 6)

**UI hint:** yes

**Tasks:** updateContractPaymentInfo adapter + Server Function, modal ContractBankInfoModal, validação PIX ou bancário obrigatório.

**Spec ref:** `specs/001-contratos-tanstack-start/tasks.md` T055–T057

---

### Phase 8: Auth Integração End-to-End (US1)

**Goal:** Garantir fluxo de auth completo com todas as rotas de contratos.

**Dependencies:** Phase 2 + Phase 3

**UI hint:** no

**Tasks:** Testar redirecionamentos não-autenticado → login, login com auth → contratos, logout limpa cookie e session.

**Spec ref:** `specs/001-contratos-tanstack-start/tasks.md` T058–T060

---

### Phase 9: Exportação e Arquivos

**Goal:** Exportar CSV/PDF e gerenciar uploads.

**Dependencies:** Phase 3

**UI hint:** no

**Tasks:** exportContractsCsv, exportContractsPdf, uploadContractFiles (FormData), botões de exportação na tabela, upload em formulários.

**Spec ref:** `specs/001-contratos-tanstack-start/tasks.md` T061–T064

---

### Phase 10: Cleanup e Breaking Changes

**Goal:** Remover legado Next.js desnecessário.

**Dependencies:** All above

**UI hint:** no

**Tasks:** Remover API routes NextAuth, rotas não-migradas, next.config.js, dependências Next.js, atualizar firebase.json para Nitro output.

**Spec ref:** `specs/001-contratos-tanstack-start/tasks.md` T065–T069

---

### Phase 11: Quality Gate

**Goal:** Garantir que tudo passa nos checks de qualidade.

**Dependencies:** Phase 10

**UI hint:** no

**Tasks:** format:check, lint, typecheck, test:run (domain ≥80%, adapters happy+erro), build.

**Spec ref:** `specs/001-contratos-tanstack-start/tasks.md` T070–T074

---

## Backlog

(None yet)
