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

// ── [03/09] SAIU: a mitigação de tela das rotas SEM emissor ────────────────────
//
// Havia aqui um `ROUTES_WITHOUT_EMITTER = {'pix'}` com `routeHasEmitter`/`NO_EMITTER_PENDENCY`: o
// pré-voo dizia `ready` para PIX, o emissor recusava, e o montador abortava o ARQUIVO INTEIRO — um
// título PIX na seleção derrubava a remessa dos outros. Enquanto a régua verdadeira não existia no
// backend, ela morava aqui.
//
// As duas condições da remoção fecharam:
//  · core-api#837 (PR #925) — o backend NOMEIA o caso: a linha volta com status `no-issuer`, e a tela
//    passa a exibir a pendência por DADO do backend (ver `pendency.noIssuer`, abaixo), não por
//    inferência de rota;
//  · core-api#936 — o PIX GANHOU emissor (par A+B na forma `45`), na `dev` desde 01/09 (rc.2). O
//    pressuposto que sustentava a mitigação deixou de ser verdade: manter o bloqueio esconderia do
//    operador uma remessa que o backend já sabe gerar, e a frase ("não tem esse trilho") passaria a
//    mentir.
//
// O gatilho que estava escrito aqui — "a homologação devolver `no-issuer` para um PIX" — nunca
// dispararia: com o #936, o pré-voo do PIX responde `ready`, não `no-issuer`. Fica o registro para
// que a próxima mitigação por rota nasça com um gatilho que o próprio sucesso não invalide.
//
// ⚠️ `tax-guide` NUNCA esteve nesta régua, e continua fora: é a rota das retenções, e a #794 decidiu
// "destacar, não travar" (P.O., 29/08). Quem a julga é o backend, pelo `no-issuer`.

/**
 * ⚠️ PIX É EXCLUSIVO — decisão da P.O. em 03/09/2026 (core-api#948, CA4).
 *
 * "Habilita só em remessa com todas as transações com o pagamento do tipo Pix. Se acontecer de
 * selecionar Pix e TED junto, o Pix deve ficar desmarcado. Então o sistema deve alertar ao usuário."
 *
 * O desempate é assimétrico DE PROPÓSITO: quem cai é o PIX, nunca o TED. A remessa das outras formas
 * segue; o PIX vai em remessa própria.
 *
 * ⚠️ Isto NÃO é a mesma coisa que a exclusividade de ARQUIVO, que já existe e é do layout: o
 * `fileGroupFor` do core-api já põe o PIX em grupo próprio, então o arquivo nunca sairia misto. O que
 * esta régua acrescenta é a exclusividade da REMESSA — um lote, uma modalidade, um comprovante, um
 * retorno. Sem ela, uma seleção mista geraria DOIS arquivos no mesmo lote, cada um queimando o seu NSA.
 *
 * A régua do servidor é a de verdade (core-api#948, CA4: recusa 4xx antes do `allocateNsa`); esta aqui
 * existe porque é na tela que o operador ainda tem como consertar — e porque a rota é alcançável sem
 * passar por ela.
 */
const PIX_NOT_EXCLUSIVE_PENDENCY = 'financial.remittance.preview.pendency.pixNotExclusive'

/**
 * A seleção MARCADA permite que o PIX entre? Só se nada além de PIX estiver marcado.
 *
 * Avalia o que está marcado AGORA, e não a seleção que veio do grid: desmarcando os títulos das outras
 * formas, a seleção vira exclusiva e as linhas PIX voltam a ficar operáveis. Sem isso o operador não
 * teria como chegar a uma remessa PIX a partir de uma seleção mista sem voltar ao grid e recomeçar.
 *
 * Não circula: a régua só DESMARCA PIX, e desmarcar PIX não muda o que ela pergunta (se há não-PIX
 * marcado). Uma passada basta.
 *
 * Seleção vazia devolve `true` — nada marcado não impede nada, e o PIX que o operador marcar depois
 * será julgado pela seleção que existir então.
 *
 * ⚠️ Rota `null` (desconhecida) conta como NÃO-PIX e portanto barra o PIX. É o lado seguro da dúvida:
 * a régua exige que TODAS as transações sejam PIX, e uma rota que não sabemos qual é não prova isso.
 */
export const selectionAllowsPix = (checkedRoutes: readonly (VanRoute | null)[]): boolean =>
  checkedRoutes.every((r) => r === 'pix')

/** Uma linha do pré-voo com a rota ao lado — a rota não vai para a view, mas a régua precisa dela. */
export type RoutedPreviewLine = Readonly<{ view: PreviewLineView; route: VanRoute | null }>

/**
 * Aplica a exclusividade do PIX sobre as linhas JÁ julgadas uma a uma.
 *
 * Só o PIX cai, e só quando há não-PIX marcado. Uma linha PIX já impedida por outro motivo não é
 * tocada: ela continua exibindo a SUA pendência, que é a que o operador precisa ler — trocá-la por
 * "não é remessa exclusiva" esconderia o motivo verdadeiro atrás de um efeito colateral.
 *
 * Vive fora de `toPreviewView` para ser exercitada sozinha, com a seleção montada à mão: é a única
 * régua da tela que depende das OUTRAS linhas, e provar isso por dentro do mapeamento inteiro custaria
 * uma fixture por caso.
 */
export const applyPixExclusivity = (
  baseLines: readonly RoutedPreviewLine[],
): Readonly<{ lines: readonly PreviewLineView[]; droppedCount: number }> => {
  const allowed = selectionAllowsPix(baseLines.filter((l) => l.view.checked).map((l) => l.route))
  if (allowed) return { lines: baseLines.map((l) => l.view), droppedCount: 0 }

  const dropped = new Set(
    baseLines.filter((l) => l.route === 'pix' && l.view.remittable).map((l) => l.view.payableId),
  )

  return {
    lines: baseLines.map((l) =>
      dropped.has(l.view.payableId)
        ? { ...l.view, remittable: false, checked: false, pendencyTag: PIX_NOT_EXCLUSIVE_PENDENCY }
        : l.view,
    ),
    droppedCount: dropped.size,
  }
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
  /**
   * A data de pagamento já passou. **Impede gerar**, como os vencimentos misturados.
   *
   * A data do Segmento A é o dia em que o banco executa; um dia que já foi não é instrução que o banco
   * possa cumprir. Só o vencimento do TÍTULO responde por ela (a remessa é de um dia só), então a
   * correção é reagendar o vencimento — não há o que ajustar na remessa.
   */
  paymentDateInPast: boolean
  /** O que sai no arquivo: soma dos MARCADOS, com o valor que o backend apurou POR TÍTULO. */
  remittanceTotal: string
  pendingCount: number
  /**
   * Retenções MARCADAS — as que entrariam no arquivo. Só o selo na linha não basta: numa lista longa
   * ele passa despercebido, e o imposto marcado sai por TED ao fornecedor sem nenhuma pendência.
   */
  retentionCheckedCount: number
  /**
   * Títulos PIX que a régua de exclusividade desmarcou (ver `selectionAllowsPix`). `0` = sem alerta.
   *
   * Precisa de aviso no TOPO, e não só da pendência na linha: o título foi desmarcado por causa de
   * OUTRA linha, e numa lista longa o operador veria o PIX sumir do total sem nada explicando por quê.
   */
  pixNotExclusiveCount: number
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
  /**
   * Hoje, em ISO LOCAL (YYYY-MM-DD). Entra por parâmetro para este ViewModel seguir puro e testável —
   * o `new Date()` mora no binding, mesmo idioma de `reconciliation-accounts.view-model.ts`.
   *
   * ⚠️ Local, não UTC: `toISOString()` recua um dia à noite no fuso de Brasília, e isso reprovaria uma
   * remessa de hoje como se fosse de ontem — justo o erro que esta regra existe para pegar.
   */
  today: string,
): PreviewView => {
  const lineByPayable = new Map(preview.lines.map((l) => [l.payableId, l]))

  // Não-aprovado NÃO APARECE. Ele não é candidato à remessa (premissa de negócio), e mostrá-lo como
  // linha impedida misturaria duas coisas que pedem ações opostas: "corrija o cadastro" e "este título
  // nem está no páreo". Quem informa que ficaram títulos de fora é o aviso do topo, com a contagem.
  const rows = selectedRows.filter((r) => r.status === REMITTANCE_ELIGIBLE_STATUS)

  // PRIMEIRA PASSADA — o veredito de cada linha isolada: o do backend, mais a régua de emissor. A
  // rota viaja junto porque a segunda passada precisa dela, e o `PreviewLineView` não a carrega (a
  // view não decide nada com a rota; ela só exibe o rótulo que já vem pronto).
  const baseLines = rows.map((r): Readonly<{ view: PreviewLineView; route: VanRoute | null }> => {
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
      // `ready` é `ready`: quem sabe se a rota tem emissor é o backend, e ele responde `no-issuer`
      // quando não tem (core-api#837). A tela não infere mais nada pela rota.
      if (line.status === 'ready') {
        return { remittable: true, pendencyTag: null, gaps: [] }
      }
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
                : // core-api#792/ADR-0065 §5: já saiu numa remessa. Precisa de frase PRÓPRIA porque a
                  // ação do operador é oposta à do `blocked` — não há cadastro a corrigir, e reenviar
                  // seria pagar de novo. Antes desta linha o status caía no fallback de drift e a
                  // tela acusava falta de dado bancário num cadastro completo.
                  line.status === 'transmitted'
                  ? 'financial.remittance.preview.pendency.alreadyTransmitted'
                  : // core-api#837: a rota não tem emissor no CNAB — dito pelo BACKEND, não inferido
                    // aqui. Frase própria porque `blocked` mandaria corrigir um cadastro que pode
                    // estar completo. ⚠️ Só PIX e guia caem aqui; boleto e transferência TÊM emissor.
                    line.status === 'no-issuer'
                    ? 'financial.remittance.preview.pendency.noIssuer'
                    : blockedPendencyTag(line.route, line.gaps),
        gaps: line.gaps.map((g) => ({ fieldTag: FIELD_TAG[g.field], reasonTag: REASON_TAG[g.reason] })),
      }
    })()

    return {
      view: {
        payableId: r.id,
        documentId: r.documentId,
        paymentMethodTag: r.paymentMethod === null ? null : `financial.paymentMethod.${r.paymentMethod}`,
        documentNumber: r.documentNumber,
        supplier: r.supplier,
        due: r.due,
        // Valor DO TÍTULO (o filho tem o seu), não o líquido do documento — era essa a troca que fazia
        // a linha do imposto exibir o valor do fornecedor.
        net: r.netCents === null || r.netCents === '' ? DASH : centsToBRL(r.netCents),
        remittable,
        // Impedido nunca vai marcado: já nasce fora, e o operador não precisa desmarcar o que não pode ir.
        checked: remittable && !unchecked.has(r.id),
        pendencyTag,
        gaps,
        isRetention: r.isRetentionChild,
      },
      route: line?.route ?? null,
    }
  })

  // SEGUNDA PASSADA — a régua que olha a SELEÇÃO INTEIRA, e não a linha (ver `applyPixExclusivity`).
  //
  // Ela ENTROU EM SERVIÇO junto com a saída da mitigação de emissor (acima), e essa ordem é a própria
  // decisão da P.O.: enquanto todo PIX era barrado, as duas juntas diriam coisas diferentes sobre o
  // mesmo título; e liberar o PIX sem ela deixaria a seleção mista gerar DOIS arquivos no mesmo lote,
  // cada um queimando o seu NSA.
  const { lines, droppedCount: pixNotExclusiveCount } = applyPixExclusivity(baseLines)

  // Impedidos primeiro: é o que trava o lote.
  const sorted = [...lines].sort((a, b) => Number(a.remittable) - Number(b.remittable))
  const checkedLines = lines.filter((l) => l.checked)

  const dueDates = new Set(checkedLines.map((l) => l.due).filter((d) => d !== DASH))
  const [firstDue] = [...dueDates]

  // Pagamento no passado: comparação sobre o ISO CRU do vencimento, nunca sobre o `due` de tela — string
  // formatada re-parseada é onde se troca dia por mês. `YYYY-MM-DD` compara lexicograficamente igual a
  // cronologicamente, então `<` basta e não há `Date` (nem fuso) no caminho.
  // Título SEM vencimento não entra na conta: ausência não é passado, e ele já é impedido por outra via.
  const rowById = new Map(rows.map((r) => [r.id, r]))
  const paymentDateInPast = checkedLines.some((l) => {
    const iso = rowById.get(l.payableId)?.dueIso
    return iso !== null && iso !== undefined && iso < today
  })

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
      paymentDateInPast,
      remittanceTotal: centsToBRL(remittanceTotal),
      pendingCount: lines.filter((l) => !l.remittable).length,
      retentionCheckedCount: checkedLines.filter((l) => l.isRetention).length,
      pixNotExclusiveCount,
    },
  }
}

// ── Geração (S3) ────────────────────────────────────────────────────────────────

/**
 * Comprovante PRONTO para a view: a formatação do dinheiro fica aqui, não no componente (boundary §I —
 * `ui` não importa `data`, e `centsToBRL` mora lá).
 */
/** UM arquivo do comprovante. `remittanceId` fica porque o download é POR ARQUIVO. */
export type GeneratedRemittanceFileView = Readonly<{
  remittanceId: string
  nsa: string
  fileName: string
  total: string
}>

export type GeneratedRemittanceView = Readonly<{
  /**
   * ⚠️ TODOS os arquivos do lote (core-api#929). Boleto e transferência não cabem no mesmo lote, então
   * uma seleção mista gera mais de um — cada um com NSA próprio e download próprio.
   *
   * Listar todos não é capricho de completude: exibir só o primeiro faria o comprovante descrever
   * METADE do que foi enfileirado no banco, e o operador confirmaria acreditando ter conferido.
   */
  files: readonly GeneratedRemittanceFileView[]
  /**
   * O dia em que o banco executa o pagamento (Segmento A). É o único dado do comprovante que o operador
   * NÃO reconfere em outro lugar depois — o total ele vê no resumo, os títulos ele acabou de marcar —, e
   * é ele que responde "quando sai o dinheiro?".
   *
   * ⚠️ CONGELADO no ato do envio, e não derivado do pré-voo depois. Enquanto era derivado, funcionava
   * por acidente: o título continuava `Aprovado` após gerar, então seguia marcado e a data sobrevivia.
   * Com o core-api#792 ele passa a `Transmitido`, sai de `remittable`, deixa de estar `checked` — e o
   * resumo colapsava para "—" exatamente quando o comprovante precisava do valor. Comprovante descreve
   * o que JÁ aconteceu; derivá-lo de estado que muda embaixo é o defeito, não o sintoma.
   */
  paymentDate: string
}>

/**
 * O que foi ENVIADO, capturado no clique — nunca relido do estado da tela depois.
 *
 * Só a data: a quantidade saiu do comprovante (a P.O. a lê na conferência anterior). O tipo permanece
 * porque o PROBLEMA que ele resolve não era da quantidade — é que o comprovante descreve um fato
 * passado enquanto a tela por baixo já mudou de estado.
 */
export type SentRemittance = Readonly<{ paymentDate: string }>

export const toReceiptView = (g: GeneratedRemittance, sent: SentRemittance): GeneratedRemittanceView => ({
  files: g.files.map((f) => ({
    remittanceId: f.remittanceId,
    nsa: String(f.nsa),
    fileName: f.fileName,
    total: centsToBRL(f.totalCents),
  })),
  paymentDate: sent.paymentDate,
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
