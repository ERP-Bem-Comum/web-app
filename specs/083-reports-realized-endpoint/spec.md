# 083 — Relatório Realizado × Planejado liga ao endpoint real (S6 do épico core-api #502)

> Escala **L**. Consome a fatia **S6 `REPORTS-REALIZED-ENDPOINT`** do épico Taxonomia Planejável Unificada
> (core-api #502 · fecha REP-5/#416), `GET /api/v2/reports/realized`, já na `dev` (PR #510). **Fecha o épico
> #502 no front** (S1 documento, S2 conciliação, S3 contrato, herança e agora S6 relatório).

## Antes

O relatório era **front-first**: `loadBudgetTree()` agregava CONSTANTES placeholder (valores reais do CSV
legado, realizado/provisionado = 0). Toda a máquina (árvore, gráficos, CSV, KPIs) já pronta e testada. O donut
"Realizado vs previsto" usava valores DEMO rotulados "exemplo".

## Decisão

Ligar a **fonte** ao endpoint, reusando 100% da máquina front-first.

- **Endpoint:** `GET /reports/realized?year=…` (+ filtros opcionais programId/budgetPlanId/partnerStateId/
  partnerMunicipalityId). Resposta = árvore Centro→Categoria→Subcategoria, 3 medidas por nó (expected/realized/
  provisioned), `months[12]` em categoria e subcategoria. **Centavos**; **mês 1-12**.
- **BFF (cadeia espelhando o "team"):** `reports.io.ts` (tipos) + `reports.schema.ts` (schema drift-tolerante) +
  `reports.mappers.ts` (`realizedReportToModel` — **achata** a árvore em linhas por subcategoria; converte mês
  `−1` → 0-11; centavos diretos; categoria sem sub → linha com `subcategoria: ''`) + `reports.use-cases.ts`
  (porta + factory) + `core-api-reports.ts` (`getRealizedReport` com `URLSearchParams`) + composition +
  `get-realized-report.query.fn.ts` (server-fn, input Zod `year` obrigatório) + repository client + model local.
- **Client:** `realizado-x-planejado.query.ts` (queryOptions, filtros na queryKey) + `.binding.ts`
  (`useRealizadoReport` → união `loading|error|ready`; **re-agrega** as linhas achatadas com `aggregateBudgetTree`
  — reusa a máquina testada). A page troca `loadBudgetTree()` pelo binding, com **loading/erro honestos**
  (`ReportStatePanel`), donut com dado REAL (saiu o "exemplo") e CSV do dado real. Hooks incondicionais +
  early-return (regra dos hooks preservada).

## Por que achatar + re-agregar (e não mapear a árvore direto)

A árvore do backend já vem agregada, mas o front tem toda a máquina (gráficos/grandTotal/CSV) sobre
`RawBudgetRow[]`/`BudgetTreeRow[]` já testada. Achatar em folhas + `aggregateBudgetTree` reconstrói a árvore
IDÊNTICA (totais do CC = soma das folhas) e reusa tudo sem duplicar regra. Faithful; a única perda seria
colisão de NOME (dois nós de mesmo nome mesclam) — aceitável (nomes do plano são únicos na árvore).

## Fora de escopo (follow-ups)

- **Filtros** (programa/plano/estado/município) e **ano** seguem CHROME — o dado vem do endpoint com `year=2026`
  fixo; a query já aceita os params, falta ligar os selects + fonte de opções.
- Ressalvas do backend (registradas): integração MySQL não-executada (#500); sob filtro de Rede o realizado não
  é recortado (#508, decisão da P.O.).

## Verificação

`pnpm typecheck` + `pnpm verify` (1580 puros, +3 do mapper: achatamento, conversão de mês, categoria sem sub,
drift) + `pnpm test:dom` (578). Lint 0. Validado em tela (local ERP-INFRA, REPORTS_DRIVER=mysql): árvore/KPIs/
gráficos/CSV do endpoint real.
