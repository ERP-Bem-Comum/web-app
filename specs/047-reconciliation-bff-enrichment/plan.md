# Plan — Enriquecimento BFF (interino) da Conciliação

Feature: `047-reconciliation-bff-enrichment` · Tamanho **M**.

## Constitution Check (§I–§XII)

- **§I Vertical-modular:** join vive em `financial/server/adapters`. Reuso cross-módulo (suppliers) SÓ via `partners/public-api` (boundary). Título via cliente `financial` já existente (mesmo módulo).
- **§II Erros como valores:** tudo `Result`; sem `throw` em domain/application. Enrichment é best-effort → falha degrada para null, não propaga erro.
- **§III Server fn = única fronteira:** o BFF compõe as leituras extras e entrega o `PaidPayable`/`MatchSuggestion` completos; o client não compõe.
- **§IV Estados ilegais:** campos `string | null` explícitos (já no domínio).
- **§V Cadeia de erro:** falha do core-api → `ReconciliationError`; a UI nunca olha status HTTP.
- **§VI TS estrito:** sem `any`; mapas tipados.
- **§IX Zod na borda:** toda resposta nova (payable-titles, suppliers) valida via schema Zod existente (`CoreApiPayableTitleListSchema`, `CoreApiSupplierListSchema`).
- **§XI MVVM views burras:** o card de match só renderiza as strings recebidas; o front já é tolerante.

## Arquitetura da mudança

### Server (financial) — enriquecimento

1. `core-api-reconciliation.ts` `listPaidPayables`: após a base, buscar títulos + suppliers, construir 2 mapas, enriquecer. Marcador INTERINO #172/#265.
2. `getSuggestions` + `getStatementSuggestions`(?): resolver `supplierName`/`documentNumber` por `payableId` dos mesmos mapas. `getSuggestions` (`/statement-transactions/:id/suggestions`) é o card de match — foco aqui.
3. Domínio `MatchSuggestion` (`reconciliation.io.ts`): + `supplierName: string | null` + `documentNumber: string | null`.
4. Schema/mapper de suggestions: propagar os 2 campos (default null se não enriquecido).

### Reuso dos clientes (decisão de boundary — a resolver na implementação)

- **Títulos:** mesmo módulo `financial` — reusar `listPayableTitles` do `core-api-financial.ts` OU um fetch dedicado paginado dentro da composição. Preferir reusar o mapper/schema existente.
- **Suppliers:** `partners` — expor um leitor `id→name` via `partners/public-api` (o `createCoreApiSuppliersClient` hoje NÃO está no public-api; só `listSuppliersFn`). Opção A: exportar o client/uma fn `listSuppliers` server-side. Opção B: leitor dedicado `id→name` na composição via `#external` + schema de suppliers exportado. Escolher a de MENOR superfície e reversível (é interino).

### Paginação (sem N+1)

- `/payable-titles` e `/suppliers` são listas paginadas. Buscar TODAS as páginas UMA vez (ou pageSize alto ≤100 — ver gotcha do histórico) e montar o mapa. NUNCA fetch por linha.

### Client

- Nenhuma mudança de lógica necessária no grid/pending/search (já consomem os campos). Verificar que `sortPendingByPayment` e a derivação já funcionam com `paidAt` não-nulo (já funcionam — linha 340+).
- Card de match: opcionalmente usar `MatchSuggestion.supplierName/documentNumber` como fallback quando o payable não está no mapa carregado. View permanece burra.

## Fases

- **F1 Domínio + schema/mapper (suggestions):** + campos em `MatchSuggestion`, propagar no schema/mapper.
- **F2 Enriquecimento paid-payables:** mapas de títulos + suppliers; join; marcador interino; best-effort.
- **F3 Enriquecimento suggestions:** resolver via mapas na composição do `getSuggestions`.
- **F4 Client (fallback do card) + i18n se necessário.**
- **F5 Testes:** unit (build de mapa, null fallback, no-N+1 shape, mappers/schema) + DOM (card renderiza "supplierName · documentNumber").
- **F6 Gates:** `pnpm typecheck && pnpm build && pnpm lint && pnpm test && pnpm test:dom`.

## Extensão (2026-07-07) — modal de DETALHE (US3)

Reaproveita 100% da costura das F2/F3 (mesmos 2 mapas). Fases desta extensão:

- **E1 Domínio:** `TransactionReconciliationItem` (server `reconciliation.io.ts` + client `reconciliation.model.ts`) ganha `documentNumber`/`supplierName`/`dueDate` (`string | null`). Mirrors estruturais.
- **E2 Enrichment core:** `TitleEnrichment` ganha `dueDate` (populado em `buildEnrichmentMaps` a partir do payable-title). Novas funções PURAS `enrichReconciliationItems(maps, items)` e `enrichTransactionReconciliation(maps, detail)` — reusam `resolveSupplierName` por `payableId`.
- **E3 Server client:** `getTransactionReconciliation` constrói os mapas UMA vez (mesmo `enrichmentFor(token)`) após o lookup não-nulo e enriquece os itens. Best-effort → null. 404→null pula o enriquecimento. ManualEntry (items vazios) = no-op natural.
- **E4 Mapper:** `transactionReconciliationToModel` inicializa os 3 campos como `null` (preenchidos pelo passo de enriquecimento, não vêm da resposta crua). Schema Zod cru inalterado (tolerante por padrão).
- **E5 Client (binding + view-model + modal):** o binding surfacia os campos do `items[0]` (Individual) para o `doc` do modal; view-model deriva `MatchDetailsDoc` a partir do item enriquecido (name=supplierName ?? documentNumber ?? payableId, documento=documentNumber, vencimento=dueDate). Multiple/Partial: o lado `multi` já existe — renderiza graciosamente (headline/lista compacta), sem sobre-engenharia. Categoria segue "—".
- **E6 i18n:** reusar `financial.recon.*` existentes; só adicionar o que faltar.
- **E7 Testes:** unit (`enrichTransactionReconciliation`/`enrichReconciliationItems`: join por payableId, null fallbacks, no-N+1) + DOM (modal renderiza o lado título no caso Individual).

## GAP de backend — Categoria (documentado, não implementável)

O core-api **não** serializa `fin_documents.category_ref` em nenhuma leitura (write-only). A "Categoria" do
modal permanece "—" com comentário no código apontando o gap (issue análoga a #268). Não buscar detalhe do
documento por isso, não inventar valor. **§XI/§V preservados:** a view continua burra; nada de heurística.

## Riscos

- **Boundary suppliers:** o eslint-plugin-boundaries pode barrar import cross-módulo fora do public-api. Mitigação: exportar via `partners/public-api`.
- **Volume:** listas grandes → paginação completa pode ser cara; interino aceita, marcador explica que o nativo remove os round-trips.
- **pageSize ≤ 100** (gotcha conhecido do core-api) — respeitar.
