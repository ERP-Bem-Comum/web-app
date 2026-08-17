/**
 * ViewModel do PRÉ-VOO da remessa (VAN, core-api#728) — derivação PURA (§XI, ADR-0009): sem React, sem
 * Query, sem I/O. Recebe a seleção do grid + o pré-voo do BFF e devolve exatamente o que a view desenha.
 *
 * Duas responsabilidades, e a primeira é a que protege o operador:
 *
 * 1. **Quem sequer é candidato.** O core-api NÃO filtra por status: o pré-voo e a geração leem os
 *    documentos por id (`inArray`), sem exigir `Aprovado` (core-api#736). Mandar um Rascunho para lá o
 *    traria de volta como apto — e "pronto para pagar" é exatamente o que ele não está. Só título
 *    APROVADO entra em remessa: premissa de negócio inegociável, resolvida aqui, antes da chamada.
 *    ⚠️ Isto NÃO é uma segunda régua de aptidão de pagamento: os dados do favorecido continuam sendo
 *    julgados só pelo core-api (`checkPayoutReadiness`), a mesma função que a geração usa.
 *
 * 2. **Montar a conferência.** As colunas espelham o grid de Contas a Pagar (tipo de pagamento,
 *    documento, fornecedor, vencimento, líquido) porque é a mesma leitura, na mesma linguagem. O que o
 *    pré-voo acrescenta é UM bit por linha: tem pendência ou não. A linha com pendência sai destacada.
 */
import { centsToBRL, sumCents } from '#modules/financial/client/data/money.ts'
import type {
  PayoutField,
  PayoutGapReason,
  RemittancePreview,
} from '#modules/financial/client/data/model/remittance.model.ts'

import type { GridRow } from './contas-a-pagar.view-model.ts'

/** Status do título que torna o documento candidato à remessa. Fora dele, nem chega ao core-api. */
const REMITTANCE_ELIGIBLE_STATUS = 'Aprovado'

const DASH = '—'

export type RemittanceSelection = Readonly<{
  /** Documentos distintos (dedup) elegíveis — é o que vai no corpo do pré-voo. */
  documentIds: readonly string[]
  /** Títulos que NÃO são Aprovado. Não viajam; a tela diz quantos ficaram de fora. */
  notApprovedCount: number
}>

/**
 * Deriva o alvo do pré-voo. Dedup por `documentId`: o grid é por TÍTULO (#201), e vários títulos do
 * mesmo documento (pai + impostos filhos) são UMA linha só na remessa.
 */
export const deriveRemittanceSelection = (rows: readonly GridRow[]): RemittanceSelection => {
  const seen = new Set<string>()
  const documentIds: string[] = []
  let notApprovedCount = 0

  for (const r of rows) {
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

// ── Tags i18n das lacunas ───────────────────────────────────────────────────────
//
// O motivo viaja junto do campo porque a AÇÃO difere: `missing` pede preencher;
// `unmappable`/`malformed` pedem corrigir o que já está lá.

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

export type PreviewGapView = Readonly<{ fieldTag: string; reasonTag: string }>

export type PreviewLineView = Readonly<{
  /** Chave da linha E do checkbox: é o TÍTULO (payable), não o documento. */
  payableId: string
  documentId: string
  paymentMethodTag: string | null
  documentNumber: string
  supplier: string
  due: string
  net: string
  /** Pode entrar no arquivo (⇒ o checkbox é operável). */
  remittable: boolean
  /** Está marcado para ir. Sempre `false` quando não é remittable. */
  checked: boolean
  /** Rótulo curto do impedimento, exibido na linha. `null` quando a linha entra. */
  pendencyTag: string | null
  /** Detalhe campo+motivo (tooltip). Vazio quando o impedimento não tem campo. */
  gaps: readonly PreviewGapView[]
}>

export type PreviewSummary = Readonly<{
  /** Marcados × exibidos: o totalizador acompanha o que o operador desmarcou. */
  checkedCount: number
  titleCount: number
  grossTotal: string
  netTotal: string
  paymentDate: string
  paymentDateMixed: boolean
  /** O que sai no arquivo: soma dos MARCADOS, com o valor que o backend apurou por documento. */
  remittanceTotal: string
  pendingCount: number
}>

export type PreviewView = Readonly<{
  lines: readonly PreviewLineView[]
  summary: PreviewSummary
  /** Documentos que irão na geração (fatia seguinte) — dedup, só os marcados. */
  checkedDocumentIds: readonly string[]
}>

/**
 * UMA LINHA POR TÍTULO SELECIONADO — nunca por documento.
 *
 * O grid é title-centric: um documento com retenção rende o título do FORNECEDOR (líquido) e um título
 * FILHO por imposto, com outro favorecido (o órgão arrecadador) e outro valor. Colapsá-los numa linha só
 * misturava o nome de um com o valor do outro, e escondia metade do que o operador tinha selecionado.
 *
 * O veredito do core-api, porém, é por DOCUMENTO: o pré-voo lê `fin_documents` e responde sobre o
 * pagamento ao FORNECEDOR. Então cada linha recebe o que de fato se sabe sobre ela:
 *  - título do fornecedor → o veredito real do documento;
 *  - título de retenção   → não é pagável pela VAN hoje (o emissor não produz guia a partir do filho).
 *    Não é uma régua nossa sobre dados do favorecido: é a ausência de um caminho no backend, e dizê-lo
 *    é mais honesto que exibir a linha como apta e deixar o arquivo decidir.
 */
export const toPreviewView = (
  preview: RemittancePreview,
  rows: readonly GridRow[],
  unchecked: ReadonlySet<string>,
): PreviewView => {
  const lineByDoc = new Map(preview.lines.map((l) => [l.documentId, l]))

  const lines: readonly PreviewLineView[] = rows.map((r) => {
    const line = lineByDoc.get(r.documentId)

    const { remittable, pendencyTag, gaps } = ((): Readonly<{
      remittable: boolean
      pendencyTag: string | null
      gaps: readonly PreviewGapView[]
    }> => {
      if (r.isRetentionChild) {
        return { remittable: false, pendencyTag: 'financial.remittance.preview.pendency.taxGuide', gaps: [] }
      }
      if (line === undefined) {
        return {
          remittable: false,
          pendencyTag: 'financial.remittance.preview.pendency.notChecked',
          gaps: [],
        }
      }
      if (line.status === 'ready') return { remittable: true, pendencyTag: null, gaps: [] }
      return {
        remittable: false,
        pendencyTag:
          line.status === 'out-of-van'
            ? 'financial.remittance.preview.pendency.outOfVan'
            : line.status === 'not-found'
              ? 'financial.remittance.preview.pendency.notFound'
              : 'financial.remittance.preview.pendency.missingData',
        gaps: line.gaps.map((g) => ({ fieldTag: FIELD_TAG[g.field], reasonTag: REASON_TAG[g.reason] })),
      }
    })()

    return {
      payableId: r.id,
      documentId: r.documentId,
      paymentMethodTag: r.paymentMethod === null ? null : `financial.paymentMethod.${r.paymentMethod}`,
      documentNumber: r.documentNumber,
      supplier: r.supplier,
      due: r.due,
      // Valor DO TÍTULO (o filho tem o seu), não o líquido do documento — era essa a troca que fazia a
      // linha do imposto exibir o valor do fornecedor.
      net: r.netCents === null || r.netCents === '' ? DASH : centsToBRL(r.netCents),
      remittable,
      // Impedido nunca vai marcado: já nasce fora, e o operador não precisa desmarcar o que não pode ir.
      checked: remittable && !unchecked.has(r.id),
      pendencyTag,
      gaps,
    }
  })

  // Impedidos primeiro: é o que trava o lote.
  const sorted = [...lines].sort((a, b) => Number(a.remittable) - Number(b.remittable))
  const checkedLines = lines.filter((l) => l.checked)

  const dueDates = new Set(checkedLines.map((l) => l.due).filter((d) => d !== DASH))
  const [firstDue] = [...dueDates]

  const rowById = new Map(rows.map((r) => [r.id, r]))
  const grossTotal = sumCents(...checkedLines.map((l) => rowById.get(l.payableId)?.grossCents ?? undefined))
  const netTotal = sumCents(...checkedLines.map((l) => rowById.get(l.payableId)?.netCents ?? undefined))

  // Total da remessa: o valor que o BACKEND apurou para cada documento marcado (dedup — um documento
  // entra uma vez no arquivo, ainda que o operador tenha marcado mais de um título dele).
  const checkedDocs = [...new Set(checkedLines.map((l) => l.documentId))]
  const remittanceTotal = sumCents(...checkedDocs.map((d) => lineByDoc.get(d)?.netValueCents))

  return {
    lines: sorted,
    checkedDocumentIds: checkedDocs,
    summary: {
      checkedCount: checkedLines.length,
      titleCount: lines.length,
      grossTotal: centsToBRL(grossTotal),
      netTotal: centsToBRL(netTotal),
      paymentDate: dueDates.size === 1 && firstDue !== undefined ? firstDue : DASH,
      paymentDateMixed: dueDates.size > 1,
      remittanceTotal: centsToBRL(remittanceTotal),
      pendingCount: lines.filter((l) => !l.remittable).length,
    },
  }
}
