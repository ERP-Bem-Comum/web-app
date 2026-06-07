import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Badge } from '#shared/ui/index.ts'

import {
  OCCUPATION_AREAS,
  type ActDetail,
  type OccupationArea,
} from '../act-detail.view-model.ts'
import { card, cardTitle, field, fieldGrid, fieldLabel, fieldValue, layout } from './act-detail-content.css.ts'

const t = createTranslator(ptBR)

const isOccupationArea = (v: string): v is OccupationArea =>
  (OCCUPATION_AREAS as readonly string[]).includes(v)

function areaLabel(area: string): string {
  return isOccupationArea(area) ? t(`partners.acts.area.${area}`) : area
}

function Item({ label, value }: Readonly<{ label: string; value: string }>): ReactNode {
  return (
    <div className={field}>
      <span className={fieldLabel}>{label}</span>
      <span className={fieldValue}>{value}</span>
    </div>
  )
}

export type ActDetailContentProps = Readonly<{ act: ActDetail }>

export function ActDetailContent(props: ActDetailContentProps): ReactNode {
  const a = props.act
  return (
    <div className={layout}>
      <section className={card}>
        <h2 className={cardTitle}>{t('partners.acts.form.section.basic')}</h2>
        <div>
          <Badge variant={a.activation === 'active' ? 'active' : 'outro'}>
            {t(`partners.acts.status.${a.activation}`)}
          </Badge>{' '}
          <Badge variant={a.registration === 'complete' ? 'active' : 'outro'}>
            {t(`partners.acts.registration.${a.registration}`)}
          </Badge>
        </div>
        <div className={fieldGrid}>
          <Item label={t('partners.acts.form.name')} value={a.name} />
          <Item label={t('partners.acts.form.email')} value={a.email} />
          <Item label={t('partners.acts.form.cpf')} value={a.cpf} />
          <Item label={t('partners.acts.form.occupationArea')} value={areaLabel(a.occupationArea)} />
          <Item label={t('partners.acts.form.role')} value={a.role} />
          <Item label={t('partners.acts.form.startOfContract')} value={a.startOfContract} />
          <Item label={t('partners.acts.form.employmentRelationship')} value={t(`partners.acts.employment.${a.employmentRelationship}`)} />
        </div>
      </section>
    </div>
  )
}
