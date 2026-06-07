import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Badge } from '#shared/ui/index.ts'

import type { FinancierDetail } from '../financier-detail.view-model.ts'
import { card, cardTitle, field, fieldGrid, fieldLabel, fieldValue, layout } from './financier-detail-content.css.ts'

const t = createTranslator(ptBR)

function Item({ label, value }: Readonly<{ label: string; value: string }>): ReactNode {
  return (
    <div className={field}>
      <span className={fieldLabel}>{label}</span>
      <span className={fieldValue}>{value}</span>
    </div>
  )
}

export type FinancierDetailContentProps = Readonly<{
  financier: FinancierDetail
}>

export function FinancierDetailContent(props: FinancierDetailContentProps): ReactNode {
  const f = props.financier
  return (
    <div className={layout}>
      <section className={card}>
        <h2 className={cardTitle}>{t('partners.financiers.form.section.basic')}</h2>
        <Badge variant={f.activation === 'active' ? 'active' : 'outro'}>
          {t(`partners.financiers.status.${f.activation}`)}
        </Badge>
        <div className={fieldGrid}>
          <Item label={t('partners.financiers.form.name')} value={f.name} />
          <Item label={t('partners.financiers.form.corporateName')} value={f.corporateName} />
          <Item label={t('partners.financiers.form.legalRepresentative')} value={f.legalRepresentative} />
          <Item label={t('partners.financiers.form.cnpj')} value={f.cnpj} />
          <Item label={t('partners.financiers.form.telephone')} value={f.telephone} />
          <Item label={t('partners.financiers.form.address')} value={f.address} />
        </div>
      </section>
    </div>
  )
}
