/**
 * Sidebar de Composição + Líquido + Títulos Previstos — view BURRA (§XI). Deriva tudo das funções PURAS
 * de `document-form.view` + `money` (preview client; o backend confirma no create). Valores em fonte mono.
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import {
  netPreviewCents,
  retentionsEnabledFor,
  titulosPrevistos,
  formatCents,
  formatReaisBRL,
  formatDue,
  RETENTION_KEYS,
  type DocumentFormFields,
} from '../document-form.view.ts'
import {
  card,
  cardTitle,
  compRow,
  compSep,
  compVal,
  netBlock,
  netDue,
  netLabel,
  netValue,
  tituloChild,
  tituloParent,
  tituloVal,
} from '../page/lancar-documento.css.ts'

const t = createTranslator(ptBR)

export type ComposicaoSidebarProps = Readonly<{
  fields: DocumentFormFields
  supplierName: string
}>

export function ComposicaoSidebar(props: ComposicaoSidebarProps): ReactNode {
  const { fields } = props
  const retEnabled = retentionsEnabledFor(fields.type)
  const titulos = titulosPrevistos(fields)

  return (
    <>
      <div className={card}>
        <h4 className={cardTitle}>{t('financial.create.sidebar.composicao')}</h4>
        <div className={compRow}>
          <span>{t('financial.create.field.grossValue')}</span>
          <span className={compVal}>{formatReaisBRL(fields.grossValue)}</span>
        </div>
        {retEnabled ? (
          <>
            <div className={compSep} />
            {RETENTION_KEYS.map((key) => (
              <div className={compRow} key={key}>
                <span>{t(`financial.create.retention.${key}`)}</span>
                <span className={compVal}>− {formatReaisBRL(fields.retentions[key])}</span>
              </div>
            ))}
          </>
        ) : null}
        <div className={compSep} />
        <div className={netBlock}>
          <span className={netLabel}>{t('financial.create.sidebar.liquido')}</span>
          <span className={netValue}>{formatCents(netPreviewCents(fields))}</span>
          {fields.dueDate !== '' ? (
            <span className={netDue}>{t('financial.create.sidebar.vence')} {formatDue(fields.dueDate)}</span>
          ) : null}
        </div>
      </div>

      <div className={card}>
        <h4 className={cardTitle}>{t('financial.create.sidebar.titulos')}</h4>
        {titulos.map((tit, i) =>
          tit.kind === 'Pai' ? (
            <div className={tituloParent} key="pai">
              <span>{fields.type === '' ? t('financial.create.sidebar.tituloPai') : fields.type}</span>
              {props.supplierName !== '' ? <span>· {props.supplierName}</span> : null}
              <span className={tituloVal}>{formatCents(tit.valueCents)}</span>
            </div>
          ) : (
            <div className={tituloChild} key={`${tit.kind}-${String(i)}`}>
              <span>{tit.kind}</span>
              <span className={tituloVal}>{formatCents(tit.valueCents)}</span>
            </div>
          ),
        )}
      </div>
    </>
  )
}
