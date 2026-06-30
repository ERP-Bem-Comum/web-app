/**
 * PrintableDocument — documento padronizado imprimível (Termo de Quitação / Histórico de Pagamento).
 * Componente BURRO: recebe dados JÁ formatados (strings) e só compõe o layout. Aparece apenas na
 * impressão (CSS `@media print`); o disparo é via `window.print()` (→ "Salvar como PDF"), mesmo
 * mecanismo do Exportar→PDF da lista. Sem dependência de lib de PDF.
 *
 * Histórico de Pagamento: pagamentos CONCILIADOS do contrato (execução contratual de fato), em ordem
 * cronológica (mais antigo no topo), numerados, com o saldo do contrato deduzido em cascata. Sem assinatura.
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import type { ContractDocData } from '../contract-list.view-model.ts'

import {
  doc,
  docHeader,
  org,
  emitted,
  title,
  infoGrid,
  infoLabel,
  infoValue,
  declaration,
  table,
  th,
  thNum,
  thRight,
  td,
  tdNum,
  tdRight,
  tdEmpty,
  openingLine,
  openingLabel,
  openingValue,
  signatures,
  signatureBox,
} from './printable-document.css.ts'

const t = createTranslator(ptBR)

export type PrintableDocKind = 'quitacao' | 'historico'

// Re-exporta o tipo de dados (montado no view-model) para os consumidores da view.
export type PrintableDocData = ContractDocData

export interface PrintableDocumentProps {
  readonly kind: PrintableDocKind
  readonly data: PrintableDocData
  readonly emittedAt: string
}

function InfoRow({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <>
      <span className={infoLabel}>{label}</span>
      <span className={infoValue}>{value}</span>
    </>
  )
}

export function PrintableDocument({ kind, data, emittedAt }: PrintableDocumentProps): ReactNode {
  return (
    <div className={doc}>
      <div className={docHeader}>
        <span className={org}>{t('contracts.doc.org')}</span>
        <span className={emitted}>
          {t('contracts.doc.emittedAt')} {emittedAt}
        </span>
      </div>

      <h1 className={title}>
        {kind === 'quitacao' ? t('contracts.doc.quitacao.title') : t('contracts.doc.historico.title')}
      </h1>

      <div className={infoGrid}>
        <InfoRow label={t('contracts.doc.field.number')} value={data.number} />
        <InfoRow label={t('contracts.doc.field.contractor')} value={data.contractor} />
        <InfoRow label={t('contracts.doc.field.document')} value={data.document} />
        <InfoRow label={t('contracts.doc.field.object')} value={data.object} />
        <InfoRow label={t('contracts.doc.field.type')} value={data.type} />
        <InfoRow label={t('contracts.doc.field.value')} value={data.value} />
        <InfoRow label={t('contracts.doc.field.period')} value={data.period} />
        <InfoRow label={t('contracts.doc.field.status')} value={data.status} />
      </div>

      {kind === 'quitacao' ? (
        <>
          <p className={declaration}>{t('contracts.doc.quitacao.declaration')}</p>
          <div className={signatures}>
            <div className={signatureBox}>{t('contracts.doc.placeDateLine')}</div>
            <div className={signatureBox}>{t('contracts.doc.signatureLine')}</div>
          </div>
        </>
      ) : (
        <>
          <div className={openingLine}>
            <span className={openingLabel}>{t('contracts.doc.historico.openingBalance')}</span>
            <span className={openingValue}>{data.openingBalance}</span>
          </div>
          <table className={table}>
            <thead>
              <tr>
                <th className={thNum}>{t('contracts.doc.historico.col.index')}</th>
                <th className={th}>{t('contracts.doc.historico.col.type')}</th>
                <th className={th}>{t('contracts.doc.historico.col.document')}</th>
                <th className={th}>{t('contracts.doc.historico.col.supplier')}</th>
                <th className={th}>{t('contracts.doc.historico.col.date')}</th>
                <th className={thRight}>{t('contracts.doc.historico.col.gross')}</th>
                <th className={thRight}>{t('contracts.doc.historico.col.balance')}</th>
              </tr>
            </thead>
            <tbody>
              {data.payments.length === 0 ? (
                <tr>
                  <td className={tdEmpty} colSpan={7}>
                    {t('contracts.doc.historico.empty')}
                  </td>
                </tr>
              ) : (
                data.payments.map((p) => (
                  <tr key={p.index}>
                    <td className={tdNum}>{p.index}</td>
                    <td className={td}>{p.type}</td>
                    <td className={td}>{p.document}</td>
                    <td className={td}>{p.supplier}</td>
                    <td className={td}>{p.date}</td>
                    <td className={tdRight}>{p.gross}</td>
                    <td className={tdRight}>{p.balance}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
