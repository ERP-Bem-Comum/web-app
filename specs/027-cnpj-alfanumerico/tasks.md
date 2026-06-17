---
description: 'Task list — CNPJ alfanumérico (Serpro/2026) no frontend'
---

# Tasks: CNPJ alfanumérico (Serpro/2026) no frontend

**Input**: Design documents from `specs/027-cnpj-alfanumerico/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cnpj-helper.contract.md

**Tests**: INCLUÍDOS — TDD foi pedido explicitamente (RED antes da implementação). Testes puros em
`node:test` (`*.test.ts`, imports relativos).

**Organization**: por user story. A Fundação (helper compartilhado) bloqueia todas as stories.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: US1 / US2 / US3

## Path Conventions

- App único (front + BFF): `src/`, `tests/` na raiz. Espelha `src/` → `tests/`.

---

## Phase 1: Setup

**Purpose**: preparar a base da feature (branch já criada a partir de `contas-a-pagar-026`).

- [x] T001 Confirmar a estrutura de pastas da feature e criar o diretório de testes `tests/shared/document/` (mkdir) para receber os testes do helper.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: helper puro compartilhado de CNPJ + máscara do Design System. TODAS as user stories dependem disto.

**⚠️ CRITICAL**: nenhuma user story pode começar antes desta fase.

- [x] T002 [P] (RED) Escrever os testes do helper em `tests/shared/document/cnpj.test.ts` cobrindo `normalizeCnpj`, `isValidCnpjFormat`, `maskCnpj`, `maskCpf`, `maskCpfCnpj`, `isCnpjLength` com os fixtures de `contracts/cnpj-helper.contract.md` (válidos: `11222333000181`, `12ABC34501DE35`, `A1B2C3D4E5F668`, `12.ABC.345/01DE-35`, `12abc34501de35`; inválidos de formato: `12ABC34501DEAB`, `00000000000000`, `123`, `112223330001810`). Garantir que FALHAM (helper ainda não existe).
- [x] T003 Implementar o helper puro em `src/shared/document/cnpj.ts` (`normalizeCnpj` = `replace(/[.\-/\s]/g,'').toUpperCase()`; `isValidCnpjFormat` = `^[0-9A-Z]{12}[0-9]{2}$` + anti-degenerado `^(.)\1{13}$`; `maskCnpj` agrupando `XX.XXX.XXX/XXXX-NN`; `maskCpf` numérico; `maskCpfCnpj` com heurística D3; `isCnpjLength`) até `tests/shared/document/cnpj.test.ts` ficar verde.
- [x] T004 Refatorar a máscara do Design System `src/shared/ui/atoms/input/input.mask.ts` para consumir o helper (`maskCnpj` alfanumérico e `maskCpfCnpj` com heurística "letra ⇒ CNPJ; senão por comprimento normalizado"), mantendo `maskCpf`/`phone`/`agency` intactos. Sem literais de medida/cor (regra DS).

**Checkpoint**: helper + máscara prontos e testados — user stories podem começar.

---

## Phase 3: User Story 1 - Cadastrar/editar parceiro com CNPJ alfanumérico (Priority: P1) 🎯 MVP

**Goal**: digitar, validar (formato + DV) e enviar ao backend um CNPJ alfanumérico em Fornecedor/Financiador/ACT, sem regressão para numérico.

**Independent Test**: cadastrar parceiro com `12abc34501de35` → campo mascara com letras, validação OK, BFF recebe 14 chars maiúsculos; `12ABC34501DE34` → backend retorna `invalid-cnpj` exibido.

### Tests for User Story 1 (TDD — RED first) ⚠️

- [x] T005 [P] [US1] (RED) Estender `tests/modules/partners/server/domain/value-objects.test.ts` com casos alfanuméricos do VO `CNPJ`: válido `12ABC34501DE35` → `ok`; DV inválido `12ABC34501DE34` → `err('invalid-check-digit')`; formato inválido `12ABC34501DEAB`; aceitar máscara `12.ABC.345/01DE-35`. Manter os casos numéricos existentes. Garantir que os novos FALHAM.

### Implementation for User Story 1

- [x] T006 [US1] Estender o VO `src/modules/partners/server/domain/value-objects/cnpj.value-object.ts`: normalização alfanumérica (via helper `normalizeCnpj`/`isValidCnpjFormat`) + DV com a fórmula Serpro (`valor(c) = c.charCodeAt(0) − 48`, pesos atuais módulo 11) sobre os 14 caracteres. Resultado idêntico para numérico (zero regressão). `value-objects.test.ts` verde.
- [x] T007 [P] [US1] Atualizar `CnpjFieldSchema` em `src/modules/partners/client/data/model/supplier.model.ts` para `.transform(normalizeCnpj).refine(isValidCnpjFormat, { error: 'cnpj-invalid' })`.
- [x] T008 [P] [US1] Atualizar `CnpjFieldSchema` em `src/modules/partners/client/data/model/financier.model.ts` (mesmo tratamento de T007).
- [x] T009 [P] [US1] Atualizar `CnpjFieldSchema` em `src/modules/partners/client/data/model/act.model.ts` (hoje só `.transform(onlyDigits)`) para normalizar alfanumérico + `refine(isValidCnpjFormat)`.
- [x] T010 [P] [US1] Trocar `onlyDigits(input.cnpj)` por `normalizeCnpj(input.cnpj)` no envio em `src/modules/partners/server/adapters/core-api/core-api-suppliers.ts` (garantir length 14).
- [x] T011 [P] [US1] Idem em `src/modules/partners/server/adapters/core-api/core-api-financiers.ts`.
- [x] T012 [P] [US1] Idem em `src/modules/partners/server/adapters/core-api/core-api-acts.ts`.
- [x] T013 [US1] Mapear o erro de backend `invalid-cnpj` (422) para uma tag i18n em `src/shared/i18n/catalog.pt-BR.ts` (texto default pt-BR) e garantir que o helper de erro de parceiros usa essa tag.
- [x] T014 [US1] Verificar que `tests/modules/partners/server/domain/{supplier,financier,act}.test.ts` (fixtures numéricos) seguem verdes; ajustar SÓ se algum fixture quebrar por mudança de mensagem/forma (aditivo).

**Checkpoint**: cadastro/edição de parceiro com CNPJ alfanumérico funcional e testado; numérico sem regressão.

---

## Phase 4: User Story 2 - Visualizar CNPJ alfanumérico já cadastrado (Priority: P1)

**Goal**: exibir corretamente CNPJs alfanuméricos em listagens/detalhes de Contratos e no grid de Contas a Pagar, sem perder letras; CPF/numérico intactos.

**Independent Test**: renderizar linha/detalhe com `A1B2C3D4E5F668` → exibe `A1.B2C.3D4/E5F6-68`; CPF `000.000.000-00` e CNPJ numérico seguem corretos.

### Implementation for User Story 2

- [x] T015 [P] [US2] Substituir a formatação por dígitos por `maskCnpj`/`maskCpf` do helper em `src/modules/contracts/client/contract-list/contract-list.view-model.ts` (classificar por comprimento normalizado: 14 → CNPJ, 11 → CPF).
- [x] T016 [P] [US2] Idem em `src/modules/contracts/client/contract-list/components/contract-row.component.tsx`.
- [x] T017 [P] [US2] Idem em `src/modules/contracts/client/contract-detail/components/contract-info.component.tsx`.
- [x] T018 [P] [US2] Idem em `src/modules/contracts/client/contract-create/components/contract-form.component.tsx`.
- [x] T019 [P] [US2] ~~Idem em `amendment-modal.component.tsx`~~ — **N/A**: a função `digits` desse arquivo é máscara de MOEDA (centavos), não CNPJ. Sem ponto de CNPJ a alterar (falso-positivo do grep inicial).
- [x] T020 [P] [US2] Substituir o `maskCnpj` de exibição em `src/modules/financial/client/contas-a-pagar-list/contas-a-pagar.view-model.ts` pelo helper (CNPJ alfanumérico sob o nome do fornecedor; CPF intacto).
- [x] T021 [US2] (opcional) Cobertura de exibição: os helpers de exibição agora são delegações finas a `maskCnpj`/`maskCpf` do helper, **cobertos pelos testes unitários** de `tests/shared/document/cnpj.test.ts` (incl. `A1B2C3D4E5F668` → `A1.B2C.3D4/E5F6-68`). Sem teste de view-model adicional.

**Checkpoint**: telas de leitura exibem CNPJ alfanumérico corretamente; sem regressão de CPF/numérico.

---

## Phase 5: User Story 3 - Buscar fornecedor por CNPJ no Lançar Documento (Priority: P2)

**Goal**: o filtro do picker de fornecedor funciona para CNPJ alfanumérico, sem quebrar busca por nome/numérico.

**Independent Test**: digitar `ABC345` no picker → fornecedor com CNPJ alfanumérico aparece; busca por dígitos numéricos segue funcionando.

### Implementation for User Story 3

- [x] T022 [US3] Em `src/modules/financial/client/document-create/document-form.view.ts`: trocar `isCnpj` para usar `isCnpjLength`/`isValidCnpjFormat` do helper e normalizar alfanumérico (não só dígitos) na comparação de busca por subtitle (`query` e `subtitle` ambos via `normalizeCnpj`), preservando a busca por nome.
- [x] T023 [US3] (se houver teste puro do filtro) Cobrir o filtro com um caso de CNPJ alfanumérico em `tests/modules/financial/.../document-form.view.test.ts`, mantendo os casos existentes.

**Checkpoint**: busca de fornecedor por CNPJ alfanumérico funcional.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: garantir zero regressão e validação fim-a-fim.

- [x] T024 Rodar `pnpm typecheck` e `pnpm lint` → 0 erros (warnings pré-existentes OK); corrigir o que a feature introduzir.
- [x] T025 Rodar `pnpm test` e `pnpm test:dom` → todas verdes (helper + VO + suítes de parceiros/contratos/financeiro sem regressão).
- [x] T026 Validação manual conforme `quickstart.md` na stack local (cadastro alfanumérico, DV inválido → `invalid-cnpj`, retrocompat numérico, exibição em Contratos/Financeiro, busca de fornecedor).
- [x] T027 Atualizar o `Status` da spec para `Implemented` em `specs/027-cnpj-alfanumerico/spec.md` e marcar os itens do `quickstart.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (P1)**: sem dependências.
- **Foundational (P2)**: depende do Setup. **BLOQUEIA** todas as user stories (helper + máscara).
- **US1 (P3) / US2 (P4) / US3 (P5)**: dependem só da Fundação; entre si são independentes (arquivos distintos).
- **Polish (P6)**: depois das stories desejadas.

### Within Each User Story

- Testes RED antes da implementação (T002 antes de T003; T005 antes de T006).
- Helper (Fundação) antes de tudo.
- VO/schemas/adapters (US1) e exibição (US2) tocam arquivos diferentes → paralelizáveis após a Fundação.

### Parallel Opportunities

- **US1**: T007, T008, T009 (3 models) + T010, T011, T012 (3 adapters) são `[P]` (arquivos distintos). T006 (VO) antes pois schemas/adapters dependem do helper, não do VO — na prática T007–T012 podem ir junto de T006.
- **US2**: T015–T020 são todas `[P]` (arquivos distintos).
- **US1 e US2** podem ser tocadas em paralelo após a Fundação (não compartilham arquivos).

---

## Parallel Example: User Story 1 (após Fundação)

```bash
# Models (paralelo):
T007 supplier.model.ts · T008 financier.model.ts · T009 act.model.ts
# Adapters (paralelo):
T010 core-api-suppliers.ts · T011 core-api-financiers.ts · T012 core-api-acts.ts
```

## Parallel Example: User Story 2

```bash
T015 contract-list.view-model.ts · T016 contract-row.component.tsx · T017 contract-info.component.tsx
T018 contract-form.component.tsx · T019 amendment-modal.component.tsx · T020 contas-a-pagar.view-model.ts
```

---

## Implementation Strategy

### MVP (Fundação + US1)

1. Phase 1 (Setup) → Phase 2 (Fundação: helper + máscara, TDD) → Phase 3 (US1).
2. **STOP e VALIDE**: cadastrar parceiro com CNPJ alfanumérico + retrocompat numérico.

### Incremental

1. Fundação pronta → US1 (cadastro) → valida → US2 (exibição) → valida → US3 (busca).
2. Cada story agrega valor sem quebrar as anteriores.

---

## Notes

- [P] = arquivos diferentes, sem dependência pendente.
- Zero regressão: a fórmula de DV alfanumérica (Serpro) é idêntica para numérico; suítes existentes guardam isso.
- DV vive no VO (domínio), NÃO no helper compartilhado (que é só formato/máscara).
- Commitar após cada grupo lógico; mensagens `tipo(<bc>/<scope>): descrição`, sem heredoc.
