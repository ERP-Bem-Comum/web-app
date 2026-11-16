# Implementation Plan: Relatório da Conciliação no modelo de extrato

**Branch**: `feat/132-relatorio-conciliacao-extrato` (web-app) + branch própria no core-api a partir de `dev` | **Date**: 2026-11-06 | **Spec**: [spec.md](./spec.md)

## Summary

Enriquecer a leitura do extrato por período com a conciliação de cada transação, para tela e PDF usarem a mesma fonte. No front, reescrever o bloco de impressão no modelo de extrato e acrescentar seta, tag e modais na tela Extrato. No core-api, corrigir também o CSV do lote com tarifa.

**Tamanho:** L em volume, com dois repositórios, mas sem migration e sem mudança de regra de gravação. Só leitura, exceto a correção do CSV, que também é leitura.

## Technical Context

**Language/Version**: TypeScript estrito · **Meta-framework**: TanStack Start · **Server-state**: TanStack Query · **Validação**: Zod 4 · **UI**: React 19 · **Design System**: vanilla-extract, só tokens

**Testes**: `node:test` para view-model e `tests/modules/financial/**` no core-api; Vitest/jsdom para componentes.

**Constraints**: sem dependência nova; Conciliação é código do tech lead, mudança aditiva, sem regressão; colunas do Nibo intactas.

**Performance**: uma leitura em lote por período, sem chamada por transação.

## Contrato (core-api)

Acréscimo opcional em `GET /financial/cedente-accounts/:id/statement?from&to&include=reconciliation`. Sem o parâmetro, a resposta é idêntica à de hoje.

Cada linha ganha:

```ts
reconciliation: null | {
  reconciliationId: string
  titles: ReadonlyArray<{
    payableId: string
    documentNumber: string | null
    payeeName: string | null
    retentionType: string | null
    dueDate: string | null
    reconciledValueCents: string
  }>
}
```

Com `include`, a resposta também traz `companyName`, com fonte única em `domain/cedente/company-name.ts`. O CNPJ já existe em `document`.

## Mudanças no core-api

| Onde                                                                     | O quê                                              |
| ------------------------------------------------------------------------ | -------------------------------------------------- |
| `application/ports/reconciliation-repository.ts` + drizzle + in-memory   | Novo `findActiveItemsByTransactions(ids)`, em lote |
| `application/ports/payable-summary-by-ids-view.ts` + drizzle + in-memory | Acrescentar `retentionType`                        |
| `application/use-cases/get-statement-reconciled-titles.ts` (novo)        | Compor os títulos em duas leituras                 |
| `adapters/http/{plugin,schemas,dto}.ts`                                  | Parâmetro `include` e campos opcionais             |

O CSV (`export-reconciliation-nibo.ts`) não muda: já gera uma linha por título. Com o painel de diferença retirado, o lote com tarifa não é mais criado pela tela; registros já gravados assim, se existirem, seguem saindo sem a linha da tarifa.

## Mudanças no web-app

| Camada     | Arquivo                                                                                                                         | O quê                                                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BFF        | `server/adapters/core-api/reconciliation.schema.ts`, `.mappers.ts`, `core-api-reconciliation.ts`, `domain/reconciliation.io.ts` | Validar e mapear `reconciliation` e `companyName` (`.catch(null)` na conciliação **não**: falha vira erro, spec Edge Cases)                                          |
| Model      | `client/data/model/reconciliation.model.ts`                                                                                     | Tipos novos em `StatementTransaction`                                                                                                                                |
| View-model | `reconciliation-report.view-model.ts`                                                                                           | Reescrita: resumo, linhas, títulos, emissão (`isBatch = titles.length > 1`)                                                                                          |
| View-model | `reconciliation-workspace.view-model.ts`                                                                                        | Modal do lote ("Pagamento em lote · N títulos") e modal individual, reaproveitando `matchDocFromItem` e `buildMatchTitles`; quem conciliou permanece nos modais      |
| Binding    | `reconciliation-report.binding.ts`, `match-details.binding.ts`, `reconciliation-workspace.binding.ts`                           | Nome do usuário da sessão; título aberto no modal; linhas abertas (UI-state)                                                                                         |
| View       | `page/reconciliation-report.page.tsx` + `.css.ts`                                                                               | Layout da referência da P.O.; logo nova (`public/images/logo-bem-comum-email.png`) no canto superior direito; paleta `brand`; `thead` repetido; emissão no cabeçalho |
| View       | `components/search-create-pane.component.tsx`, `search-create.binding.ts`                                                       | Painel de tratamento da diferença retirado; `canReconcileMulti` exige totais batendo, com motivo visível                                                             |
| View       | `components/statement-grid.component.tsx`, `match-details-modal.component.tsx`                                                  | Seta, tag, títulos expansíveis conforme imagem da P.O., valor da saída clicável, modal de lote e individual                                                          |
| i18n       | `shared/i18n/catalog.pt-BR.ts`                                                                                                  | Textos novos                                                                                                                                                         |

**Linha do Extrato:** hoje a linha conciliada inteira é um `<button>`, e botão não pode conter botão. A seta fica ao lado, como elemento irmão, sem envolver a linha inteira.

**Rodapé do navegador:** mantido (decisão da P.O.). Data e hora de emissão e nome do usuário ficam no cabeçalho do próprio relatório.

## Riscos

| Risco                                              | Mitigação                                                                           |
| -------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Regressão na tela Extrato, que usa a mesma leitura | `include` opcional; `pnpm verify` + `pnpm test:dom`                                 |
| Web-app publicado antes do core-api                | Sem o `include`, a leitura volta sem títulos: publicar o core-api primeiro          |
| Registro com tarifa no painel antigo               | Modal e PDF não mostram a tarifa; a P.O. informou que esse processamento não ocorre |

## Testes

- **core-api:** `get-statement-reconciled-titles.test.ts` e `statement-readmodel.http.test.ts`.
- **web-app (`node:test`):** view-model do relatório: lote, não-lote, título não resolvido, coluna Entrada, emissão.
- **web-app (DOM):** PDF com lote; seta sem abrir modal; tag; modal do título; bloqueio de Conciliar sem painel.
- **Prévia visual:** PDF e tela renderizados com dados de exemplo. Falta validar com dados reais em ambiente.

## Constitution Check

| Princípio                          | Aderência | Nota                                                       |
| ---------------------------------- | --------- | ---------------------------------------------------------- |
| I. BFF-Orchestrated Boundary       | ✓         | Browser só fala com a server fn existente; core-api compõe |
| II. Errors Are Values              | ✓         | Erros seguem `Result`                                      |
| III. Client×Server Modular         | ✓         | Tudo em `financial`                                        |
| IV. Illegal States Unrepresentable | ✓         | Estado do relatório em união + `switch`                    |
| V. Server-State ≠ UI-State         | ✓         | Linhas abertas são UI-state; dados no Query                |
| VI. Validation at the Boundary     | ✓         | Zod na resposta do core-api                                |
| VII. Strict TS                     | ✓         | Sem `enum` ou `any`                                        |
| VIII. Minimal Dependencies         | ✓         | Nenhuma nova; impressão nativa                             |
| IX. pnpm Only                      | ✓         | —                                                          |
| X. Spec-Driven                     | ✓         | Esta spec. Sem ADR: reutiliza o caminho A da spec 054      |
| XI. Framework-Agnostic Client      | ✓         | Derivação pura; view burra                                 |
| XII. Reactive Flow                 | ✓         | Sem evento novo                                            |

## Sequência

1. **core-api:** leitura em lote, contrato e correção do CSV, com testes.
2. **web-app:** BFF e model.
3. **web-app:** relatório PDF.
4. **web-app:** seta, tag e modais.
5. Validar em stack local (`../ERP-INFRA/local`) e apresentar à P.O.

Commits, PRs e merges só com autorização da P.O.
