# Implementation Plan: Integração Parceiros × Contratos

**Branch**: `feat/contract-partner-integration-025` | **Date**: 2026-06-11 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/025-contract-partner-integration/spec.md`

## Summary

5 user stories frontend-only entre `contracts` e `partners`, sem tocar core-api:
- **US1**: ao selecionar o contratado, buscar o detalhe do parceiro (server fn por tipo, via
  `partners/public-api`) e pré-preencher os campos do contrato — **banco/PIX somente-leitura**,
  **e-mail/telefone editáveis**. O padrão já existe para Fornecedor; estender p/ ACT/Financiador/Colaborador.
- **US2**: propagar o contratado **ACT** no client (grid + detalhe) — já vem do backend; corrigir o bug.
- **US3**: máscara de telefone na seção Contato (inclusão + detalhe) via `Input mask="phone"`.
- **US4**: "cadastrar novo parceiro" → navega in-app ao módulo de parceiros com `?returnTo` e volta no sucesso.
- **US5**: auto-preencher a chave PIX (cpf/cnpj→cnpj, email→email) no cadastro de Fornecedor/ACT.

## Technical Context

**Language/Version**: TypeScript strict, React 19. **Deps**: TanStack Start/Router/Query, Zod 4, vanilla-extract.
**Storage**: N/A (BFF). **Testing**: node:test (puros) + Vitest/jsdom. **Project Type**: web modular vertical.
**Constraints**: invariantes v2 (lint); server fn = única fronteira; banco/PIX do contrato **não** editáveis.
**Scale/Scope**: ~20 arquivos tocados em 2 módulos; 1 helper puro novo (derivePixKey) + 1 mapper puro (US1).

## Constitution Check

- Erros como valores; sem any/class/this; imutabilidade: ✅ (mappers puros, Result nas server fns reusadas).
- Server fn = única fronteira: ✅ (reusa getSupplierFn/getActFn/getFinancierFn/getCollaboratorFn).
- Boundaries por public-api: ✅ (contracts→partners só via `partners/public-api`; exportar getCollaboratorFn).
- Views burras (MVVM): ⚠️ a busca do detalhe ao selecionar fica na page (`handleSelectPartner`) — **padrão
  já existente** (supplier hoje); mantido por consistência. Lógica de mapeamento extraída p/ função pura.
- Só-tokens / i18n / naming / switch never: ✅ (sem CSS novo; novos textos via i18n; guard never em
  contractType e pixKeyType).
- **Resultado**: PASS (sem violações novas; a chamada na page segue o padrão vigente).

## Project Structure

### Source Code (arquivos por US)

```text
US1 — pré-preencher contratado:
  src/modules/partners/public-api/index.ts                      # EDIT  export getCollaboratorFn (+ tipo)
  src/modules/contracts/client/contract-create/
    partner-detail-to-contract.ts                               # NOVO  partnerDetailToContractFields (puro)
    page/contract-create.page.tsx                                # EDIT  handleSelectPartner: branches ACT/Financiador/Colaborador
  (contract-form.component/controller, contract-detail/*)        # SEM mudança (campos já existem/exibem)

US2 — ACT no grid/detalhe:
  src/modules/contracts/client/domain/types.ts                  # EDIT  Contract += act?
  src/modules/contracts/client/data/model/contracts.model.ts    # EDIT  ContractSchema += act?
  src/modules/contracts/client/contract-list/contract-list.view-model.ts  # EDIT  map act/actId
  src/modules/contracts/client/contract-list/components/contract-row.component.tsx # EDIT  getContractorFromRow ACT
  src/modules/contracts/client/contract-detail/components/contract-info.component.tsx # EDIT  +act fallback/typeLabel

US3 — máscara telefone:
  src/modules/contracts/client/contract-create/components/contract-form.component.tsx     # EDIT input→Input mask="phone"
  src/modules/contracts/client/contract-detail/components/contract-contato.component.tsx  # EDIT idem

US4 — novo parceiro com retorno:
  src/modules/contracts/client/contract-create/page/contract-create.page.tsx  # EDIT handleCreateNewPartner → navigate+returnTo
  src/routes/_authenticated/parceiros/{fornecedores,colaboradores,atos,financiadores}/criar.tsx # EDIT validateSearch returnTo
  src/modules/partners/client/{supplier,act,collaborator,financier}-create/*-create.binding.ts  # EDIT onSuccess → safeRedirect(returnTo)

US5 — auto-PIX:
  src/modules/partners/client/domain/derive-pix-key.ts          # NOVO  derivePixKey (puro)
  src/modules/partners/client/supplier-create/components/supplier-form.component.tsx # EDIT onChange select tipo PIX
  src/modules/partners/client/act-create/components/act-form.component.tsx           # EDIT idem

Tests:
  tests/modules/contracts/client/contract-create/partner-detail-to-contract.test.ts   # NOVO (US1)
  tests/modules/contracts/client/contract-list/contractor-act.test.ts                  # NOVO (US2)
  tests/modules/partners/client/domain/derive-pix-key.test.ts                          # NOVO (US5)
  *.spec.tsx (vitest): auto-PIX no form; máscara telefone; grid ACT (deferir frágil c/ justificativa)
```

**Structure Decision**: dois módulos verticais (`contracts`, `partners`), cruzamento só via
`partners/public-api`. Aditivo; sem CSS novo; helpers puros para o que é testável.

## Complexity Tracking

N/A — sem violações de constituição.

## Migrations / Contrato HTTP (core-api)

N/A — feature **frontend-only**; reusa server fns e endpoints existentes. Sem mudança de schema/HTTP no backend.

## Estimativa de Pipeline (W0 size)

- **Tamanho**: **M/L** — 5 user stories, ~20 arquivos em 2 módulos, mas cada US é localizada e há muito reuso.
- **Plano de testes RED**:
  - `partner-detail-to-contract.test.ts` (US1): mapeia por tipo só os campos existentes.
  - `derive-pix-key.test.ts` (US5): cpf/cnpj→cnpj, email→email, phone/random→''.
  - `contractor-act.test.ts` (US2): `getContractorFromRow('ACT')` → snapshot act.
- **Ordem sugerida**: US2 + US3 (rápidas, contracts) → US5 (partners, puro) → US1 (mapper + page) →
  US4 (rotas + bindings). Polish ao fim.

## Decisões-chave (de research.md)
- US1: banco/PIX só-leitura (popular disabled); mapper puro por tipo; degrade em erro; exportar getCollaboratorFn.
- US2: act/actId aditivo no client; ACT já vem do backend; guard never em contractType.
- US3: `Input mask="phone"` (salva dígitos).
- US4: `?returnTo` + `safeRedirect` (reuso do padrão login); voltar simples (sem rascunho); default fornecedores.
- US5: derivePixKey puro; troca de tipo re-deriva (random/sem-fonte → limpa); só Fornecedor/ACT.
