/**
 * RemittancePreviewModal — view BURRA (§XI): "Conferir Remessa" (VAN, core-api#728). Não decide nada;
 * recebe a `PreviewView` já derivada e desenha.
 *
 * Leitura pura: abrir este modal não consome NSA, não prende título e não grava no bucket da VAN. Por
 * isso não há aqui botão que dispare pagamento — "Gerar remessa" é a fatia seguinte.
 *
 * A tabela espelha o grid de Contas a Pagar (mesmas colunas, mesmo cabeçalho, mesma altura de linha).
 * Não há coluna de situação: a linha que NÃO entra na remessa sai destacada em vermelho, e o detalhe da
 * pendência fica no `title` — ao alcance de quem vai corrigir, fora do caminho de quem só confere.
 */
import { Fragment } from 'react'
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import type { PreviewLineView, PreviewView } from '../remittance-preview.view-model.ts'
import type {
  GeneratedRemittanceView,
  ReconciliationAccountOption,
} from '../remittance-preview.view-model.ts'

import {
  confirmOverlay,
  confirmTitle,
  confirmText,
  confirmActions,
  confirmCancelBtn,
} from '../page/contas-a-pagar.css.ts'
import {
  previewDialog,
  summary,
  summaryItem,
  summaryLabel,
  summaryValue,
  summaryValueStrong,
  summaryValueWarn,
  gridBox,
  head,
  headCell,
  headCellRight,
  row,
  rowPending,
  cell,
  cellDoc,
  cellDocStack,
  cellNet,
  checkbox,
  checkboxDisabled,
  pendencyLabel,
  retentionBadge,
  notice,
  errorBox,
  emptyState,
  launchBar,
  launchAlert,
  launchError,
  launchLabel,
  accountSelect,
  launchBtn,
  confirmLaunchBtn,
  launchWarn,
  receiptActions,
  downloadBtn,
  downloadWarn,
  downloadError,
  receipt,
  receiptTitle,
  receiptGrid,
  accountBar,
} from './remittance-preview.css.ts'

const t = createTranslator(ptBR)

const DASH = '—'

/** Detalhe campo+motivo no tooltip: "Agência do favorecido — não preenchido". */
const pendencyHint = (line: PreviewLineView): string | undefined =>
  line.gaps.length === 0
    ? undefined
    : line.gaps.map((g) => `${t(g.fieldTag)} — ${t(g.reasonTag)}`).join(' · ')

export type RemittancePreviewModalProps = Readonly<{
  open: boolean
  running: boolean
  view: PreviewView | null
  errorTag: string | null
  /** Títulos que não estão Aprovados — barrados no front, nunca chegam ao core-api (core-api#736). */
  notApprovedCount: number
  onToggle: (payableId: string) => void
  onClose: () => void
  /** Esperando a conta-cedente para poder conferir (core-api#804). Não é erro: é o passo anterior. */
  awaitingAccount: boolean

  // ── Geração (S3) — ⚠️ enfileira pagamento no banco ────────────────────────────
  accounts: readonly ReconciliationAccountOption[]
  cedenteAccountId: string
  onCedenteAccount: (id: string) => void
  confirming: boolean
  onArm: () => void
  onDisarm: () => void
  generating: boolean
  generated: GeneratedRemittanceView | null
  generateErrorTag: string | null
  generateErrorMessage: string | null
  onGenerate: () => void

  // ── Download do arquivo (specs/103) — cópia de conferência, em TODO ambiente ────
  downloading: boolean
  downloadErrorTag: string | null
  /** Mensagem PT-BR do core-api. `null` onde a rota nem é registrada (404 seco do Fastify). */
  downloadErrorMessage: string | null
  /** O objeto veio de `falhas/`: o envio ao banco NÃO completou. */
  downloadedFromFailures: boolean
  /** Recebe o `remittanceId` do arquivo clicado — o lote pode ter mais de um (core-api#929). */
  onDownload: (remittanceId: string) => void
}>

export function RemittancePreviewModal(props: RemittancePreviewModalProps): ReactNode {
  if (!props.open) return null
  const { view } = props

  return (
    <div className={confirmOverlay} role="dialog" aria-modal="true" onClick={props.onClose}>
      <div
        className={previewDialog}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <h2 className={confirmTitle}>{t('financial.remittance.preview.title')}</h2>
        <p className={confirmText}>{t('financial.remittance.preview.subtitle')}</p>

        {props.notApprovedCount > 0 ? (
          <p className={notice}>
            {`${String(props.notApprovedCount)} ${t('financial.remittance.preview.notApproved')}`}
          </p>
        ) : null}

        {props.errorTag !== null ? <p className={errorBox}>{t(props.errorTag)}</p> : null}

        {/* A conta que PAGA, no topo (core-api#804): a conferência é resposta a ela — a repartição em
            lotes se decide comparando o banco do favorecido com o do cedente. Some quando o comprovante
            está na tela: ali a remessa já saiu, e trocar a conta não muda mais nada. */}
        {props.generated === null ? (
          <div className={accountBar}>
            <span className={launchLabel}>{t('financial.remittance.generate.account')}</span>
            <select
              className={accountSelect}
              value={props.cedenteAccountId}
              disabled={props.generating || props.confirming}
              aria-label={t('financial.remittance.generate.account')}
              onChange={(e) => {
                props.onCedenteAccount(e.target.value)
              }}
            >
              <option value="">{t('financial.remittance.generate.accountPlaceholder')}</option>
              {props.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {/* Espera, não erro: sem conta não há o que conferir. Dizer isso é melhor que uma tabela vazia
            (que pareceria "nada a enviar") ou um "carregando" que nunca termina. */}
        {props.awaitingAccount ? (
          <p className={emptyState}>{t('financial.remittance.preview.needAccount')}</p>
        ) : null}

        {/* PIX desmarcado por não ser remessa exclusiva (core-api#948 CA4). O aviso vai no TOPO porque
            o título caiu por causa de OUTRA linha: só a pendência na linha faria o PIX sumir do total
            sem nada explicando por quê, numa lista que pode ser longa. */}
        {view !== null && view.summary.pixNotExclusiveCount > 0 ? (
          <p className={notice}>
            {t('financial.remittance.preview.pixNotExclusiveNotice').replace(
              '{n}',
              String(view.summary.pixNotExclusiveCount),
            )}
          </p>
        ) : null}

        {/* Retenções marcadas: o pré-voo não as acusa (herdam forma e favorecido da nota), então o
            aviso no topo é o que garante que o operador saiba ANTES de gerar. */}
        {view !== null && view.summary.retentionCheckedCount > 0 ? (
          <p className={notice}>
            {t('financial.remittance.preview.retentionNotice').replace(
              '{n}',
              String(view.summary.retentionCheckedCount),
            )}
          </p>
        ) : null}

        {props.generated !== null ? (
          <div className={receipt}>
            <h3 className={receiptTitle}>{t('financial.remittance.generate.doneTitle')}</h3>
            <p className={confirmText}>{t('financial.remittance.generate.doneBody')}</p>
            <div className={receiptGrid}>
              {/* UM bloco por arquivo do lote (core-api#929): boleto e transferência não cabem no mesmo
                  lote, e uma seleção mista enfileira mais de um. Exibir só o primeiro descreveria
                  METADE do que foi ao banco, com o operador confirmando sem saber. */}
              {props.generated.files.map((f) => (
                <Fragment key={f.remittanceId}>
                  <span className={summaryItem}>
                    <span className={summaryLabel}>{t('financial.remittance.generate.nsa')}</span>
                    <span className={summaryValueStrong}>{f.nsa}</span>
                  </span>
                  <span className={summaryItem}>
                    <span className={summaryLabel}>{t('financial.remittance.generate.fileName')}</span>
                    <span className={summaryValue}>{f.fileName}</span>
                  </span>
                </Fragment>
              ))}
              {/* A QUANTIDADE saiu daqui (decisão da P.O., 24/08): o operador acabou de lê-la na
                  conferência, com os títulos nominados, e repeti-la no comprovante não acrescenta —
                  ocupa a linha que os dados exclusivos do comprovante (NSA, arquivo, data) precisam.
                  Antes de sair ela ainda estava ERRADA: exibia o `lineCount` do core-api, que conta
                  registros do arquivo CNAB (6 para um único título). */}
              {/* Quando o banco executa. Fecha a pergunta que o comprovante deixava em aberto: o operador
                  via quanto e quantos títulos, mas não em que dia o dinheiro sai. */}
              <span className={summaryItem}>
                <span className={summaryLabel}>{t('financial.remittance.generate.paymentDate')}</span>
                <span className={summaryValueStrong}>{props.generated.paymentDate}</span>
              </span>
              {/* Total POR ARQUIVO, e não somado: o que o banco processa é cada arquivo, e é por
                  arquivo que o operador vai conferir o extrato. Uma soma esconderia a repartição. */}
              {props.generated.files.map((f) => (
                <span className={summaryItem} key={`total-${f.remittanceId}`}>
                  <span className={summaryLabel}>{t('financial.remittance.generate.total')}</span>
                  <span className={summaryValueStrong}>{f.total}</span>
                </span>
              ))}
            </div>

            {/* Baixar o arquivo QUE FOI ao banco — para conferir layout. Nunca uma regeração: outro NSA e
                outro carimbo de tempo não servem de evidência.

                Oferecido em TODO ambiente (decisão da P.O., 21/08). ⚠️ Enquanto o core-api registrar a
                rota só fora de produção, lá o clique volta 404 e a mensagem abaixo explica — a tela NÃO
                esconde o botão por conta própria. */}
            <div className={receiptActions}>
              {props.generated.files.map((f) => (
                <button
                  key={`dl-${f.remittanceId}`}
                  type="button"
                  className={downloadBtn}
                  onClick={() => {
                    props.onDownload(f.remittanceId)
                  }}
                  disabled={props.downloading}
                >
                  {props.downloading
                    ? t('financial.remittance.download.running')
                    : `${t('financial.remittance.download.action')}${props.generated !== null && props.generated.files.length > 1 ? ` — NSA ${f.nsa}` : ''}`}
                </button>
              ))}
              <span className={summaryLabel}>{t('financial.remittance.download.hint')}</span>
            </div>

            {/* `falhas/` — o arquivo veio, mas o envio NÃO completou. Precisa ser dito ANTES de alguém
                comparar esses bytes com o que o banco recebeu. */}
            {props.downloadedFromFailures ? (
              <p className={downloadWarn}>{t('financial.remittance.download.fromFailures')}</p>
            ) : null}

            {props.downloadErrorTag !== null ? (
              // A MENSAGEM do core-api quando existe (distingue "não está no bucket" de "hash divergente").
              // Sem ela — o caso de produção, onde a rota nem é registrada — o recado é o de homologação.
              <p className={downloadError}>
                {props.downloadErrorMessage ?? t('financial.remittance.download.unavailable')}
              </p>
            ) : null}
          </div>
        ) : props.running ? (
          <p className={emptyState}>{t('common.loading')}</p>
        ) : view === null ? null : (
          <>
            <div className={summary}>
              <span className={summaryItem}>
                <span className={summaryLabel}>{t('financial.remittance.preview.summary.count')}</span>
                {/* marcados de exibidos: o totalizador acompanha o que o operador desmarcou */}
                <span className={summaryValue}>
                  {`${String(view.summary.checkedCount)} / ${String(view.summary.titleCount)}`}
                </span>
              </span>
              <span className={summaryItem}>
                <span className={summaryLabel}>{t('financial.remittance.preview.summary.gross')}</span>
                <span className={summaryValue}>{view.summary.grossTotal}</span>
              </span>
              <span className={summaryItem}>
                <span className={summaryLabel}>{t('financial.remittance.preview.summary.net')}</span>
                <span className={summaryValue}>{view.summary.netTotal}</span>
              </span>
              <span className={summaryItem}>
                <span className={summaryLabel}>{t('financial.remittance.preview.summary.paymentDate')}</span>
                {/* Âmbar também quando a data já passou: o operador precisa ver o problema no RESUMO,
                    onde ele lê a data, e não só no banner do rodapé. */}
                <span
                  className={
                    view.summary.paymentDateMixed || view.summary.paymentDateInPast
                      ? summaryValueWarn
                      : summaryValue
                  }
                >
                  {view.summary.paymentDateMixed
                    ? t('financial.remittance.preview.summary.mixedDates')
                    : view.summary.paymentDate}
                </span>
              </span>
              <span className={summaryItem}>
                <span className={summaryLabel}>{t('financial.remittance.preview.summary.total')}</span>
                <span className={summaryValueStrong}>{view.summary.remittanceTotal}</span>
              </span>
            </div>

            {view.summary.pendingCount > 0 ? (
              <p className={notice}>
                {`${String(view.summary.pendingCount)} ${t('financial.remittance.preview.pendingWarn')}`}
              </p>
            ) : null}

            {/* O core-api#804 devolve a composição em lotes do arquivo. NÃO a exibimos: avaliada em tela,
                não acrescenta à conferência — quem confere olha título a título, e como o arquivo se
                reparte é assunto do emissor. */}

            {view.lines.length === 0 ? (
              <p className={emptyState}>{t('financial.remittance.preview.empty')}</p>
            ) : (
              <div className={gridBox}>
                <div className={head} role="row">
                  <span className={headCell} aria-hidden="true" />
                  <span className={headCell}>{t('financial.remittance.preview.col.method')}</span>
                  <span className={headCell}>{t('financial.remittance.preview.col.document')}</span>
                  <span className={headCell}>{t('financial.remittance.preview.col.supplier')}</span>
                  <span className={headCell}>{t('financial.remittance.preview.col.due')}</span>
                  <span className={headCellRight}>{t('financial.remittance.preview.col.net')}</span>
                </div>
                {view.lines.map((l) => (
                  <div
                    key={l.payableId}
                    role="row"
                    className={l.remittable ? row : rowPending}
                    title={pendencyHint(l)}
                  >
                    <input
                      type="checkbox"
                      className={l.remittable ? checkbox : checkboxDisabled}
                      checked={l.checked}
                      disabled={!l.remittable}
                      aria-label={`${t('financial.remittance.preview.includeLabel')} ${l.documentNumber}`}
                      onChange={() => {
                        props.onToggle(l.payableId)
                      }}
                    />
                    <span className={cell}>{l.paymentMethodTag === null ? DASH : t(l.paymentMethodTag)}</span>
                    <span className={cellDocStack}>
                      <span className={cellDoc}>{l.documentNumber}</span>
                      {/* ⚠️ Selo de retenção. O imposto herda a forma e o favorecido da NOTA, então
                          passa pela régua como apto e sairia por TED para o FORNECEDOR em vez de
                          guia ao órgão arrecadador. Não bloqueamos — a modelagem da retenção será
                          revista com a reforma tributária —, mas sem este selo o operador não tem
                          como distinguir a linha do imposto para desmarcá-la. */}
                      {l.isRetention ? (
                        <span className={retentionBadge}>{t('financial.remittance.preview.retention')}</span>
                      ) : null}
                      {l.pendencyTag !== null ? (
                        <span className={pendencyLabel}>{t(l.pendencyTag)}</span>
                      ) : null}
                    </span>
                    <span className={cell}>{l.supplier}</span>
                    <span className={cell}>{l.due}</span>
                    <span className={cellNet}>{l.net}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {props.generated === null && view !== null && !props.running ? (
          <div className={launchBar}>
            {props.generateErrorTag !== null ? (
              // A MENSAGEM do core-api quando existe (é ela que distingue as recusas); a tag como reserva.
              <p className={launchError}>{props.generateErrorMessage ?? t(props.generateErrorTag)}</p>
            ) : null}

            {/* Vencimentos diferentes BLOQUEIA a geração (a remessa é de um único dia): banner claro de
                largura total, não só o valor âmbar no resumo — deixa explícito por que o "Gerar" está travado. */}
            {view.summary.paymentDateMixed ? (
              <p className={launchAlert}>{t('financial.remittance.generate.needSameDate')}</p>
            ) : null}

            {/* Pagamento no passado BLOQUEIA, mas SEM banner — e a diferença para os vencimentos
                misturados é deliberada: aquele se resolve DENTRO do modal (desmarcando os divergentes),
                então o banner ensina uma ação daqui. Este só se resolve fora — fechar, corrigir o
                vencimento, voltar. Um banner mandando o operador sair vale menos que o campo destacado
                no resumo, e o resumo é onde ele lê a data. Ver `summaryValueWarn` acima. */}

            {props.confirming ? (
              <p className={launchWarn}>
                {t('financial.remittance.generate.confirm')
                  .replace('{total}', view.summary.remittanceTotal)
                  .replace('{n}', String(view.summary.checkedCount))
                  // A DATA DE PAGAMENTO é o que o banco vai executar (Segmento A, 094-101) e é o
                  // único dado do arquivo que o operador não confere em outro lugar: o total ele vê
                  // no resumo, os títulos ele acabou de marcar. Sem ela, confirma-se um pagamento
                  // sem saber o dia.
                  .replace('{data}', view.summary.paymentDate)}
              </p>
            ) : null}

            {/* O seletor de conta NÃO se repete aqui: ele subiu para o topo, porque a conferência que
                está acima é resposta a ele. Duas cópias do mesmo controle na mesma tela é convite a
                trocar a conta depois de ler o pré-voo — e gerar um arquivo que não é o conferido. */}
            {props.confirming ? (
              <>
                <button
                  type="button"
                  className={confirmCancelBtn}
                  disabled={props.generating}
                  onClick={props.onDisarm}
                >
                  {t('financial.remittance.generate.cancel')}
                </button>
                <button
                  type="button"
                  className={confirmLaunchBtn}
                  disabled={props.generating}
                  onClick={props.onGenerate}
                >
                  {props.generating ? t('common.loading') : t('financial.remittance.generate.confirmAction')}
                </button>
              </>
            ) : (
              <button
                type="button"
                className={launchBtn}
                disabled={
                  props.generating ||
                  view.summary.checkedCount === 0 ||
                  props.cedenteAccountId === '' ||
                  view.summary.paymentDateMixed ||
                  view.summary.paymentDateInPast
                }
                title={
                  view.summary.checkedCount === 0
                    ? t('financial.remittance.generate.needChecked')
                    : props.cedenteAccountId === ''
                      ? t('financial.remittance.generate.needAccount')
                      : view.summary.paymentDateMixed
                        ? t('financial.remittance.generate.needSameDate')
                        : view.summary.paymentDateInPast
                          ? t('financial.remittance.generate.needFutureDate')
                          : undefined
                }
                onClick={props.onArm}
              >
                {t('financial.remittance.generate.action')}
              </button>
            )}
          </div>
        ) : null}

        <div className={confirmActions}>
          <button type="button" className={confirmCancelBtn} onClick={props.onClose}>
            {t('financial.remittance.preview.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
