/**
 * Drawer de Detalhe do Documento (onda 2, Figma 213-576) — view BURRA (§XI). Painel lateral fiel ao
 * Figma: seções com rótulo + régua, identificação, Composição Financeira, **Títulos Gerados** e Forma de
 * Pagamento. ⚠️ Sem regra de PARCELAMENTO no domínio — os "Títulos" são o PAI + os FILHOS (retenções).
 *
 * A Categorização (Centro de Custo / Categoria / Subcategoria / Programa) já é resolvida CLIENT-SIDE das
 * refs do GET /:id (#95/#147). Seções ainda sem dado — arquivo PDF (#256) e Plano Orçamentário
 * (budget-plans, core-api#113) — seguem placeholder. Fecha no ✕, no botão ou clicando fora.
 */
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import type { PixKeyType } from '#modules/partners/public-api/index.ts'

import type { DocumentDetailView, RetentionType } from '../contas-a-pagar.view-model.ts'
import { paymentComplementLabelTag } from '../contas-a-pagar.view-model.ts'
import type { PayeeBankView } from '../payee-bank.binding.ts'
import type { DocumentTimelineState } from '../document-timeline.binding.ts'
import { DocumentTimeline } from './document-timeline.component.tsx'
import {
  statusVariant,
  dwStatusPill,
  detailValueMono,
  paymentCard,
  paymentMethodName,
  dwFileCard,
  dwFileCardAttached,
  dwFileIcon,
  dwFileIconAttached,
  dwFileInfo,
  dwFileName,
  dwFileNameAttached,
  dwFileMeta,
  dwFileMetaAttached,
  drawerOverlay,
  drawerPanel,
  drawerHeader,
  drawerOverline,
  drawerTitle,
  drawerClose,
  dwTabs,
  dwTab,
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
  compRowRetentions,
  compValRetentions,
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

// Rótulo do tipo de chave PIX (reusa o catálogo do módulo Partners — mesmos literais nos 4 tipos).
const pixTypeLabel = (type: PixKeyType): string => t(`partners.suppliers.pix.${type}`)

// #568: glyph do ícone do card = extensão do arquivo em maiúsculas (ex.: "PDF", "XML"), teto de 4 chars;
// sem extensão reconhecível cai no genérico "DOC".
const fileBadge = (fileName: string): string => {
  const dot = fileName.lastIndexOf('.')
  const ext = dot >= 0 ? fileName.slice(dot + 1).toUpperCase() : ''
  return ext !== '' && ext.length <= 4 ? ext : 'DOC'
}

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

/**
 * #273: complemento da forma de pagamento (espelha o create). Boleto/Cartão/Câmbio/Outro têm complemento
 * tipado (`paymentDetail` + rótulo do create) → mostra o valor real no lugar das linhas bancárias.
 * Demais formas (PIX/TED/Transferência/Guia) mostram os dados bancários do favorecido resolvidos
 * CLIENT-SIDE (`payeeBank`, sem core-api#95); cada linha cai p/ "—" só quando o favorecido não a tem.
 */
function PaymentComplement({
  detail,
  method,
  payeeBank,
}: Readonly<{
  detail: string | null
  method: DocumentDetailView['paymentMethod']
  payeeBank: PayeeBankView | null
}>): ReactNode {
  const tag = paymentComplementLabelTag(method)
  // A forma decide o formato (não a presença do dado): Boleto/Cartão/Câmbio/Outro SEMPRE mostram o
  // complemento tipado (código de barras etc.) — vazio vira "—", NUNCA cai nos dados bancários. Só as
  // formas bancárias (PIX/TED/Transferência/Guia) exibem agência/conta/chave do favorecido.
  if (tag !== null) {
    return <Field label={t(tag)} value={detail ?? '—'} mono />
  }
  return (
    <>
      <Field
        label={t('financial.detail.label.tipoChave')}
        value={payeeBank?.pixType != null ? pixTypeLabel(payeeBank.pixType) : '—'}
      />
      <Field label={t('financial.detail.label.chave')} value={payeeBank?.pixKey ?? '—'} mono />
      <Field label={t('financial.detail.label.banco')} value={payeeBank?.bankLine ?? '—'} />
    </>
  )
}

export type DrawerTab = 'detalhes' | 'historico'

export type DocumentDetailDrawerProps = Readonly<{
  view: DocumentDetailView
  payeeBank: PayeeBankView | null
  activeTab: DrawerTab
  onTab: (tab: DrawerTab) => void
  timeline: DocumentTimelineState
  onClose: () => void
}>

export function DocumentDetailDrawer({
  view,
  payeeBank,
  activeTab,
  onTab,
  timeline,
  onClose,
}: DocumentDetailDrawerProps): ReactNode {
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

        <div className={dwTabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'detalhes'}
            className={activeTab === 'detalhes' ? dwTab.active : dwTab.inactive}
            onClick={() => {
              onTab('detalhes')
            }}
          >
            {t('financial.detail.tab.detalhes')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'historico'}
            className={activeTab === 'historico' ? dwTab.active : dwTab.inactive}
            onClick={() => {
              onTab('historico')
            }}
          >
            {t('financial.detail.tab.historico')}
          </button>
        </div>

        {activeTab === 'historico' ? (
          <div className={drawerBody}>
            <DocumentTimeline
              state={timeline}
              documentType={view.type}
              payables={view.payables.map((p) => ({
                id: p.id,
                isParent: p.isParent,
                retentionType: p.retentionType,
                isReconciled: p.status === 'Conciliado',
              }))}
            />
          </div>
        ) : (
          <div className={drawerBody}>
            {/* Documento */}
            <section className={dwSection}>
              <SectionLabel label={t('financial.detail.label.documento')} />
              {/* FileCard — comprovante-fonte (OCR, #568): com anexo mostra o nome do arquivo; sem anexo,
                  o estado honesto "nenhum arquivo anexado". */}
              <div className={`${dwFileCard} ${view.attachment !== null ? dwFileCardAttached : ''}`}>
                <span
                  className={`${dwFileIcon} ${view.attachment !== null ? dwFileIconAttached : ''}`}
                  aria-hidden="true"
                >
                  {view.attachment !== null ? fileBadge(view.attachment.fileName) : 'PDF'}
                </span>
                <span className={dwFileInfo}>
                  <span className={`${dwFileName} ${view.attachment !== null ? dwFileNameAttached : ''}`}>
                    {view.attachment !== null ? view.attachment.fileName : t('financial.detail.file.empty')}
                  </span>
                  <span className={`${dwFileMeta} ${view.attachment !== null ? dwFileMetaAttached : ''}`}>
                    {view.attachment !== null
                      ? t('financial.detail.file.attached')
                      : t('financial.detail.file.soon')}
                  </span>
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
              {/* Retenções somadas numa linha única, destacada em vermelho (mock). Lista os tipos no rótulo. */}
              {view.retentionsTotal !== null ? (
                <div className={compRowRetentions}>
                  <span>
                    − {t('financial.detail.label.retencoes')} ({view.retentions.map((r) => r.type).join(', ')}
                    )
                  </span>
                  <span className={compValRetentions}>({view.retentionsTotal})</span>
                </div>
              ) : null}
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
                      <span className={tituloOverline}>
                        {p.isParent ? view.type : (p.retentionType ?? '')}
                      </span>
                      <span className={tituloNome}>
                        {p.isParent
                          ? view.supplier
                          : p.retentionType !== null
                            ? destino(p.retentionType)
                            : ''}
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

            {/* Plano Orçamentário — categorização resolvida CLIENT-SIDE das refs do GET /:id (#95/#147). Cada
              linha cai p/ "—" quando a ref é null OU não resolve. Plano segue "—" (budget-plans, core-api#113). */}
            <section className={dwSection}>
              <SectionLabel label={t('financial.detail.section.plano')} />
              <div className={paymentCard}>
                <div className={detailGrid}>
                  <Field
                    label={t('financial.detail.label.centroCusto')}
                    value={view.categorization.costCenter}
                  />
                  <Field label={t('financial.detail.label.categoria')} value={view.categorization.category} />
                  <Field
                    label={t('financial.detail.label.subcategoria')}
                    value={view.categorization.subcategory}
                  />
                  <Field label={t('financial.detail.label.programa')} value={view.categorization.program} />
                </div>
                <Field
                  label={t('financial.detail.label.planoOrcamentario')}
                  value={view.categorization.budgetPlan}
                />
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
                    <PaymentComplement
                      detail={view.paymentDetail}
                      method={view.paymentMethod}
                      payeeBank={payeeBank}
                    />
                    {/* Favorecido já é conhecido (favorecido do documento); banco/chave seguem gated (#95). */}
                    <Field label={t('financial.detail.label.favorecido')} value={view.supplier} />
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        )}

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
