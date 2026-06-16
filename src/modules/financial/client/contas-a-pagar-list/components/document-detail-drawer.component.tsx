/**
 * Drawer de Detalhe do Documento (onda 2, Figma 213-576) — view BURRA (§XI). Painel lateral fiel ao
 * Figma: seções com rótulo + régua, identificação, Composição Financeira, **Títulos Gerados** e Forma de
 * Pagamento. ⚠️ Sem regra de PARCELAMENTO no domínio — os "Títulos" são o PAI + os FILHOS (retenções).
 *
 * Seções do Figma sem dado no DTO de detalhe (arquivo PDF, Emissão, Plano Orçamentário, dados bancários)
 * ficam fora por ora — dependem de enriquecer o GET /:id (futuro). Fecha no ✕, no botão ou clicando fora.
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import type { DocumentDetailView, RetentionType } from '../contas-a-pagar.view-model.ts'
import {
  statusBadge,
  statusVariant,
  drawerOverlay,
  drawerPanel,
  drawerHeader,
  drawerOverline,
  drawerTitle,
  drawerClose,
  drawerBody,
  dwSection,
  dwSectionLabel,
  dwSectionRule,
  dwSectionCount,
  detailGrid,
  detailField,
  detailLabel,
  detailValue,
  compRow,
  compVal,
  netRow,
  netLabel,
  netVal,
  tituloCard,
  tituloLeft,
  tituloOverline,
  tituloNome,
  tituloVenc,
  tituloRight,
  tituloValBold,
  statusPill,
  drawerFooter,
  drawerEditBtn,
  drawerCloseBtn,
} from '../page/contas-a-pagar.css.ts'

const t = createTranslator(ptBR)

const destino = (rt: RetentionType): string =>
  rt === 'ISS' ? t('financial.create.titulos.dest.iss') : t('financial.create.titulos.dest.federal')

function SectionLabel({ label, count }: Readonly<{ label: string; count?: number }>): ReactNode {
  return (
    <div className={dwSectionLabel}>
      <span className={drawerOverline}>{label}</span>
      {count !== undefined ? <span className={dwSectionCount}>({count})</span> : null}
      <span className={dwSectionRule} aria-hidden="true" />
    </div>
  )
}

function Field({ label, value }: Readonly<{ label: string; value: string }>): ReactNode {
  return (
    <span className={detailField}>
      <span className={detailLabel}>{label}</span>
      <span className={detailValue}>{value}</span>
    </span>
  )
}

export type DocumentDetailDrawerProps = Readonly<{ view: DocumentDetailView; onClose: () => void }>

export function DocumentDetailDrawer({ view, onClose }: DocumentDetailDrawerProps): ReactNode {
  return (
    <div className={drawerOverlay} role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className={drawerPanel}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <header className={drawerHeader}>
          <span>
            <span className={drawerOverline}>{t('financial.detail.title')}</span>
            <h2 className={drawerTitle}>
              {view.type} {view.documentNumber}
            </h2>
          </span>
          <button
            type="button"
            className={drawerClose}
            onClick={onClose}
            aria-label={t('financial.detail.close')}
          >
            ✕
          </button>
        </header>

        <div className={drawerBody}>
          {/* Identificação */}
          <section className={dwSection}>
            <SectionLabel label={t('financial.detail.label.documento')} />
            <div className={detailGrid}>
              <Field label={t('financial.detail.label.tipo')} value={view.type} />
              <Field label={t('financial.detail.label.numero')} value={view.documentNumber} />
              <Field label={t('financial.detail.label.vencimento')} value={view.due} />
              <Field label={t('financial.detail.label.fornecedor')} value={view.supplier} />
            </div>
            <span className={detailField}>
              <span className={detailLabel}>{t('financial.detail.label.status')}</span>
              <span>
                <span className={`${statusBadge} ${statusVariant[view.status]}`}>{view.status}</span>
              </span>
            </span>
          </section>

          {/* Composição Financeira */}
          <section className={dwSection}>
            <SectionLabel label={t('financial.detail.section.composicao')} />
            <div className={compRow}>
              <span>{t('financial.detail.label.bruto')}</span>
              <span className={compVal}>{view.gross}</span>
            </div>
            {view.retentions.map((r) => (
              <div className={compRow} key={r.type}>
                <span>− {r.type}</span>
                <span className={compVal}>{r.value}</span>
              </div>
            ))}
            <div className={netRow}>
              <span className={netLabel}>{t('financial.detail.label.liquido')}</span>
              <span className={netVal}>{view.net}</span>
            </div>
          </section>

          {/* Títulos Gerados (pai + filhos) */}
          {view.payables.length > 0 ? (
            <section className={dwSection}>
              <SectionLabel label={t('financial.detail.section.titulos')} count={view.payables.length} />
              {view.payables.map((p) => (
                <div className={tituloCard} key={p.id}>
                  <span className={tituloLeft}>
                    <span className={tituloOverline}>{p.isParent ? view.type : (p.retentionType ?? '')}</span>
                    <span className={tituloNome}>
                      {p.isParent ? view.supplier : p.retentionType !== null ? destino(p.retentionType) : ''}
                    </span>
                    <span className={tituloVenc}>{view.due}</span>
                  </span>
                  <span className={tituloRight}>
                    <span className={tituloValBold}>{p.value}</span>
                    <span className={statusPill}>{p.status}</span>
                  </span>
                </div>
              ))}
            </section>
          ) : null}

          {/* Forma de Pagamento (método; dados bancários dependem de enriquecer o detalhe) */}
          {view.paymentMethod !== null ? (
            <section className={dwSection}>
              <SectionLabel label={t('financial.detail.section.pagamento')} />
              <div className={compRow}>
                <span>{t(`financial.paymentMethod.${view.paymentMethod}`)}</span>
              </div>
            </section>
          ) : null}
        </div>

        <footer className={drawerFooter}>
          <button type="button" className={drawerEditBtn} disabled title={t('financial.detail.editSoon')}>
            {t('financial.detail.edit')}
          </button>
          <button type="button" className={drawerCloseBtn} onClick={onClose}>
            {t('financial.detail.close')}
          </button>
        </footer>
      </div>
    </div>
  )
}
