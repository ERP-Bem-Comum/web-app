/**
 * Sidebar (340) — Composição + Líquido + Títulos Previstos (árvore) + Validação. View BURRA (§XI):
 * deriva tudo das funções PURAS de `document-form.view` + `money` (preview client; o backend confirma no
 * create). Painéis FLAT (Figma 670:*), valores em fonte mono. Títulos = pai (líquido) → filhos por
 * retenção (ISS/IRRF/INSS/CSRF) com conector tracejado. Validação = checklist (chrome + 2 itens derivados).
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import {
  netPreviewCents,
  retentionsEnabledFor,
  retentionRatePct,
  titulosPrevistos,
  tituloDestino,
  validationChecklist,
  formatCents,
  formatReaisBRL,
  formatDue,
  RETENTION_KEYS,
  type DocumentFormFields,
} from '../document-form.view.ts'
import {
  panel,
  panelTitle,
  compRow,
  compRowStrong,
  compSep,
  compVal,
  netBlock,
  netDue,
  netLabel,
  netValue,
  titulosTree,
  paiRow,
  paiBadge,
  paiName,
  paiVal,
  childrenContainer,
  childRow,
  childKind,
  childDest,
  childVal,
  kindBadge,
  titulosEmpty,
  validations,
  validationItem,
  validationDot,
  validationText,
} from '../page/lancar-documento.css.ts'

const t = createTranslator(ptBR)

export type ComposicaoSidebarProps = Readonly<{
  fields: DocumentFormFields
  supplierName: string
}>

export function ComposicaoSidebar(props: ComposicaoSidebarProps): ReactNode {
  const { fields, supplierName } = props
  const retEnabled = retentionsEnabledFor(fields.type)
  const titulos = titulosPrevistos(fields)
  const pai = titulos[0]
  const filhos = titulos.slice(1)
  const isEmpty = (pai?.valueCents ?? '0') === '0' && filhos.length === 0
  const checklist = validationChecklist(fields, supplierName)
  const tipoLabel = fields.type === '' ? t('financial.create.sidebar.tituloPai') : fields.type

  return (
    <>
      {/* ── Composição ── */}
      <section className={panel}>
        <h4 className={panelTitle}>{t('financial.create.sidebar.composicao')}</h4>
        <div className={compRowStrong}>
          <span>{t('financial.create.field.grossValue')}</span>
          <span className={compVal}>{formatReaisBRL(fields.grossValue)}</span>
        </div>
        {retEnabled ? (
          <>
            <div className={compSep} />
            {RETENTION_KEYS.map((key) => {
              const pct = retentionRatePct(fields, key)
              const label = t(`financial.create.retention.${key}`)
              return (
                <div className={compRow} key={key}>
                  <span>{pct !== '' ? `${label} (${pct})` : label}</span>
                  <span className={compVal}>− {formatReaisBRL(fields.retentions[key])}</span>
                </div>
              )
            })}
          </>
        ) : null}
        <div className={compSep} />
        <div className={compRow}>
          <span>{t('financial.create.sidebar.descontos')}</span>
          <span className={compVal}>{formatCents('0')}</span>
        </div>
        <div className={compRow}>
          <span>{t('financial.create.sidebar.jurosMulta')}</span>
          <span className={compVal}>{formatCents('0')}</span>
        </div>
        <div className={netBlock}>
          <span className={netLabel}>{t('financial.create.sidebar.liquido')}</span>
          <span className={netValue}>{formatCents(netPreviewCents(fields))}</span>
          {fields.dueDate !== '' ? (
            <span className={netDue}>
              {t('financial.create.sidebar.vence')} {formatDue(fields.dueDate)}
            </span>
          ) : null}
        </div>
      </section>

      {/* ── Títulos Previstos (árvore) ── */}
      <section className={panel}>
        <h4 className={panelTitle}>{t('financial.create.sidebar.titulos')}</h4>
        {isEmpty ? (
          <p className={titulosEmpty}>{t('financial.create.sidebar.semTitulos')}</p>
        ) : (
          <div className={titulosTree}>
            <div className={paiRow}>
              <span className={paiBadge}>{tipoLabel}</span>
              <span className={paiName}>
                {supplierName !== '' ? supplierName : t('financial.create.hero.placeholder')}
              </span>
              <span className={paiVal}>{formatCents(pai?.valueCents ?? '0')}</span>
            </div>
            {filhos.length > 0 ? (
              <div className={childrenContainer}>
                {filhos.map((filho) => (
                  <div className={childRow} key={filho.kind}>
                    <span className={childKind}>
                      <span className={kindBadge.blue}>{filho.kind}</span>
                    </span>
                    <span className={childDest}>{t(tituloDestino(filho.kind))}</span>
                    <span className={childVal}>{formatCents(filho.valueCents)}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </section>

      {/* ── Validação (checklist — chrome + 2 itens derivados) ── */}
      <section className={panel}>
        <h4 className={panelTitle}>{t('financial.create.sidebar.validacao')}</h4>
        <div className={validations}>
          {checklist.map((item) => (
            <div className={validationItem[item.state]} key={item.key}>
              <span className={validationDot[item.state]} aria-hidden="true" />
              <span className={validationText}>{t(item.tag)}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
