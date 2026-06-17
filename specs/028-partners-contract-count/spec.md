# Feature Specification: Contagem de contratos nos grids de parceiros

**Feature Branch**: `integration/partners-contract-count-028`

**Created**: 2026-06-17

**Status**: Implemented (validação manual em tela pendente — T012)

**Input**: O core-api passou a expor `contractCount` (nº de contratos ativos) no item de lista de cada parceiro (#46/#105/#107, US6). O front deve exibir essa contagem nos grids de parceiros, removendo o placeholder gated ("—") que já existe no grid de Colaborador.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Ver quantos contratos cada parceiro tem na listagem (Priority: P1)

Um operador abre a listagem de Fornecedores (ou Financiadores, ACTs, Colaboradores) e vê, em cada linha, quantos contratos **ativos** aquele parceiro possui — sem precisar abrir o detalhe ou cruzar com o módulo de Contratos.

**Why this priority**: É o objetivo único da feature; o backend já entrega o dado e o front hoje mostra placeholder "—" (Colaborador) ou nada (demais). É um ganho de informação direto, baixo risco.

**Independent Test**: Abrir cada grid de parceiro e confirmar que a coluna "Contratos" mostra o número vindo do backend (ex.: `3`), e `0` para quem não tem contrato ativo.

**Acceptance Scenarios**:

1. **Given** a listagem de Fornecedores, **When** um fornecedor tem 3 contratos ativos, **Then** a linha exibe `3` na coluna "Contratos".
2. **Given** a listagem de Colaboradores (que hoje exibe "—" gated), **When** a feature entra, **Then** a coluna passa a exibir a contagem real (un-gate).
3. **Given** um parceiro sem contratos ativos, **When** listado, **Then** a coluna exibe `0`.
4. **Given** os grids de Financiador e ACT, **When** exibidos, **Then** também mostram a contagem (consistência entre os 4 grids).

### Edge Cases

- **Contagem ausente/zero**: o backend define `contractCount` como não-nullable (inteiro ≥ 0); a UI sempre exibe um número (nunca "—" por dado ausente). Se, por robustez, o valor vier ausente do parse, exibir `0`.
- **Semântica**: a contagem representa contratos **atualmente ativos** (ciclo de vida: criado +1; encerrado/cancelado −1). A UI não rotula "ativos" além do header da coluna, para não poluir — texto final fica a cargo da P.O.
- **Ordenação/filtro por contagem**: fora de escopo (o backend não expõe ordenação por esse campo nesta entrega).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Cada grid de parceiro (Fornecedor, Financiador, ACT, Colaborador) MUST exibir uma coluna "Contratos" com o valor de `contractCount` do item da lista.
- **FR-002**: O valor MUST vir do item da lista do backend (sem chamada extra por parceiro / sem cruzamento client-side com Contratos).
- **FR-003**: A coluna gated existente do grid de Colaborador (placeholder "—") MUST ser substituída pela contagem real.
- **FR-004**: Parceiro sem contratos ativos MUST exibir `0`.
- **FR-005**: A mudança MUST ser aditiva, sem regressão nas demais colunas/funcionalidades dos grids, com gates verdes.
- **FR-006**: O header da coluna MUST usar tag i18n (sem literal).

### Key Entities _(include if feature involves data)_

- **contractCount**: inteiro ≥ 0, não-nullable, presente em cada item de lista de parceiro. Representa contratos atualmente ativos do parceiro. Resolvido no backend (read-model); o front apenas lê e exibe.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Nos 4 grids de parceiros, 100% das linhas exibem um número inteiro na coluna "Contratos" (nunca vazio/"—" por dado ausente).
- **SC-002**: A contagem exibida bate com o `contractCount` retornado pelo backend para cada parceiro (verificável via inspeção da resposta vs. tela).
- **SC-003**: Zero chamadas HTTP adicionais por linha/parceiro para obter a contagem (lida do item da lista).
- **SC-004**: Nenhuma regressão nas colunas/ações existentes dos grids (suítes verdes).

## Impacto Arquitetural (frontend / BFF) _(obrigatório)_

> Feature **somente frontend** — o core-api já entrega `contractCount` (#46). Sem alteração no backend.

- **Bounded Contexts afetados**: [x] Parceiros (4 grids: supplier/financier/act/collaborator) — display.
- **Borda envolvida**: schemas de response dos adapters core-api de partners (adicionar `contractCount`), models de item de lista (client), view-models/colunas dos grids.
- **Prefixo de API**: partners já é `/api/v1` no front (confirmado) — sem migração.
- **Invariantes**: validação Zod na borda (campo novo no `*.schema.ts`), tokens-only no DS, views burras (coluna recebe dado por props/view-model), i18n no header.

## Assumptions

- Contrato confirmado pelo core-api-consultant: `contractCount: number` (int, ≥ 0, **não-nullable**) no item de lista dos 4 grids individuais e no agregado `GET /api/v1/partners`.
- O agregado `/api/v1/partners` é usado no front apenas pelo **picker de parceiro do módulo Contratos** (não é grid de exibição) → fora do escopo desta feature.
- Semântica "contratos ativos" pelo mecanismo de ciclo de vida do backend (created +1 / ended|cancelled −1).
- Feature construída sobre `develop` (independente do PR #35); PR próprio apontando para `develop` (1 feature por PR).
- Texto exato do header da coluna ("Contratos") fica sujeito a refino da P.O.; usamos a tag i18n existente onde houver.
