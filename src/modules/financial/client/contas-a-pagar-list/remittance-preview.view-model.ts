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
  PayoutGap,
  PayoutGapReason,
  VanRoute,
  RemittancePreview,
  GeneratedRemittance,
} from '#modules/financial/client/data/model/remittance.model.ts'

import type { ReconciliationAccount } from '#modules/financial/client/data/model/reconciliation.model.ts'

import type { GridRow } from './contas-a-pagar.view-model.ts'

/** Status do título que torna o documento candidato à remessa. Fora dele, nem chega ao core-api. */
const REMITTANCE_ELIGIBLE_STATUS = 'Aprovado'

const DASH = '—'

export type RemittanceSelection = Readonly<{
  /** TÍTULOS elegíveis — é o que vai no corpo do pré-voo. */
  payableIds: readonly string[]
  /** Títulos que NÃO são Aprovado. Não viajam; a tela diz quantos ficaram de fora. */
  notApprovedCount: number
}>

/**
 * Deriva o alvo do pré-voo: um id por TÍTULO SELECIONADO, sem dedup.
 *
 * ⚠️ Antes isto deduplicava por `documentId`, porque o core-api respondia POR NOTA e vários títulos da
 * mesma nota viravam uma linha só. Desde o core-api#794 a remessa fala TÍTULO de ponta a ponta — a
 * nota dá origem aos títulos, mas o ciclo de vida é deles: forma, vencimento e status são do título,
 * e a retenção é título a pagar como qualquer outro, podendo ficar em aberto com o pai já pago.
 *
 * O filtro de status continua aqui: só título APROVADO entra em remessa (premissa de negócio). O
 * backend hoje também classifica o não-aprovado (`not-approved`), então isto deixou de ser a única
 * barreira — mas segue evitando mandar ao pré-voo o que já se sabe que não vai.
 */
export const deriveRemittanceSelection = (rows: readonly GridRow[]): RemittanceSelection => {
  const payableIds: string[] = []
  let notApprovedCount = 0

  for (const r of rows) {
    if (r.status !== REMITTANCE_ELIGIBLE_STATUS) {
      notApprovedCount += 1
      continue
    }
    payableIds.push(r.id)
  }

  return { payableIds, notApprovedCount }
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
  // O dado ESTÁ lá e bem formado — o que não fecha é o dígito. Pedir "corrija o formato" aqui mandaria
  // o operador consertar o que já está certo.
  'check-digit-mismatch': 'financial.remittance.preview.reason.checkDigitMismatch',
}

/**
 * O rótulo do impedimento sai de DUAS coisas: a forma de pagamento (que dado o arquivo precisa) e o
 * motivo (se o dado falta, não serve, ou está errado). Só a rota não basta — o mesmo trilho recusa por
 * razões que pedem ações opostas do operador.
 *
 *  - TED / Transferência → banco, agência e conta; mas DÍGITO DIVERGENTE não é cadastro incompleto:
 *                          está tudo preenchido, e mandar "completar" manda mexer no que já está certo;
 *  - Boleto / Guia       → CÓDIGO DE BARRAS (44 dígitos). ⚠️ A linha digitável (47) NÃO serve: são
 *                          outros campos, com DVs que o código de barras não tem, noutra ordem. O
 *                          core-api a recusa como `unmappable` — dado presente e inaproveitável — e
 *                          dizer "sem linha digitável" a quem acabou de preenchê-la é o pior recado
 *                          possível. Nenhum dado bancário do favorecido é olhado nesta rota;
 *  - PIX                 → a chave cadastrada no título; o arquivo não olha agência nem conta.
 */
const CHECK_DIGIT_PENDENCY = 'financial.remittance.preview.pendency.checkDigit'
const GENERIC_PENDENCY = 'financial.remittance.preview.pendency.missingData'

const BARCODE_PENDENCY: Record<PayoutGapReason, string> = {
  missing: 'financial.remittance.preview.pendency.missingBarcode',
  // O operador PREENCHEU — com a linha digitável. Falta a conversão, não o dado.
  unmappable: 'financial.remittance.preview.pendency.barcodeIsDigitableLine',
  malformed: 'financial.remittance.preview.pendency.barcodeMalformed',
  'check-digit-mismatch': 'financial.remittance.preview.pendency.missingBarcode',
}

const blockedPendencyTag = (route: VanRoute | null, gaps: readonly PayoutGap[]): string => {
  // Dígito divergente ganha do resto: é o único motivo em que o cadastro está COMPLETO, e confundi-lo
  // com falta de dado é exatamente o mal-entendido que o motivo foi criado para desfazer.
  if (gaps.some((g) => g.reason === 'check-digit-mismatch')) return CHECK_DIGIT_PENDENCY

  switch (route) {
    case 'transfer':
      return 'financial.remittance.preview.pendency.missingBankData'
    case 'pix':
      return 'financial.remittance.preview.pendency.missingPixKey'
    case 'billet':
    case 'tax-guide': {
      const detail = gaps.find((g) => g.field === 'payment-detail')
      return detail === undefined ? BARCODE_PENDENCY.missing : BARCODE_PENDENCY[detail.reason]
    }
    // Rota desconhecida: sem saber o trilho, nomear um campo seria chutar onde o operador deve mexer.
    case null:
      return GENERIC_PENDENCY
  }
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
  /**
   * Título de RETENÇÃO (imposto). Sinalizado — não bloqueado — porque hoje ele herda a forma e o
   * favorecido da NOTA: um IRRF numa nota paga por TED sai como transferência para o FORNECEDOR, em
   * vez de guia ao órgão arrecadador. Pela régua do backend está apto, e nenhuma pendência aparece.
   *
   * A decisão da P.O. é destacar e deixar o operador desmarcar, não travar: as regras tributárias do
   * país vão mudar em breve e a modelagem da retenção será revista de qualquer forma — uma trava
   * nossa agora viraria dívida no meio do caminho.
   */
  isRetention: boolean
}>

export type PreviewSummary = Readonly<{
  /** Marcados × exibidos: o totalizador acompanha o que o operador desmarcou. */
  checkedCount: number
  titleCount: number
  grossTotal: string
  netTotal: string
  paymentDate: string
  paymentDateMixed: boolean
  /** O que sai no arquivo: soma dos MARCADOS, com o valor que o backend apurou POR TÍTULO. */
  remittanceTotal: string
  pendingCount: number
  /**
   * Retenções MARCADAS — as que entrariam no arquivo. Só o selo na linha não basta: numa lista longa
   * ele passa despercebido, e o imposto marcado sai por TED ao fornecedor sem nenhuma pendência.
   */
  retentionCheckedCount: number
}>

export type PreviewView = Readonly<{
  lines: readonly PreviewLineView[]
  summary: PreviewSummary
  /** TÍTULOS que irão na geração — só os marcados. */
  checkedPayableIds: readonly string[]
}>

/**
 * UMA LINHA POR TÍTULO SELECIONADO — e agora o veredito também é por título.
 *
 * O grid é title-centric (#201) e, desde o core-api#794, o pré-voo responde na MESMA unidade: a nota dá
 * origem aos títulos, mas o ciclo de vida é deles — forma, vencimento e status são do título.
 *
 * ⚠️ Sumiu daqui a régua que marcava TODO filho de retenção como não-remessável. Ela existia porque o
 * backend respondia por nota e não tinha caminho para pagar o imposto a partir do filho. Agora tem: a
 * retenção é título a pagar como qualquer outro, com favorecido e valor próprios, e pode ficar em
 * aberto com o pai já pago. Quem decide se ela entra é o veredito do backend, não uma suposição nossa.
 */
export const toPreviewView = (
  preview: RemittancePreview,
  selectedRows: readonly GridRow[],
  unchecked: ReadonlySet<string>,
): PreviewView => {
  const lineByPayable = new Map(preview.lines.map((l) => [l.payableId, l]))

  // Não-aprovado NÃO APARECE. Ele não é candidato à remessa (premissa de negócio), e mostrá-lo como
  // linha impedida misturaria duas coisas que pedem ações opostas: "corrija o cadastro" e "este título
  // nem está no páreo". Quem informa que ficaram títulos de fora é o aviso do topo, com a contagem.
  const rows = selectedRows.filter((r) => r.status === REMITTANCE_ELIGIBLE_STATUS)

  const lines: readonly PreviewLineView[] = rows.map((r) => {
    const line = lineByPayable.get(r.id)

    const { remittable, pendencyTag, gaps } = ((): Readonly<{
      remittable: boolean
      pendencyTag: string | null
      gaps: readonly PreviewGapView[]
    }> => {
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
              : // #736 virou status de linha no backend. O front já filtra o não-aprovado antes de
                // chamar, então isto é a segunda barreira — e se um escapar, a linha diz o certo em
                // vez de acusar falta de cadastro.
                line.status === 'not-approved'
                ? 'financial.remittance.preview.pendency.notApprovedLine'
                : blockedPendencyTag(line.route, line.gaps),
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
      isRetention: r.isRetentionChild,
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
  // Soma o valor QUE O BACKEND apurou para cada TÍTULO marcado. Antes somava por documento (dedup),
  // porque o veredito era por nota; agora cada título traz o seu — e no filho de retenção esse valor
  // não é o líquido da nota.
  const checkedPayableIds = checkedLines.map((l) => l.payableId)
  const remittanceTotal = sumCents(...checkedPayableIds.map((id) => lineByPayable.get(id)?.valueCents))

  return {
    lines: sorted,
    checkedPayableIds,
    summary: {
      checkedCount: checkedLines.length,
      titleCount: lines.length,
      grossTotal: centsToBRL(grossTotal),
      netTotal: centsToBRL(netTotal),
      paymentDate: dueDates.size === 1 && firstDue !== undefined ? firstDue : DASH,
      paymentDateMixed: dueDates.size > 1,
      remittanceTotal: centsToBRL(remittanceTotal),
      pendingCount: lines.filter((l) => !l.remittable).length,
      retentionCheckedCount: checkedLines.filter((l) => l.isRetention).length,
    },
  }
}

// ── Geração (S3) ────────────────────────────────────────────────────────────────

/**
 * Comprovante PRONTO para a view: a formatação do dinheiro fica aqui, não no componente (boundary §I —
 * `ui` não importa `data`, e `centsToBRL` mora lá).
 */
export type GeneratedRemittanceView = Readonly<{
  nsa: string
  fileName: string
  lineCount: string
  total: string
  /**
   * O dia em que o banco executa o pagamento (Segmento A). É o único dado do comprovante que o operador
   * NÃO reconfere em outro lugar depois — o total ele vê no resumo, os títulos ele acabou de marcar —, e
   * é ele que responde "quando sai o dinheiro?". Vem do pré-voo, não da resposta da geração: a remessa é
   * de um único dia (vencimentos misturados bloqueiam o envio), então é o vencimento dos títulos que foram.
   */
  paymentDate: string
}>

export const toReceiptView = (g: GeneratedRemittance, paymentDate: string): GeneratedRemittanceView => ({
  nsa: String(g.nsa),
  fileName: g.fileName,
  lineCount: String(g.lineCount),
  total: centsToBRL(g.totalCents),
  paymentDate,
})

/** Conta-cedente como o seletor precisa: id + rótulo pronto. A view não formata dado de domínio. */
export type ReconciliationAccountOption = Readonly<{ id: string; label: string }>

/**
 * Rótulo da conta que PAGA. Apelido primeiro (é como o operador a chama), banco/agência/conta em seguida
 * para desempatar contas do mesmo apelido — errar a conta aqui é pagar pela conta errada.
 */
export const toAccountOptions = (
  accounts: readonly ReconciliationAccount[],
): readonly ReconciliationAccountOption[] =>
  accounts.map((a) => ({
    id: a.id,
    label: `${a.alias !== '' ? a.alias : a.bankName} · ${a.bankCode} · Ag. ${a.branch} · C/C ${a.accountNumber}-${a.accountDv}`,
  }))
