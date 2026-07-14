/**
 * INTERINO BFF composite p/ core-api#172/#265 — enriquecimento da Conciliação. Enquanto o core-api NÃO
 * expõe paidAt/supplierName/documentNumber nativos em `/payables?status=Paid` nem nas suggestions, o BFF
 * costura DOIS mapas UMA vez (sem N+1) e resolve por `payableId`:
 *   - titlesMap:   payableId → { documentNumber, supplierRef, paidAt }  (GET /payable-titles, todas as páginas)
 *   - partnersMap: partnerId(=supplierRef) → name                       (GET /partners, agregador dos 4 tipos)
 *
 * O `supplierRef` do título pode apontar p/ QUALQUER tipo de parceiro (fornecedor, financiador, ato,
 * colaborador) — por isso a resolução usa o agregador de parceiros, não só `/suppliers`.
 *
 * Best-effort: se qualquer fonte falhar, o mapa correspondente fica VAZIO e o enriquecimento degrada p/
 * `null` — NUNCA vira ReconciliationError (não pode derrubar a tela). As funções aqui são PURAS sobre os
 * mapas já construídos; a I/O (as duas leituras) é injetada pela composição.
 *
 * REMOVER este módulo (e os round-trips extras) quando o core-api enriquecer os contratos nativamente.
 */
import { isErr, type Result } from '#shared/primitives/result.ts'
import type { PayableTitleListResponse } from '#modules/financial/server/domain/document.io.ts'
import type {
  MatchSuggestion,
  PaidPayable,
  TransactionReconciliation,
  TransactionReconciliationItem,
} from '#modules/financial/server/domain/reconciliation.io.ts'

export type TitleEnrichment = Readonly<{
  documentNumber: string | null
  supplierRef: string | null
  paidAt: string | null
  dueDate: string | null
  issueDate: string | null // #163/056: data de emissão do título (p/ o filtro Período por Emissão)
  retentionType: string | null // imposto retido do título-filho (ISS/IRRF/INSS/CSRF) → favorecido = órgão
}>

// Item mínimo de parceiro que o enriquecimento consome (id → nome). Estrutural: casa com o
// `PartnerAggregateItem` do agregador sem acoplar ao tipo inteiro.
export type PartnerNameItem = Readonly<{ id: string; name: string }>

export type EnrichmentMaps = Readonly<{
  // payableId → dados do título (documentNumber, supplierRef, paidAt)
  titles: ReadonlyMap<string, TitleEnrichment>
  // partnerId (= supplierRef do título) → nome do parceiro (qualquer tipo)
  partners: ReadonlyMap<string, string>
}>

// Fontes injetadas (I/O owner = a composição). Cada uma é chamada UMA vez por build → sem N+1.
export type EnrichmentSource = Readonly<{
  // Busca TODAS as páginas de /payable-titles?status=Paid (pageSize ≤ 100) e devolve as páginas cruas.
  fetchTitles: () => Promise<Result<readonly PayableTitleListResponse[], unknown>>
  // Busca TODOS os parceiros (agregador dos 4 tipos) e devolve os { id, name }.
  fetchPartners: () => Promise<Result<readonly PartnerNameItem[], unknown>>
}>

const EMPTY: EnrichmentMaps = { titles: new Map(), partners: new Map() }

// Constrói os dois mapas UMA vez. Best-effort por fonte: falha → mapa vazio (degrada p/ null no join).
export const buildEnrichmentMaps = async (source: EnrichmentSource): Promise<EnrichmentMaps> => {
  const [titlesRes, partnersRes] = await Promise.all([source.fetchTitles(), source.fetchPartners()])

  const titles = new Map<string, TitleEnrichment>()
  if (!isErr(titlesRes)) {
    for (const page of titlesRes.value) {
      for (const t of page.items) {
        titles.set(t.payableId, {
          documentNumber: t.documentNumber,
          supplierRef: t.supplierRef,
          paidAt: t.paidAt,
          dueDate: t.dueDate,
          issueDate: t.issueDate,
          retentionType: t.retentionType,
        })
      }
    }
  }

  const partners = new Map<string, string>()
  if (!isErr(partnersRes)) {
    for (const s of partnersRes.value) partners.set(s.id, s.name)
  }

  return { titles, partners }
}

// Resolve o nome do favorecido de um payableId: título → supplierRef → nome do parceiro. `null` se não resolve.
const resolveSupplierName = (maps: EnrichmentMaps, payableId: string): string | null => {
  const ref = maps.titles.get(payableId)?.supplierRef ?? null
  if (ref === null) return null
  return maps.partners.get(ref) ?? null
}

// PaidPayable: `.id` é o payableId (JOIN: paid-payable.id ↔ payable-title.payableId). Preenche paidAt +
// documentNumber do título e supplierName via supplierRef. Preserva o valor nativo quando já presente.
export const enrichPaidPayable = (maps: EnrichmentMaps, p: PaidPayable): PaidPayable => {
  const title = maps.titles.get(p.id)
  return {
    ...p,
    paidAt: p.paidAt ?? title?.paidAt ?? null,
    issueDate: p.issueDate ?? title?.issueDate ?? null, // #163/056: emissão vem do título quando /payables não a traz
    documentNumber: p.documentNumber ?? title?.documentNumber ?? null,
    supplierName: p.supplierName ?? resolveSupplierName(maps, p.id),
    retentionType: p.retentionType ?? title?.retentionType ?? null,
  }
}

// MatchSuggestion: resolve supplierName/documentNumber pelo `payableId` usando os MESMOS dois mapas.
export const enrichSuggestion = (maps: EnrichmentMaps, s: MatchSuggestion): MatchSuggestion => ({
  ...s,
  documentNumber: s.documentNumber ?? maps.titles.get(s.payableId)?.documentNumber ?? null,
  supplierName: s.supplierName ?? resolveSupplierName(maps, s.payableId),
})

export const enrichPaidPayables = (
  maps: EnrichmentMaps,
  list: readonly PaidPayable[],
): readonly PaidPayable[] => list.map((p) => enrichPaidPayable(maps, p))

export const enrichSuggestions = (
  maps: EnrichmentMaps,
  list: readonly MatchSuggestion[],
): readonly MatchSuggestion[] => list.map((s) => enrichSuggestion(maps, s))

// TransactionReconciliationItem: item do lookup da conciliação (#175). O core-api cru só devolve o id do
// título e o valor conciliado → resolve documentNumber/dueDate/supplierName pelo `payableId` com os MESMOS
// 2 mapas (INTERINO #172). Preserva o valor nativo quando já presente.
export const enrichReconciliationItems = (
  maps: EnrichmentMaps,
  items: readonly TransactionReconciliationItem[],
): readonly TransactionReconciliationItem[] =>
  items.map((item) => ({
    ...item,
    documentNumber: item.documentNumber ?? maps.titles.get(item.payableId)?.documentNumber ?? null,
    dueDate: item.dueDate ?? maps.titles.get(item.payableId)?.dueDate ?? null,
    supplierName: item.supplierName ?? resolveSupplierName(maps, item.payableId),
    // Imposto retido do título (#172) → o modal mostra o órgão arrecadador no lugar do fornecedor do pai.
    retentionType: item.retentionType ?? maps.titles.get(item.payableId)?.retentionType ?? null,
  }))

// TransactionReconciliation: enriquece os itens do lookup (coluna "TÍTULO NO SISTEMA" do modal de detalhe).
// ManualEntry tem `items` vazio → no-op natural (o detalhe do lançamento manual é #268, fora de escopo).
export const enrichTransactionReconciliation = (
  maps: EnrichmentMaps,
  detail: TransactionReconciliation,
): TransactionReconciliation => ({ ...detail, items: enrichReconciliationItems(maps, detail.items) })

export const emptyEnrichmentMaps = (): EnrichmentMaps => EMPTY

// ── #357 (ADR-0049): enriquecimento do match card via `payables:batch` (de-interina o LOOKUP) ──────────
// Substitui o join caro (todas as páginas de /payable-titles + agregador de parceiros) por 1 hop targeted:
// o batch resolve documentNumber/supplierName/dueDate dos itens do lookup. O `retentionType` (ÓRGÃO do
// imposto retido) NÃO vem no batch → é preservado por um mapa MÍNIMO de títulos, buscado só quando pode
// haver imposto retido (gate). Tudo PURO aqui; a I/O (batch + títulos) é injetada pela composição.

// Enriquecimento de UM título resolvido pelo batch (o que o merge consome). `documentType` alimenta o gate.
export type PayableBatchEnrichment = Readonly<{
  documentNumber: string | null
  supplierName: string | null
  dueDate: string | null
  documentType: string | null
}>

// Marcadores de `documentType` que indicam imposto retido (título-filho) — nesses casos o batch é
// insuficiente p/ o ÓRGÃO (ISS×federal colapsam em 'Imposto') e precisamos do `retentionType` do título.
const RETENTION_DOC_MARKERS: readonly string[] = ['IMPOSTO', 'ISS', 'IRRF', 'INSS', 'CSRF']
export const isRetentionDocType = (documentType: string | null | undefined): boolean =>
  documentType !== null &&
  documentType !== undefined &&
  RETENTION_DOC_MARKERS.includes(documentType.trim().toUpperCase())

// Gate: precisamos do mapa mínimo de retentionType se ALGUM item do lookup é (ou pode ser) imposto retido.
// "pode ser" cobre ids ausentes do batch (docType desconhecido → conservador, nunca regride o ÓRGÃO).
export const needsRetentionMap = (
  payableIds: readonly string[],
  batch: ReadonlyMap<string, PayableBatchEnrichment>,
): boolean =>
  payableIds.some((id) => {
    const b = batch.get(id)
    return b === undefined || isRetentionDocType(b.documentType)
  })

// Mapa mínimo payableId → retentionType a partir das páginas de títulos (SÓ retentionType; sem parceiros).
// Best-effort: fonte falha → mapa vazio (degrada p/ null no merge; o headline do imposto retido some, mas
// nunca quebra). Reusa o `fetchTitles` já existente (todas as páginas, sem filtro de status).
export const buildRetentionMap = async (
  fetchTitles: EnrichmentSource['fetchTitles'],
): Promise<ReadonlyMap<string, string | null>> => {
  const res = await fetchTitles()
  const map = new Map<string, string | null>()
  if (isErr(res)) return map
  for (const page of res.value) for (const t of page.items) map.set(t.payableId, t.retentionType)
  return map
}

// Merge #357: itens do lookup ← batch (documentNumber/supplierName/dueDate) + retentionType (mapa mínimo).
// Preserva o valor nativo quando já presente. Best-effort: mapas vazios → campos null (view mostra "—").
export const enrichReconciliationItemsFromBatch = (
  batch: ReadonlyMap<string, PayableBatchEnrichment>,
  retentionByPayableId: ReadonlyMap<string, string | null>,
  items: readonly TransactionReconciliationItem[],
): readonly TransactionReconciliationItem[] =>
  items.map((item) => {
    const b = batch.get(item.payableId)
    return {
      ...item,
      documentNumber: item.documentNumber ?? b?.documentNumber ?? null,
      dueDate: item.dueDate ?? b?.dueDate ?? null,
      supplierName: item.supplierName ?? b?.supplierName ?? null,
      // retentionType NÃO vem no batch → preservado do mapa mínimo de títulos (não regride o ÓRGÃO).
      retentionType: item.retentionType ?? retentionByPayableId.get(item.payableId) ?? null,
    }
  })
