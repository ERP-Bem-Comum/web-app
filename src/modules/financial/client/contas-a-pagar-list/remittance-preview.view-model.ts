/**
 * ViewModel do PRÉ-VOO da remessa (VAN, core-api#728) — derivação PURA (§XI, ADR-0009): sem React, sem
 * Query, sem I/O. Recebe a seleção do grid + o pré-voo do BFF e devolve exatamente o que a view desenha.
 *
 * Duas responsabilidades, e a primeira é a que protege o operador:
 *
 * 1. **Quem sequer é candidato.** O core-api NÃO filtra por status: o pré-voo e a geração leem os
 *    documentos por id (`inArray`), sem exigir `Aprovado`. Mandar um Rascunho para lá o traria de volta
 *    como `ready` — e "pronto para pagar" é exatamente o que ele não está. Então a elegibilidade POR
 *    STATUS é resolvida aqui, antes da chamada, e o que não é Aprovado nem viaja.
 *    ⚠️ Isto NÃO é uma segunda régua de aptidão de pagamento: os dados do favorecido continuam sendo
 *    julgados só pelo core-api (`checkPayoutReadiness`), a mesma função que a geração usa.
 *
 * 2. **Traduzir o resultado em ação.** Cada lacuna vira campo + motivo, porque a ação do operador difere:
 *    `missing` pede preencher, `unmappable`/`malformed` pedem corrigir o que já está lá.
 */
import { centsToBRL } from '#modules/financial/client/data/money.ts'
import type {
  PayoutField,
  PayoutGapReason,
  PreviewLineStatus,
  RemittancePreview,
  VanRoute,
} from '#modules/financial/client/data/model/remittance.model.ts'

import type { GridRow } from './contas-a-pagar.view-model.ts'

/** Status do título que torna o documento candidato à remessa. Fora dele, nem chega ao core-api. */
const REMITTANCE_ELIGIBLE_STATUS = 'Aprovado'

export type RemittanceSelection = Readonly<{
  /** Documentos distintos (dedup) elegíveis — é o que vai no corpo do pré-voo. */
  documentIds: readonly string[]
  /** Títulos selecionados que NÃO são Aprovado. Não viajam; a tela diz por quê. */
  notApprovedCount: number
}>

/**
 * Deriva o alvo do pré-voo a partir da seleção do grid. Dedup por `documentId`: o grid é por TÍTULO
 * (#201), e vários títulos do mesmo documento (pai + impostos filhos) são UMA linha só na remessa.
 */
export const deriveRemittanceSelection = (
  rows: readonly GridRow[],
  selected: ReadonlySet<string>,
): RemittanceSelection => {
  const sel = rows.filter((r) => selected.has(r.id))
  const seen = new Set<string>()
  const documentIds: string[] = []
  let notApprovedCount = 0

  for (const r of sel) {
    if (r.status !== REMITTANCE_ELIGIBLE_STATUS) {
      notApprovedCount += 1
      continue
    }
    if (seen.has(r.documentId)) continue
    seen.add(r.documentId)
    documentIds.push(r.documentId)
  }

  return { documentIds, notApprovedCount }
}

// ── Tags i18n dos enums ─────────────────────────────────────────────────────────

const STATUS_TAG: Record<PreviewLineStatus, string> = {
  ready: 'financial.remittance.preview.status.ready',
  blocked: 'financial.remittance.preview.status.blocked',
  'out-of-van': 'financial.remittance.preview.status.outOfVan',
  'not-found': 'financial.remittance.preview.status.notFound',
}

const ROUTE_TAG: Record<VanRoute, string> = {
  pix: 'financial.remittance.preview.route.pix',
  transfer: 'financial.remittance.preview.route.transfer',
  billet: 'financial.remittance.preview.route.billet',
  'tax-guide': 'financial.remittance.preview.route.taxGuide',
}

const FIELD_TAG: Record<PayoutField, string> = {
  'pix-key': 'financial.remittance.preview.field.pixKey',
  'payee-bank-code': 'financial.remittance.preview.field.bankCode',
  'payee-agency': 'financial.remittance.preview.field.agency',
  'payee-account-number': 'financial.remittance.preview.field.accountNumber',
  'payee-account-digit': 'financial.remittance.preview.field.accountDigit',
  'payment-detail': 'financial.remittance.preview.field.paymentDetail',
}

const REASON_TAG: Record<PayoutGapReason, string> = {
  missing: 'financial.remittance.preview.reason.missing',
  unmappable: 'financial.remittance.preview.reason.unmappable',
  malformed: 'financial.remittance.preview.reason.malformed',
}

// ── Linhas para a view ──────────────────────────────────────────────────────────

export type PreviewGapView = Readonly<{ fieldTag: string; reasonTag: string }>

export type PreviewLineView = Readonly<{
  documentId: string
  status: PreviewLineStatus
  statusTag: string
  /** Fornecedor e número do documento vêm do GRID (o pré-voo devolve só o id). "—" quando a linha sumiu. */
  supplier: string
  documentNumber: string
  routeTag: string | null
  gaps: readonly PreviewGapView[]
  net: string
}>

export type PreviewView = Readonly<{
  lines: readonly PreviewLineView[]
  readyCount: number
  blockedCount: number
  outOfVanCount: number
  notFoundCount: number
  readyTotal: string
  blockedTotal: string
  /** Habilita a geração (fatia seguinte). Sem nenhum título apto, não há remessa a gerar. */
  canGenerate: boolean
}>

const DASH = '—'

/**
 * Junta o pré-voo (que fala em `documentId`) com o grid (que tem fornecedor e número). Ordena os
 * IMPEDIDOS primeiro: quem abre a conferência quer ver o que precisa de ação, não rolar atrás disso.
 */
export const toPreviewView = (preview: RemittancePreview, rows: readonly GridRow[]): PreviewView => {
  const byDoc = new Map<string, GridRow>()
  for (const r of rows) if (!byDoc.has(r.documentId)) byDoc.set(r.documentId, r)

  const lines: readonly PreviewLineView[] = preview.lines.map((l) => {
    const row = byDoc.get(l.documentId)
    return {
      documentId: l.documentId,
      status: l.status,
      statusTag: STATUS_TAG[l.status],
      supplier: row?.supplier ?? DASH,
      documentNumber: row?.documentNumber ?? DASH,
      routeTag: l.route === null ? null : ROUTE_TAG[l.route],
      gaps: l.gaps.map((g) => ({ fieldTag: FIELD_TAG[g.field], reasonTag: REASON_TAG[g.reason] })),
      net: l.netValueCents === '' ? DASH : centsToBRL(l.netValueCents),
    }
  })

  const weight: Record<PreviewLineStatus, number> = {
    blocked: 0,
    'out-of-van': 1,
    'not-found': 2,
    ready: 3,
  }
  const sorted = [...lines].sort((a, b) => weight[a.status] - weight[b.status])

  return {
    lines: sorted,
    readyCount: preview.readyCount,
    blockedCount: preview.blockedCount,
    outOfVanCount: preview.outOfVanCount,
    notFoundCount: preview.notFoundCount,
    readyTotal: centsToBRL(preview.readyTotalCents),
    blockedTotal: centsToBRL(preview.blockedTotalCents),
    canGenerate: preview.readyCount > 0,
  }
}
