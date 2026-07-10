# Plan — feature 061 (escrita da estrutura de custo)

## Constitution Check (§I–§XII)

- **§III (server-fn = única fronteira):** 3 `*.service.fn.ts`, auth no handler, o BFF entrega a resposta pronta.
- **§IX (Zod na borda):** input dos 3 POSTs validado com `inputValidator`; resposta do core validada
  (`coreCostStructureSchema`) antes de mapear (anti-corrupção).
- **§II/§V (erros como valores):** `Result` no server; `{ok,data|error}` na fronteira; tag i18n na UI (nunca
  status HTTP). Novo ramo `budget-plan-not-editable` (409 na escrita de plano aprovado).
- **§IV (estados ilegais):** `direction`/`launchType` como uniões literais (VOs de comando); `formMode` já é
  união discriminada; erro do binding é união.
- **§XI (MVVM, views burras):** mutations vivem no `*.binding.ts` (React); o modal é burro (recebe erro/pending
  por props); a cascata (habilitar filho quando há pai) é derivação do binding.
- **§VI/§VII:** sem `any`/`enum`; `Readonly`/`as const`; `ref` aditivo readonly.

## Camada Server (BFF·DDD)

1. `domain/plan-detail.io.ts` — `id: string` (uuid) nos inputs crus de centro/categoria; `ref: string` nos
   nós compostos `CostCenterConsolidated`/`CategoryConsolidated` (o mapper preenche).
2. `domain/plan-detail.mapper.ts` — `ref: cc.id` / `ref: cat.id` (mantém o `id` numérico sintético por índice).
3. `domain/cost-structure-write.io.ts` (NOVO) — comandos (`AddCostCenterCommand`/`AddCategoryCommand`/
   `AddSubcategoryCommand`) + tipos da árvore-eco (`CostStructureTree`).
4. `domain/errors/budget-plans.errors.ts` — `+ 'budget-plan-not-editable'`.
5. `application/write-cost-structure.use-case.ts` (NOVO) — port `WriteCostStructureClient` + 3 factories
   (pass-through; a orquestração é 1 POST cada).
6. `adapters/core-api/core-api-budget-plans.ts` — `getCostStructure` passa `id` adiante; `mapWriteHttpError`
   (401/404/409→not-editable/400·422→invalid-input); métodos `addCostCenter`/`addCategory`/`addSubcategory`.
7. `adapters/budget-plans-list.io-schemas.ts` — 3 input schemas (uuid + name 1..255 + enums literais).
8. `adapters/server-fns/{add-cost-center,add-category,add-subcategory}.service.fn.ts` (NOVOS).
9. `adapters/budget-plans-list.composition.ts` — wire dos 3 use-cases (mesmo client).

## Camada Client (MVVM)

10. `data/model/plan-detail.model.ts` — `ref?: string` (aditivo) em centro/categoria + schemas; `CostStructureTree`
    (eco) + inputs de escrita.
11. `data/repository/budget-plans-error.ts` — `+ 'budget-plan-not-editable'`.
12. `data/repository/budget-plans.repository.ts` + `.instance.ts` — `addCostCenter`/`addCategory`/`addSubcategory`.
13. `planejamento/detalhe/centros-custo.view-model.ts` — `ref?` em `CentroNode`/`CategoriaNode`; `buildCentrosTree`
    propaga; `validateCentroName` (nome obrigatório).
14. `planejamento/detalhe/centros-custo.binding.ts` — 3 `useMutation`; onSuccess invalida `planDetailQueryKey(id)`;
    auto-seleciona o centro novo; `errorTag`/`submitting`; cascata (categoria exige centro c/ `ref`, sub exige
    categoria c/ `ref`).
15. `planejamento/detalhe/plan-detail.binding.ts` — passa `id` a `useCentrosCusto`.
16. `components/centros-custo-modal.component.tsx` — painel de formulário mostra erro + botão desabilita em
    submitting.
17. `page/plan-detail.page.tsx` — novos labels (erro/submitting).
18. `shared/i18n/catalog.pt-BR.ts` — tags de erro/sucesso por operação.

## Tests

- node: `plan-detail.mapper.test.ts` — `ref` presente nos nós de centro/categoria (= uuid do backend).
- node: `write-cost-structure.use-case.test.ts` — pass-through ok/err.
- DOM: `centros-custo.binding.spec.tsx` — cascata (criar centro habilita categoria; criar categoria habilita
  sub; erro mostra tag).

## Gaps de backend a vigiar

- Editar/desativar nós sem endpoint (Grupo B só cria) → seguem visuais.
- 409 na escrita é indistinguível por status (o core esconde o slug) → mapeado por contexto (`not-editable`).
