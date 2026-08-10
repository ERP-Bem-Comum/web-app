# 086 — Detalhe do Contrato resolve a categorização pela árvore do plano

> Escala **S/M**. Follow-up do épico #502 (irmão do specs/085 no drawer de Contas a Pagar): fecha o gap de
> LEITURA no detalhe do Contrato — refs da árvore do plano → nome.

## Bug

No detalhe do Contrato (`ContractInfo`):

- **Plano Orçamentário** mostrava **"—"**: lia `contract.budgetPlan?.scenarioName`, um bloco composto que o
  **backend não devolve** (só manda `budgetPlanId`, o ref).
- **Subcategoria** **não aparecia**: a S3 gravou o `subcategoryRef` (folha da árvore) mas **sem nome exibível**.

(Centro de Custo e Categoria já mostravam o nome — a S3 os guarda como texto.)

## Decisão

Resolver ref→nome contra a **árvore do plano** (mesmo padrão do drawer, specs/085):

- O binding busca a árvore do `budgetPlanId` (`getBudgetPlanDetailFn`, cache compartilhado / mesma queryKey) e
  deriva `planLabel` (rótulo "ano sigla versão · cenário") + `subcategoria` (nome da folha varrendo a árvore pelo
  `subcategoryRef`). Guard de UUID; sem plano → `null` → "—".
- `ContractInfo` ganha props `planLabel`/`subcategoria`; o Plano usa `planLabel` (fallback `scenarioName`) e uma
  nova célula mostra a Subcategoria.

## Ajuste de layout (pedido da P.O. na validação)

- **Origem ↔ Categoria** trocam de lugar: Origem sobe p/ a linha 1 (Classificação · Modelo · Tipo · **Origem**).
- A linha da cascata fica **em ordem**: **Centro de Custo · Categoria · Subcategoria** (`frCols3`).

## Verificação

`pnpm typecheck` + `pnpm verify` (1580) + `pnpm test:dom` (578) verdes; lint **0 erros** (labels hardcoded seguem o
padrão do arquivo — warnings i18n pré-existentes). Validado em tela: contrato `0013/2026` (plano 2026 ABC 1.0) →
Plano = "2026 Abracadabra Poccus 1.0", Subcategoria = "Sol", ordem Céu · Mar · Sol.
