# Implementation Plan: 118 — Número do contrato informável na criação

**Branch**: `feat/118-numero-contrato-manual` | **Date**: 2026-10-02 | **Spec**: [spec.md](./spec.md)

**Backend**: `core-api#1024`, **ainda aberta** em 2026-10-02 (sem PR). Os nomes dos erros foram conferidos no
código do core-api (`create-contract.ts`, `domain/contract/errors.ts`, `adapters/http/plugin.ts`).

## Summary

O Novo Contrato ganha o campo opcional **"Número do contrato"**. Preenchido, o número vai ao core-api em
`sequentialNumber`. Vazio, o core-api gera o número como hoje. O "CT 0001/AAAA" fixo do topo, que era um
número inventado, dá lugar ao número informado ou a "número a definir".

## Desenho técnico

| Camada          | Arquivo                                                  | Mudança                                                                                                                                                                                |
| --------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domínio (BFF)   | `server/domain/contracts.types.ts`                       | `CreateContractInput.sequentialNumber?`; erro novo `contract-number-duplicated`                                                                                                        |
| io-schema (BFF) | `server/adapters/contracts.schemas.ts`                   | `sequentialNumber` opcional com `/^\d{3,4}\/\d{4}$/` (o drift guard trava o domínio junto)                                                                                             |
| Adapter         | `server/adapters/core-api/core-api-contracts.ts`         | corpo leva `sequentialNumber` **só quando presente**; `contract-sequential-number-duplicated` → `contract-number-duplicated`; `ContractSequentialNumberInvalidFormat` → `invalid-code` |
| Model (client)  | `client/data/model/contracts.model.ts`                   | mesmo campo e regex no `CreateContractInputSchema`                                                                                                                                     |
| Controller      | `contract-create/components/contract-form.controller.ts` | `contractNumber` no estado; `maskContractNumber` e `isContractNumberValid` **puros**; `contractNumberInvalid`; `submit()` omite o campo vazio                                          |
| Page            | `contract-create/page/contract-create.page.tsx`          | número inválido bloqueia o envio e acende a validação, como os demais obrigatórios                                                                                                     |
| View            | `contract-create/components/contract-form.component.tsx` | campo com máscara e ajuda; topo com o número ou "número a definir"; sai o `currentYear`                                                                                                |
| Erro → tag      | `client/data/helpers/contracts-error-tag.ts`             | `contracts.error.number-duplicated`                                                                                                                                                    |
| CSV             | `contract-list/contract-list.view-model.ts`              | o prefixo vem da classificação (antes toda OS saía "CT")                                                                                                                               |

## Constitution Check

| Princípio             | Aderência | Nota                                                                                     |
| --------------------- | --------- | ---------------------------------------------------------------------------------------- |
| II Erros como valores | ✓         | erro novo na união `ContractsError`; `switch` exaustivo na tag                           |
| IV Estados ilegais    | ✓         | número fora do formato não sai do formulário; ausente ≠ vazio no corpo                   |
| V Cadeia de erro      | ✓         | 409/422 viram tags; a UI não olha status                                                 |
| VI Zod na borda       | ✓         | formulário, input da server fn e (no backend) o domínio                                  |
| X Só tokens           | ✓         | linha nova reusa `grid4Contract`, `fieldHint`, `fieldHintError`; margem por `vars.space` |
| XI MVVM               | ✓         | máscara e validação são funções puras no controller; view só apresenta                   |
| ADR-0013              | ✓         | esclarecido pelo **ADR-0022** (supersedes parcial): número digitado ≠ número inventado   |

## Testes

- **node:test** (`contract-number.test.ts`): máscara; validação (vazio, `0123/2024`, `123/2024`, recusas); schemas
  client e BFF; `SLUG_TO_ERROR` dos dois erros; tag do 409.
- **node:test** (`create-contract-pending.test.ts`): corpo do `POST` sem `sequentialNumber` quando vazio e com ele
  quando preenchido.
- **node:test** (`contracts-csv.test.ts`): OS sai "OS", Contrato sai "CT".
- **Vitest/jsdom**: controller (`submit()`, `contractNumberInvalid`) e view (topo "número a definir", topo com
  CT/OS + número, máscara ao digitar, erro de formato).

## Ordem de entrega

O front **só vai para a `develop` depois da core-api#1024 na `dev`**. Antes disso, o core-api descarta o campo
em silêncio e o contrato sai com o número gerado, não com o informado.
