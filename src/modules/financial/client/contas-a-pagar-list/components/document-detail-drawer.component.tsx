/**
 * Drawer de Detalhe do Documento (onda 2, Figma 213-576) — view BURRA (§XI). Painel lateral fiel ao
 * Figma: seções com rótulo + régua, identificação, Composição Financeira, **Títulos Gerados** e Forma de
 * Pagamento. ⚠️ Sem regra de PARCELAMENTO no domínio — os "Títulos" são o PAI + os FILHOS (retenções).
 *
 * Seções do Figma sem dado no DTO de detalhe (arquivo PDF, Emissão, Plano Orçamentário, dados bancários)
 * ficam fora por ora — dependem de enriquecer o GET /:id (core-api#95). Fecha no ✕, no botão ou clicando fora.
 */
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import type { DocumentDetailView, RetentionType } from '../contas-a-pagar.view-model.ts'
import {
  statusVariant,
  dwStatusPill,
  detailValueMono,
  paymentCard,
  paymentMethodName,
  dwFileCard,
  dwFileIcon,
  dwFileInfo,
  dwFileName,
  dwFileMeta,
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

function Field({
  label,
  value,
  mono = false,
}: Readonly<{ label: string; value: string; mono?: boolean }>): ReactNode {
  return (
    <span className={detailField}>
      <span className={detailLabel}>{label}</span>
      <span className={mono ? detailValueMono : detailValue}>{value}</span>
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
          {/* Documento */}
          <section className={dwSection}>
            <SectionLabel label={t('financial.detail.label.documento')} />
            {/* FileCard (PDF) — placeholder até o backend expor o arquivo do documento (core-api#95). */}
            <div className={dwFileCard}>
              <span className={dwFileIcon} aria-hidden="true">
                PDF
              </span>
              <span className={dwFileInfo}>
                <span className={dwFileName}>{t('financial.detail.file.empty')}</span>
                <span className={dwFileMeta}>{t('financial.detail.file.soon')}</span>
              </span>
            </div>
            <div className={detailGrid}>
              <Field label={t('financial.detail.label.tipo')} value={view.type} />
              <Field label={t('financial.detail.label.numero')} value={view.documentNumber} mono />
              <Field label={t('financial.detail.label.emissao')} value={view.emissao} mono />
              <Field label={t('financial.detail.label.vencimento')} value={view.due} mono />
            </div>
            <Field
              label={t('financial.detail.label.fornecedor')}
              value={view.supplierDoc !== null ? `${view.supplier} · ${view.supplierDoc}` : view.supplier}
            />
            <span className={detailField}>
              <span className={detailLabel}>{t('financial.detail.label.status')}</span>
              <span>
                <span className={`${dwStatusPill} ${statusVariant[view.status]}`}>{view.status}</span>
              </span>
            </span>
          </section>

          {/* Descrição — texto livre do cadastro (GET /:id já expõe `description`). Some quando vazia. */}
          {view.description !== '' ? (
            <section className={dwSection}>
              <SectionLabel label={t('financial.detail.label.descricao')} />
              <span className={detailField}>
                <span className={detailValue}>{view.description}</span>
              </span>
            </section>
          ) : null}

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
                    <span className={`${dwStatusPill} ${statusVariant[p.status]}`}>{p.status}</span>
                  </span>
                </div>
              ))}
            </section>
          ) : null}

          {/* Plano Orçamentário — categorização/contrato GATED (detalhe não expõe; placeholders, core-api#95). */}
          <section className={dwSection}>
            <SectionLabel label={t('financial.detail.section.plano')} />
            <div className={paymentCard}>
              <div className={detailGrid}>
                <Field label={t('financial.detail.label.centroCusto')} value="—" />
                <Field label={t('financial.detail.label.categoria')} value="—" />
                <Field label={t('financial.detail.label.subcategoria')} value="—" />
                <Field label={t('financial.detail.label.programa')} value="—" />
              </div>
              <Field label={t('financial.detail.label.planoOrcamentario')} value="—" />
            </div>
          </section>

          {/* Forma de Pagamento — método (real) + dados bancários GATED (placeholders, core-api#95). */}
          {view.paymentMethod !== null ? (
            <section className={dwSection}>
              <SectionLabel label={t('financial.detail.section.pagamento')} />
              <div className={paymentCard}>
                <span className={paymentMethodName}>
                  {t(`financial.paymentMethod.${view.paymentMethod}`)}
                </span>
                <div className={detailGrid}>
                  <Field label={t('financial.detail.label.tipoChave')} value="—" />
                  <Field label={t('financial.detail.label.chave')} value="—" mono />
                  <Field label={t('financial.detail.label.banco')} value="—" />
                  {/* Favorecido já é conhecido (favorecido do documento); banco/chave seguem gated (#95). */}
                  <Field label={t('financial.detail.label.favorecido')} value={view.supplier} />
                </div>
              </div>
            </section>
          ) : null}
        </div>

        <footer className={drawerFooter}>
          {/* "Editar pagamento" → abre o documento na tela de Lançar (edição se Aberto; consulta se não). */}
          <Link to="/financeiro/contas-a-pagar/lancar" search={{ id: view.id }} className={drawerEditBtn}>
            {t('financial.detail.edit')}
          </Link>
          <button type="button" className={drawerCloseBtn} onClick={onClose}>
            {t('financial.detail.close')}
          </button>
        </footer>
      </div>
    </div>
  )
}
