# 134 — Plano Orçamentário: criar a partir de outro ano (front)

**Tamanho:** M · **Status:** implementado (branch `feat/134-plano-a-partir-de-outro-ano`) · **Data:** 2026-11-23
**Backend:** core-api#1092, entregue no core-api#1095 (`dev` 03/11, `main` 04/11, rc.7). Nada muda no core.

## Problema

No modal "Adicionar Plano Orçamentário", "Importar dados" → "Criar a partir do ano de" era cosmético desde 09/07
(#113 Fatia 1): o form guardava o ano, mas o envio mandava só `{ year, programRef }`. O plano saía vazio, sem aviso.
Os anos eram fixos (2019–2025), e nada garantia que o programa tivesse plano naquele ano.

## Decisões

- **O que se copia** (P.O., 28/10): a **última versão aprovada** do plano daquele ano+programa. A regra é do core.
- **Anos oferecidos:** só os anos em que o programa **tem plano APROVADO**
  (`GET /budget-plans?status=APROVADO&programRef=`), do mais recente para o mais antigo, **sem o ano do próprio
  plano novo**. Trocar o programa limpa o ano escolhido.
- **Seletor sem opções explica o motivo** (não é um seletor vazio): sem programa, carregando, nenhum ano aprovado,
  falha na leitura. Desabilitado e com aparência de desabilitado.
- **Toggle desligado = plano vazio**, mesmo que um ano tenha sido escolhido antes.
- **Erros pelo slug** (`error.code` do envelope do módulo budget-plans), com o mapa por status como reserva:

| Core                                           | Tela                                                                  |
| ---------------------------------------------- | --------------------------------------------------------------------- |
| 422 `budget-plan-import-same-year`             | O ano de origem precisa ser diferente do ano do plano.                |
| 409 `budget-plan-import-source-not-approved`   | Este programa não tem plano aprovado no ano escolhido.                |
| 409 `budget-result-orphan-subcategory`         | A origem tem lançamentos fora da estrutura; nada gravado; suporte.    |
| 503 `plan-clone-write-unavailable`             | Genérico ("Tente novamente"): a cópia é tudo ou nada, retentar serve. |
| 409 `budget-plan-already-exists` (ou sem slug) | Já existe um plano para esse ano e programa (como antes).             |

Por status, os dois 409 novos virariam "já existe plano", que é a mensagem errada.

## Entrega

- **BFF:** `importFromYear` opcional na borda (Zod, ≠ `year`) e no corpo do `POST`; use-case + server fn
  `listImportSourceYearsFn` (pagina até o `total`, não trunca); mapa de erro por slug no `createBudgetPlan`.
- **Client:** `toCreateInput` / `importYearsState` / validação no ViewModel puro; query dos anos no binding
  (só com toggle ligado e programa escolhido); view com o estado do seletor; 9 textos PT novos.
- Removido `IMPORT_YEARS` (constante fixa).

## Testes

- `tests/modules/budget-plans/create-from-year.core-client.test.ts` — corpo, slugs, fallback por status, anos
  distintos, paginação.
- `create-plan.view-model.test.ts` — validação, `toCreateInput`, `importYearsState`, erros novos.
- `create-plan.binding.spec.tsx` — envio do ano, toggle desligado, required, troca de programa, 409, falha de leitura.

## Fora do escopo (follow-up)

- **Calibração e cenário** também podem devolver `budget-result-orphan-subcategory` (409) desde o core-api#1095, mas
  o front mapeia o 409 deles por **status** (`not-approved` / `scenery-needs-draft`): a mensagem sai errada nesse
  caso raro (0 órfãos medidos no legado). Corrigir = ler o slug nesses dois mapas também.
- Pendências do core-api#1095 que seguem com a P.O.: R1 (plano aprovado com órfão antigo não calibra), R3 (código
  de erro na colisão de versão) e limpeza dos planos-filho que já saíram zerados em PROD.
