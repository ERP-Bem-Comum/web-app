# 092 — "Adicionar Orçamento": separar Estado e Município (modelo do legado)

## Problema

O modal "Adicionar Orçamento" jogava **estados e municípios num único dropdown "Estado"** — apareciam
misturados (ex.: "Ceará"/"Minas Gerais" = estados, "Caucaia"/"Açucena" = municípios). O `/budget-plans/options`
já devolve cada rede com `kind: 'state' | 'municipality'` e `uf`, mas o front ignorava o `kind`.

## Modelo do legado (V1 — ERP-BACKEND)

`budgets.service.create` exige **um** `partnerStateId` **OU** **um** `partnerMunicipalityId` (exclusivo); o
município pertence a um estado (`partner-municipalities.uf`). Ou seja: um orçamento é de um estado OU de um
município **daquele estado**.

## Solução (front-only)

Modal com **Estado + Município**:

- **Estado** = uma opção por UF (nome do estado; sigla como fallback quando o município não tem estado-rede ativo).
- **Município** = municípios do estado escolhido (aparece só quando há municípios); trocar o estado zera o município.
- **Submeter:** município preenchido → orçamento do **município**; vazio → orçamento do **estado**.
- Em que momento o município entra: **depois de escolher o estado** (o município é filtrado pela UF).

## Implementação

- `plan-detail.view-model.ts`: `addBudgetEstadoOptions` · `addBudgetMunicipioOptions` · `addBudgetRefFor` (puros).
- `add-budget.view-model.ts`: `AddBudgetForm` ganha `municipio`; `validateAddBudget(ref, existingRefs)` (ref já resolvida).
- `plan-detail.binding.ts`: `estadoOptions`/`municipioOptions`/`setMunicipio`; submit via `addBudgetRefFor`.
- `add-budget-modal.component.tsx` + page: 2º select (Município). i18n `addBudget.municipio(+Placeholder)`.
- **`uf` propagado na cadeia das network-options** (server-fn `list-network-options` + `BudgetNetworkOption`) —
  era dropado; sem ele não dá pra filtrar município por estado.

## Gates

`pnpm verify` (1600) + `pnpm test:dom` (581). Testes cobrem os helpers (estados sem municípios misturados,
municípios por UF, ref efetiva) e o modal (select de município aparece/encaminha).
