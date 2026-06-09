/**
 * PrintableDocument — documento padronizado imprimível (Termo de Quitação / Histórico de Pagamento).
 * Componente BURRO: recebe dados JÁ formatados (strings) e só compõe o layout. Aparece apenas na
 * impressão (CSS `@media print`); o disparo é via `window.print()` (→ "Salvar como PDF"), mesmo
 * mecanismo do Exportar→PDF da lista. Sem dependência de lib de PDF.
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

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
  tdEmpty,
  signatures,
  signatureBox,
} from './printable-document.css.ts'

const t = createTranslator(ptBR)

export type PrintableDocKind = 'quitacao' | 'historico'

export interface PrintableDocData {
  readonly number: string
  readonly contractor: string
  readonly document: string
  readonly object: string
  readonly type: string
  readonly value: string
  readonly period: string
  readonly status: string
}

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
        <span className={emitted}>{t('contracts.doc.emittedAt')} {emittedAt}</span>
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
          <table className={table}>
            <thead>
              <tr>
                <th className={th}>{t('contracts.doc.historico.col.date')}</th>
                <th className={th}>{t('contracts.doc.historico.col.description')}</th>
                <th className={th}>{t('contracts.doc.historico.col.value')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={tdEmpty} colSpan={3}>{t('contracts.doc.historico.empty')}</td>
              </tr>
            </tbody>
          </table>
          <div className={signatures}>
            <div className={signatureBox}>{t('contracts.doc.placeDateLine')}</div>
            <div className={signatureBox}>{t('contracts.doc.signatureLine')}</div>
          </div>
        </>
      )}
    </div>
  )
}
