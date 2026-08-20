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
  receipt,
  receiptTitle,
  receiptGrid,
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

        {props.generated !== null ? (
          <div className={receipt}>
            <h3 className={receiptTitle}>{t('financial.remittance.generate.doneTitle')}</h3>
            <p className={confirmText}>{t('financial.remittance.generate.doneBody')}</p>
            <div className={receiptGrid}>
              <span className={summaryItem}>
                <span className={summaryLabel}>{t('financial.remittance.generate.nsa')}</span>
                <span className={summaryValueStrong}>{props.generated.nsa}</span>
              </span>
              <span className={summaryItem}>
                <span className={summaryLabel}>{t('financial.remittance.generate.fileName')}</span>
                <span className={summaryValue}>{props.generated.fileName}</span>
              </span>
              <span className={summaryItem}>
                <span className={summaryLabel}>{t('financial.remittance.generate.lineCount')}</span>
                <span className={summaryValue}>{props.generated.lineCount}</span>
              </span>
              <span className={summaryItem}>
                <span className={summaryLabel}>{t('financial.remittance.generate.total')}</span>
                <span className={summaryValueStrong}>{props.generated.total}</span>
              </span>
            </div>
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
                <span className={view.summary.paymentDateMixed ? summaryValueWarn : summaryValue}>
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

            {props.confirming ? (
              <p className={launchWarn}>
                {`${t('financial.remittance.generate.confirmPrefix')} ${String(view.summary.checkedCount)} ${t('financial.remittance.generate.confirmMiddle')} ${view.summary.remittanceTotal}. ${t('financial.remittance.generate.confirmSuffix')}`}
              </p>
            ) : null}

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
                  view.summary.paymentDateMixed
                }
                title={
                  view.summary.checkedCount === 0
                    ? t('financial.remittance.generate.needChecked')
                    : props.cedenteAccountId === ''
                      ? t('financial.remittance.generate.needAccount')
                      : view.summary.paymentDateMixed
                        ? t('financial.remittance.generate.needSameDate')
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
