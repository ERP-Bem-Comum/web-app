# Módulo `contracts` — Gestão de Contratos

> **Segunda feature do frontend v2**, construída espelhando a `auth/` (feature-modelo).
> Materializa a constituição (v1.3.0) e os ADRs [0001](../../../handbook/adr/0001-vertical-modular-architecture.md),
> [0002](../../../handbook/adr/0002-errors-as-values.md), [0004](../../../handbook/adr/0004-client-server-split-mvvm-ddd.md).
> Cada arquivo tem comentário de topo explicando **o porquê** — copie esse hábito.

## O que o Contracts faz

Slice BFF completo de **gestão de contratos e aditivos**:

- **Tela 1 — Listar Contratos** (`/contratos`): tabela paginada com filtros server-side, ordenação, busca textual e chips de status.
- **Tela 2 — Criar Contrato** (`/contratos/novo`): formulário multi-etapas (dados básicos → contratado → documentos → financeiro).
- **Tela 3 — Detalhes do Contrato** (`/contratos/:id`): visão consolidada com hero, timeline de aditivos, documentos anexados.
- **Tela 4 — Editar Contrato** (`/contratos/:id/editar`): edição parcial (observações, contato).
- **Tela 5 — Aditivar Contrato** (`/contratos/:id/aditivar`): criação de aditivo (prazo, valor, escopo, distrato).

O browser **nunca** fala com o `core-api` direto — todas as operações passam por server functions (BFF).

## A fronteira de ouro: `server/` (DDD) × `client/` (MVVM)

A divisão mais importante do módulo. **A server function é a única fronteira** entre os dois lados —
o `client/` toca o `server/` exclusivamente **chamando** server functions (RPC); jamais importa
`server/domain` ou `server/application` (o lint barra).

Cada camada é sub-agrupada por concern. Imports cross-sublayer dentro do módulo usam `#modules/contracts/…`;
imports entre irmãos da mesma subpasta usam `./`.

```
modules/contracts/
├── server/                              # BFF · server-side · DDD
│   ├── domain/                          # PURO (sem I/O): tipos, VOs, erros como valor
│   │   ├── contracts.types.ts           #   schemas Zod: Contract, Amendment, Money, Period, etc.
│   │   └── errors/contracts.errors.ts   #   união de string literais (contract-not-found | …)
│   ├── application/                     # casos de uso (Result, sem throw)
│   │   ├── commands/                    #   mutações de estado
│   │   │   ├── create-contract.use-case.ts
│   │   │   ├── update-contract.use-case.ts
│   │   │   └── create-amendment.use-case.ts
│   │   └── queries/                     #   leitura
│   │       ├── list-contracts.use-case.ts
│   │       ├── get-contract.use-case.ts
│   │       └── get-contract-history.use-case.ts
│   └── adapters/                        # borda: traduz mundo externo ↔ domínio
│       ├── server-fns/*.server-fn.ts    #   ←★ A FRONTEIRA: RPC list/get/create/update/aditivar
│       ├── core-api/                    #   tudo que fala com o core-api
│       │   ├── core-api-contracts.ts    #     chama /api/v2/contracts/* (HTTP) → Result
│       │   ├── contracts.schema.ts      #     Zod dos responses (validação na borda)
│       │   └── contracts-shared.types.ts #    tipos compartilhados entre adapter e core-api
│       └── contracts.composition.ts     #   wiring lazy das deps (env só em runtime)
│
├── client/                              # FRONT · client-side · MVVM · só consome o BFF
│   ├── domain/                          # COMPARTILHADO: tipos canônicos, status derivation
│   │   ├── types.ts                     #   Contract, ContractRow, branded types, status map
│   │   ├── status.ts                    #   deriveStatus: backend enum → canônico (Pendente | Em Andamento | Finalizado | Distrato)
│   │   ├── schemas.ts                   #   Zod de formulários (criar/editar contrato)
│   │   └── format.ts                    #   helpers de formatação (currency, date, truncate)
│   ├── data/                            # "Model": padroniza o que o BFF já fez + portas
│   │   ├── model/contracts.model.ts     #   Zod do retorno do BFF (Contract, Amendment…)
│   │   ├── repository/                  #   a PORTA → server fn
│   │   │   ├── contracts.repository.ts       # contrato (interface)
│   │   │   └── contracts.repository.instance.ts # instância default
│   │   ├── gateways/*.gateway.ts        #   funções finas que chamam a server fn
│   │   └── helpers/contracts-error-tag.ts    # mapeamento de erros → tags i18n
│   ├── contract-list/                   # Tela 1: Listar Contratos
│   │   ├── contract-list.view-model.ts  #   orquestra: TanStack Query + estado de UI
│   │   ├── contract-list.binding.ts     #   adapter React (useContractListBinding)
│   │   ├── contract-list.controller.ts  #   estado transiente (filtros, chips)
│   │   ├── contract-list.query.ts       #   query string ↔ filtros
│   │   └── page/contract-list.page.tsx  #   Screen: liga ViewModel + Controller + components
│   │   └── components/                  #   views BURRAS (Princípio XI)
│   │       ├── contracts-table.component.tsx
│   │       ├── contract-row.component.tsx
│   │       ├── contract-filters.component.tsx
│   │       ├── contract-paginator.component.tsx
│   │       └── contract-status-chips.component.tsx
│   ├── contract-create/                 # Tela 2: Criar Contrato
│   │   ├── contract-create.view-model.ts
│   │   ├── contract-create.binding.ts
│   │   ├── contract-create.mutation.ts
│   │   └── page/contract-create.page.tsx
│   │   └── components/
│   │       └── contract-form.component.tsx
│   ├── contract-detail/                 # Tela 3: Detalhes do Contrato
│   │   ├── contract-detail.view-model.ts
│   │   ├── contract-detail.binding.ts
│   │   ├── contract-detail.query.ts
│   │   └── page/contract-detail.page.tsx
│   │   └── components/
│   │       ├── contract-hero.component.tsx
│   │       ├── contract-timeline.component.tsx
│   │       └── contract-documents.component.tsx
│   ├── contract-edit/                   # Tela 4: Editar Contrato
│   │   ├── contract-edit.view-model.ts
│   │   ├── contract-edit.binding.ts
│   │   ├── contract-edit.mutation.ts
│   │   └── page/contract-edit.page.tsx
│   │   └── components/
│   │       └── contract-edit-form.component.tsx
│   └── amendment-create/                # Tela 5: Aditivar Contrato
│       ├── amendment-create.view-model.ts
│       ├── amendment-create.binding.ts
│       ├── amendment-create.mutation.ts
│       └── page/amendment-create.page.tsx
│       └── components/
│           └── amendment-form.component.tsx
│
└── public-api/index.ts                  # ★ ÚNICO ponto de import externo ao módulo (ADR-0001)
```

## Fluxos (o caminho dos dados)

### Listar Contratos

`contract-list.page` (burra) → `useContractListBinding` → `contract-list.view-model` →
`listContractsGateway` → `contractsRepository` (porta) → `listContractsFn` **[fronteira]** →
`listContractsUseCase` (server) → `coreApiContracts.list()` → core-api.

O ViewModel gerencia o estado de paginação/filtros via URL query params (driven by chips).
O Controller gerencia o estado transiente de exibição dos filtros avançados.

### Criar Contrato

`contract-create.page` → `useContractCreateBinding` → `contract-create.view-model` →
`createContractGateway` → `createContractFn` **[fronteira]** → `createContractUseCase` →
`coreApiContracts.create()` → core-api. Sucesso: invalidação do cache de listagem + navegação para detalhes.

### Aditivar Contrato

`amendment-create.page` → `useAmendmentCreateBinding` → `amendment-create.view-model` →
`createAmendmentGateway` → `createAmendmentFn` **[fronteira]** → `createAmendmentUseCase` →
`coreApiContracts.createAmendment()` → core-api. Sucesso: invalidação do cache de detalhes.

## Decisões de Domínio (divergências corrigidas vs. spec v1)

| Decisão | Motivação | Status |
|---|---|---|
| `Vigente` → `Em Andamento` | Alinhamento com linguagem do P.O. e v1 | ✅ Implementado |
| `Encerrado` → `Finalizado` | Idem | ✅ Implementado |
| Remover `Rascunho` de `AditivoStatus` | Decisão do P.O. (2026-06-02) | ✅ Implementado |
| `currentValue` exibido como **Valor Atual** | Backend já entrega; não calculamos no client | ✅ Implementado |
| **Saldo** = placeholder `"—"` | Módulo Financeiro ainda não integrado; evita cálculo incorreto | ✅ Implementado |
| Filtros **server-side** (não client-side) | Performance com grandes volumes; dual-state eliminado | ✅ Implementado |
| `startDate` em aditivos | Mapeado do backend (PR #15) | ✅ Implementado |

## Regras que esta feature demonstra (e o lint cobra)

1. **Erros são valores** (`Result<T,E>`, ADR-0002): `throw` só na borda de infra (`core-api-contracts.ts`),
   convertido para `Result` na hora. `QueryError` é a única subclasse de `Error` permitida no client.
2. **`client/` não importa `server/domain|application`** — só chama server fn via repository/porta.
   Views burras não importam `data`/`repository` (orquestração é do view-model/binding).
3. **Domínio puro**: branded types (`ContractId`, `Money`), smart constructors, estado inválido irrepresentável.
4. **Status canônicos**: o backend retorna enum em EN (`Pending`/`Active`/`Expired`/`Terminated`); o client
   mapeia para PT-BR canônico via `deriveStatus`. O filtro usa os valores canônicos e os envia traduzidos
   para o backend no `toQuery`.
5. **Strings de UI = tags i18n** (`shared/i18n`), sem literais; erros internos = literais kebab-case EN.
6. **TDD**: toda unidade pura tem teste (`tests/modules/contracts/**/*.test.ts`); componentes DOM têm
   teste Vitest (`*.spec.tsx`).

## Backend: o que está integrado vs. o que está pendente

### ✅ Já entregue pelo core-api (PRs #12–#15)

- `GET /contracts` — listagem paginada com filtros (`status`, `contractType`, `period`, `value`, `budgetPlanId`)
- `GET /contracts/:id` — detalhe completo com `amendments[]` e `documents[]`
- `POST /contracts` — criação
- `PUT /contracts/:id` — atualização parcial
- `POST /contracts/:id/amendments` — criação de aditivo
- `DELETE /contracts/:id/documents/:docId` — remoção de documento
- Contratado (`supplier`/`financier`/`collaborator`) no detalhe

### ⏳ Campos P1 pendentes no backend

Os seguintes campos ainda **não são persistidos** pelo core-api; o frontend os aceita como opcionais
(e usa defaults/mock quando necessário):

- `classification` (Contrato vs. Ordem de Serviço)
- `contractModel` (Serviço vs. Doação)
- `contractType` (Fornecedor, Financiador, Colaborador, ACT)
- `supplierId` / `financierId` / `collaboratorId` (IDs de contratado)
- `program` / `budgetPlan` (planejamento orçamentário)
- `bancaryInfo` / `pixInfo` (dados bancários do contratado)
- `startDate` em aditivos (já mapeado, mas backend pode não persistir)

> **Nota:** Quando o backend entregar esses campos, basta remover os defaults/mock nos mappers
> (`core-api-contracts.ts`) — a tipagem já está preparada.

## Como rodar / validar

```bash
# Unidades puras (node:test)
pnpm test tests/modules/contracts/**/*.test.ts

# DOM/UI (Vitest + jsdom)
pnpm test:dom tests/modules/contracts/**/*.spec.tsx

# Type-check + lint + build
pnpm typecheck && pnpm lint && pnpm build
```

### Validação manual (browser)

1. Stack local: `docker compose up -d` (MySQL + core-api + Caddy)
2. Frontend dev: `pnpm dev` (host, porta 3000)
3. Acesse `https://app.localhost`
4. Login: `admin@bemcomum.dev` / `DevPassw0rd!2024`
5. Navegue para `/contratos`

### O que validar

- [ ] Tabela carrega com dados reais do backend
- [ ] Filtros de status (chips) funcionam e refletem na URL
- [ ] Filtros avançados (tipo, período, valor, plano) enviam para o backend
- [ ] Ordenação e paginação funcionam
- [ ] Colunas: Código, Objeto, Contratado, Valor Original, Valor Atual, Saldo (placeholder), Vigência, Status
- [ ] Placeholder `"—"` no Saldo (aguardando Financeiro)
- [ ] Redirecionamento para `/login` quando não autenticado

## Roadmap / Pendências

1. **Estilização completa** — a tabela funciona, mas precisa de ajustes visuais (design tokens, espaçamento,
   responsividade). Deixado para etapa final (pós-funcional).
2. **Export CSV** — funcionalidade planejada para a listagem (aguardar confirmação do P.O.).
3. **Testes E2E** — criar suite Playwright para o fluxo completo de contratos.
4. **PUT/PATCH aditivos** — aguardar endpoint do backend para edição de aditivos.
5. **Módulo Financeiro** — quando integrado, substituir placeholder `"—"` do Saldo por cálculo real.
