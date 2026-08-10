# Contratos core-api — Plano Orçamentário (#113)

Contratos que o BFF do front (feature 041) vai consumir. Derivados por engenharia reversa do legado
(`../ERP-BACKEND`, ver `HANDBOOK-plano-orcamentario-mapa.md` §B.4). **Valores em centavos (bigint).** Enums
literais em §B.2. Não são a implementação final do core-api — são o **contrato esperado** para alinhar.

## Convenções

- Auth: sessão interna (o front nunca manda token; o BFF resolve). Compartilhamento externo (`/shared`, `check-credentials`) **fora de escopo** agora (#9).
- Erros de negócio: mensagem PT no corpo (o front v2 surfa a `message`; não mapeia por slug).
- Rede = `partnerStateId` **XOR** `partnerMunicipalityId`.

## Planejamento (planos)

### `GET /budget-plans` — listar (raízes + filhos)

Query: `page`, `limit`, `search?`, `year?`, `programId?`, `status?` (RASCUNHO|EM_CALIBRACAO|APROVADO).
Retorna raízes (`parentId=null`), cada uma com `children` recursivos e contagem de parceiros; ordenado por `updatedAt desc`.
Item: `{ id, year, program:{id,name,abbreviation}, version, scenarioName|null, status, totalInCents, updatedBy:{name}, updatedAt, networkKind (ESTADO|MUNICIPIO), partnersCount, children[] }`.

### `POST /budget-plans` — criar plano v1.0

Body: `{ year:int, programId:int, yearForImport?:int, scenarioName?:string }`.
Regras: valida programa ativo; **unicidade (year+programId+v1)** → 409 _"Já existe um plano orçamentário com essas informações."_; semeia a estrutura de cost-centers do programa; se `yearForImport` (≠ year) → duplica o plano **APROVADO** daquele ano (senão avisa que não há dados). Retorna `{ id }`.

### `GET /budget-plans/:id` — detalhe do plano

Retorna o plano + estrutura (centros/categorias/subcategorias) para a tela de Detalhe.

### `GET /budget-plans/options` — planos aprovados (para selects/consolidado)

Retorna `[{ id, name }]` só de **APROVADOS** (`name` = scenarioName ou "{ano} {programa} {versão}").

### `POST /budget-plans/scenery` — criar cenário

Body: `{ name:string, budgetPlanId:int }`. Duplica como filho RASCUNHO, `version += 0.1`, `scenarioName=name`.
Bloqueia: pai APROVADO / já-cenário / ≥2 filhos EM_CALIBRACAO. Retorna `{ id }`.

### `POST /budget-plans/:id/start-calibration` — iniciar calibração

Só de **APROVADO** (não-cenário). Duplica filho **EM_CALIBRACAO**, `version = pai+1`. Retorna `{ id }`.

### `PATCH /budget-plans/:id/approve` — aprovar

Bloqueia se já APROVADO. Seta APROVADO (recalcula total). **Se for cenário, PROMOVE-o ao pai** (apaga budgets/cost-centers do pai e reduplica do cenário — destrutivo). Front mostra confirmação → "Calculando…" → sucesso.

### `DELETE /budget-plans/:id` — excluir

Só em {RASCUNHO, EM_CALIBRACAO}. Cascata (filhos/budgets/cost-centers). Front: confirmação + toast.

### `GET /budget-plans/:id/insights` — insights

Últimos 5 anos APROVADOS: `{ budgetPlan, data:[{ year, totalInCents, differenceValueInPercentage, type(up|down), partnersCount, medInCentsForPartners }], medInCentsTheLastFiveYears }`.
**Realizado** (planejado × realizado) = somar lançamentos do Financeiro com status **`CONCILIADO`** do mesmo escopo.

### `GET /budget-plans/:id/generate-csv` — exportar CSV do plano

Backend gera (layout do §B.4). _(No legado envia por e-mail; no v2, definir download direto vs. e-mail.)_

## Estrutura de custos (cost-centers)

CRUD de `CostCenter { name, type: "A PAGAR"|"A RECEBER", active, budgetPlanId }` → `Category { name, active }` → `SubCategory { name, type: INSTITUCIONAL|REDE, releaseType: DESPESAS_PESSOAIS|IPCA|CAED|DESPESAS_LOGISTICAS, active }`. Ativar/desativar = soft (`active`).

## Orçamento por rede (budgets)

### `POST /budgets` — adicionar orçamento (1 rede)

Body: `{ budgetPlanId, partnerStateId? XOR partnerMunicipalityId? }`. Plano em RASCUNHO/EM_CALIBRACAO; rejeita parceiro duplicado (409); exige exatamente um parceiro (400). Retorna `{ id }`.

### `GET /budgets` — grade do orçamento

Query: `budgetPlanId`\*, `partnerStateId?`/`partnerMunicipalityId?`, `isForMonth`, paginação. Monta cost-centers→categorias→valores por mês.

### `DELETE /budgets/:id` — excluir orçamento (rede)

Plano em RASCUNHO/EM_CALIBRACAO.

## Lançamentos (budget-results) — os 4 modelos

Todas: plano em RASCUNHO/EM_CALIBRACAO; subcategoria `active` **e** com `releaseType` batendo a rota; **upsert por (budgetId, subCategoryId, month)**; recalcula budget→plano. Body = `{ budgetId, subCategoryId, months:[{ month:1..12, ...inputs }] }`. Valor calculado no backend (fórmulas §B.3); o front faz o mesmo cálculo como **preview**.

- `POST /budget-results/personal-expenses` — inputs folha (salário/reajuste/encargos%/benefícios/provisões + metadados nível/vínculo/qtd).
- `POST /budget-results/ipca` — `{ baseValueInCents, ipca, justification? }`.
- `POST /budget-results/caed` — `{ numberOfEnrollments, baseValueInCents }`.
- `POST /budget-results/logistics-expenses` — `{ numberOfPeople, totalTrips, airfareInCents, accommodationInCents, dailyAccommodation, foodInCents, dailyFood, transportInCents, dailyTransport, carAndFuelInCents, dailyCarAndFuel }`.
- `GET /budget-results/all-last-year/:budgetId/:subCategoryId` — base do **"Utilizar ano anterior"** (busca o budget do ano−1 APROVADO por parceiro + nome da subcategoria).
- `DELETE /budget-results/:id`.

## Consolidado ABC

### `GET /consolidated-result` — consolidado

Query: `year`, `programId?`. Agrega planos v1 **APROVADOS** do ano: soma `totalInCents`, agrupa cost-centers **por nome**, sufixa categoria com `(abreviação do programa)`. Retorna `{ budgetPlans, data:{ totalInCents, costCenters[], numbersOfMonths } }`. Sem dados → lista vazia ("Nenhum resultado encontrado" no front).

### `GET /consolidated-result/csv` — export

Backend gera o CSV (layout: amostra `HANDBOOK-plano-orcamentario-consolidado-abc-export-exemplo.csv`).

---

## Issues sugeridas (core-api #113 — uma por fatia, ordem de entrega)

1. **#113-1 US1 CRUD Plano:** `GET /budget-plans` (+options), `POST /budget-plans` (com import ano anterior), `GET /budget-plans/:id`. Unicidade year+programa. Seed de cost-centers por programa.
2. **#113-2 US2a Estrutura:** CRUD cost-centers/categorias/subcategorias (com `type` e `releaseType`).
3. **#113-3 US2b Orçamento + 4 cálculos:** `POST/GET/DELETE /budgets`; `POST /budget-results/{ipca,caed,personal-expenses,logistics-expenses}`; `all-last-year`. Regra de edição por status.
4. **#113-4 US3 Ciclo de vida:** `scenery`, `start-calibration`, `approve` (promoção de cenário), `delete`; `insights` (+ Realizado via `CONCILIADO`).
5. **#113-5 US4 Consolidado + CSV:** `consolidated-result` (+csv).
6. **#113-6 (pós-entrega) Compartilhamento externo:** reescrever `share-budget-plans`/`check-credentials` com credencial segura + expiração (substitui o `Math.random`/<1 dia do legado).
