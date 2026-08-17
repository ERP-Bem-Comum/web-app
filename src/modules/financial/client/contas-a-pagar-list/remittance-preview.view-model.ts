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
// O motivo viaja junto do campo porque a AÇÃO difere: `missing` pede preencher; `unmappable`/`malformed`
// pedem corrigir o que já está lá. Não vira coluna — a tela só destaca a linha, e o detalhe fica no
// title (tooltip), ao alcance de quem for corrigir sem poluir a leitura de quem só quer conferir.

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
  documentId: string
  /** Tag i18n da forma de pagamento (mesma do grid). `null` → o documento não tem forma definida. */
  paymentMethodTag: string | null
  documentNumber: string
  supplier: string
  /** Vencimento = a data em que o banco processa o pagamento (o core-api usa `dueDate` como `paymentDate`). */
  due: string
  net: string
  /** Único bit que o pré-voo acrescenta à leitura do grid: esta linha sai ou não sai. */
  hasPendency: boolean
  /** Vazio quando a pendência não tem campo (ex.: forma fora da VAN) — a linha destaca do mesmo jeito. */
  gaps: readonly PreviewGapView[]
}>

export type PreviewSummary = Readonly<{
  titleCount: number
  /** Bruto somado dos títulos conferidos (vem do grid — o pré-voo devolve só o líquido). */
  grossTotal: string
  /** Líquido somado de TODOS os conferidos, saiam ou não. */
  netTotal: string
  /** Vencimento comum do lote. Uma remessa é de um dia só — datas diferentes o backend recusa. */
  paymentDate: string
  paymentDateMixed: boolean
  /** O que de fato sai no arquivo: só as linhas sem pendência. É o valor que deixa a conta. */
  remittanceTotal: string
  pendingCount: number
}>

export type PreviewView = Readonly<{
  lines: readonly PreviewLineView[]
  summary: PreviewSummary
}>

/**
 * Junta o pré-voo (que fala em `documentId`) com o grid (que tem fornecedor, número, forma e vencimento).
 * Ordena as linhas COM pendência primeiro: quem abre a conferência quer ver o que trava o lote.
 */
export const toPreviewView = (preview: RemittancePreview, rows: readonly GridRow[]): PreviewView => {
  const byDoc = new Map<string, GridRow>()
  for (const r of rows) if (!byDoc.has(r.documentId)) byDoc.set(r.documentId, r)

  const lines: readonly PreviewLineView[] = preview.lines.map((l) => {
    const row = byDoc.get(l.documentId)
    return {
      documentId: l.documentId,
      paymentMethodTag:
        row?.paymentMethod === undefined || row.paymentMethod === null
          ? null
          : `financial.paymentMethod.${row.paymentMethod}`,
      documentNumber: row?.documentNumber ?? DASH,
      supplier: row?.supplier ?? DASH,
      due: row?.due ?? DASH,
      net: l.netValueCents === '' ? DASH : centsToBRL(l.netValueCents),
      // `ready` é o ÚNICO estado que entra no arquivo. Tudo o mais — falta de cadastro, forma fora da
      // VAN, id que sumiu — é pendência para quem confere: a linha não sai, e a razão de não sair não
      // muda o que ele vê aqui (muda o que ele faz depois, e para isso existe o detalhe da lacuna).
      hasPendency: l.status !== 'ready',
      gaps: l.gaps.map((g) => ({ fieldTag: FIELD_TAG[g.field], reasonTag: REASON_TAG[g.reason] })),
    }
  })

  const sorted = [...lines].sort((a, b) => Number(b.hasPendency) - Number(a.hasPendency))

  // Vencimentos distintos entre os conferidos. Mais de um = o backend recusaria gerar
  // (`remittance-mixed-payment-dates`), então a conferência precisa dizer isso antes.
  const dueDates = new Set(lines.map((l) => l.due).filter((d) => d !== DASH))
  const [firstDue] = [...dueDates]

  const grossTotal = sumCents(...preview.lines.map((l) => byDoc.get(l.documentId)?.grossCents ?? undefined))
  const netTotal = sumCents(...preview.lines.map((l) => l.netValueCents))

  return {
    lines: sorted,
    summary: {
      titleCount: lines.length,
      grossTotal: centsToBRL(grossTotal),
      netTotal: centsToBRL(netTotal),
      paymentDate: dueDates.size === 1 && firstDue !== undefined ? firstDue : DASH,
      paymentDateMixed: dueDates.size > 1,
      // Vem do BACKEND, não de soma nossa: é ele quem decide o que é apto, e recalcular aqui abriria
      // espaço para a tela prometer um valor que o arquivo não confirma.
      remittanceTotal: centsToBRL(preview.readyTotalCents),
      pendingCount: lines.filter((l) => l.hasPendency).length,
    },
  }
}
