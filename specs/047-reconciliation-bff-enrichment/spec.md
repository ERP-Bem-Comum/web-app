# Spec — Enriquecimento BFF (interino) da Conciliação · core-api#172 + #265

- **Feature:** `047-reconciliation-bff-enrichment`
- **Tamanho:** M (feature server-centric; múltiplos arquivos em `financial/server`, sem decisão arquitetural nova).
- **Decisão do P.O.:** compor no BFF os campos que faltam no core-api SEM tocar no backend (sem deploy, sem migração). Estratégico e explícito.

## Problema

O painel de Conciliação precisa exibir, por título Pago e no card de match:

- **`paidAt`** (data da baixa) — hoje `GET /financial/payables?status=Paid` NÃO retorna, embora o dado exista e `/payable-titles` já exponha (core-api#265).
- **`supplierName`** (razão social do favorecido) + **`documentNumber`** (nº do documento) — hoje nem `/payables?status=Paid` nem `/statement-transactions/:id/suggestions` carregam (core-api#172). Mock: "TS Da Silva Serviços Ltda · NFS-e 2024-0537".

## Abordagem (composite interino aprovado pelo P.O.)

O BFF orquestra leituras adicionais do core-api e faz o JOIN em memória, com mapas construídos UMA vez (sem N+1 por linha):

1. **Base** — mantém `GET /payables?status=Paid` (`{ id, documentId, valueCents, dueDate, paymentMethod }`).
2. **Títulos** — busca `GET /payable-titles` (paginado); mapa `payableId → { documentNumber, supplierRef, paidAt }`.
3. **Parceiros** — busca o **agregador dos 4 tipos** (`GET /api/v1/partners`, `listAllPartners`); mapa `partnerId(=supplierRef) → name`. **NÃO** só `/suppliers`: o `supplierRef` do título pode apontar p/ qualquer tipo (fornecedor, financiador, ato, colaborador) — mesma fonte que o Contas a Pagar usa p/ resolver o favorecido.
4. **Enriquece** cada `PaidPayable`: `paidAt` + `documentNumber` (do mapa de títulos), `supplierName` (do mapa de parceiros via `supplierRef`). Null quando não resolver (front tolerante → "—").

Para **suggestions (#172)**: adicionar `supplierName`/`documentNumber` ao `MatchSuggestion`, resolvidos do `payableId` pelos MESMOS mapas.

### Chaves de join (confirmadas lendo os schemas)

- **paid-payable `.id` ↔ payable-title `.payableId`** — `documentId` é o documento PAI (compartilhado por títulos-irmãos), não é 1:1; `payableId` é a chave correta.
- **payable-title `.supplierRef` ↔ supplier `.id` → `.name`**.

## Escopo

**INCLUI (estrito):** #172 (supplierName + documentNumber no grid de pagos + card de match) e #265 (paidAt no grid + painel), ambos NO BFF.

**NÃO INCLUI:** #271/#268 (ficam no core-api — o dado não é lido de volta); #207 (já feito — UUID só aparece no ambiente in-memory degradado). Nenhuma mudança no core-api.

## Best-effort (degradação graciosa)

O enriquecimento é opcional. Se `/payable-titles` ou `/partners` falharem, retornar a lista base com enrichment nulo (não derrubar a tela inteira). Erros mapeados na união `ReconciliationError` existente.

**Correção pós-validação (2026-07-07):** a 1ª versão resolvia o nome via `/api/v1/suppliers` (schema estrito, só o tipo supplier) → mapa **vazio** em tela (parse fail + refs de outros tipos). Trocado pelo **agregador `/api/v1/partners`** (`listAllPartners`, schema tolerante, 4 tipos) — a mesma fonte comprovada do Contas a Pagar. `supplier-lookup.ts` removido.

## Extensão (2026-07-07) — Enriquecimento do modal de DETALHE ("Conciliação realizada")

O modal de detalhe da conciliação (`GET /statement-transactions/:id/reconciliation`, #175) traz `items`
com **apenas** `{ payableId, reconciledValueCents }` (comentário do domínio: "sem fornecedor/nº doc até
#172"). Por isso a coluna **"TÍTULO NO SISTEMA"** aparece toda "—". Esta extensão reaproveita a MESMA
costura de enriquecimento (mapas títulos + parceiros, construídos UMA vez, sem N+1) para preencher, **só
para conciliações baseadas em TÍTULO**:

- `documentNumber` ← mapa de títulos por `payableId`.
- `dueDate` ← mapa de títulos por `payableId` (o `TitleEnrichment` ganha `dueDate`, já retornado por
  `/payable-titles`).
- `supplierName` ← `titles.supplierRef` → mapa de parceiros (reusa `resolveSupplierName`).

`TransactionReconciliationItem` (domínio + model client) ganha `documentNumber`/`supplierName`/`dueDate`
(`string | null`). O `getTransactionReconciliation` constrói os mapas UMA vez após o lookup não-nulo e
enriquece os itens; best-effort → se falhar, degrada para null (nunca quebra o modal). Para
`type === 'ManualEntry'` os itens são vazios → nada a enriquecer (isso é #268, fora de escopo).

### Categoria — GAP de backend (NÃO implementável no front)

A **"Categoria"** do modal permanece "—". Verificado: o core-api **não serializa** `category_ref` em
NENHUMA leitura (é write-only da API — nem o form de edição do documento consegue pré-preencher). Depende
do backend expor — issue análoga a #268. NÃO buscar detalhe do documento por isso, NÃO inventar valor.
Marcado com comentário no código.

## User Stories

- **US1 (P1):** Como operador da conciliação, vejo `paidAt` (DD/MM/AAAA) em cada título Pago, e a lista ordena o mais antigo no topo pela data de pagamento.
- **US2 (P1):** Como operador, vejo "supplierName · documentNumber" no grid de pagos e no card de match, com fallback gracioso quando ausente.
- **US3 (P1):** Como operador, ao abrir o modal "Conciliação realizada" de uma conciliação por título, vejo no lado "TÍTULO NO SISTEMA" o **favorecido** (título), o **nº do documento** e o **vencimento**, com fallback gracioso "—" quando ausente. Categoria segue "—" (gap de backend).

## Critérios de aceite

- `listPaidPayables` preenche `paidAt`/`supplierName`/`documentNumber` via join em memória, sem N+1.
- `MatchSuggestion` ganha `supplierName`/`documentNumber` resolvidos do `payableId`.
- Leg client (fiel ao mock): o **card de match de topo** (`suggestion-pane` → `TituloSide`) passa a exibir o **nome do favorecido** como título + **nº do documento** como referência abaixo (as alternativas já exibiam; o grid/painel de pagos já consumiam `paidAt`/`supplierName`/`documentNumber`). Sem mudança no client `PaidPayable` (campos já existiam). Coberto por `suggestion-pane.spec.tsx` (#172).
- Falha no enrichment → lista base com campos nulos (tela não quebra).
- **US3:** `getTransactionReconciliation` enriquece os `items` (documentNumber/supplierName/dueDate) via os MESMOS mapas, UMA vez, sem N+1; ManualEntry (items vazios) não é tocado; Categoria segue "—" (gap backend, comentado no código). Modal renderiza o lado título no caso Individual e degrada graciosamente em Multiple/Partial.
- Marcador INTERINO em cada join, referenciando #172/#265 e o plano de remoção quando o core-api expor nativamente.
- Gates verdes: `pnpm typecheck && pnpm build && pnpm lint && pnpm test && pnpm test:dom`. Lint baseline 0 err / 115 warn — sem regressão.
