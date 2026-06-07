import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Badge } from '#shared/ui/index.ts'

import type { SupplierDetail } from '../supplier-detail.view-model.ts'
import {
  card,
  cardTitle,
  field,
  fieldGrid,
  fieldLabel,
  fieldValue,
  layout,
} from './supplier-detail-content.css.ts'

const t = createTranslator(ptBR)

function Item({ label, value }: Readonly<{ label: string; value: string }>): ReactNode {
  return (
    <div className={field}>
      <span className={fieldLabel}>{label}</span>
      <span className={fieldValue}>{value}</span>
    </div>
  )
}

export type SupplierDetailContentProps = Readonly<{
  supplier: SupplierDetail
  canViewSensitive: boolean
}>

export function SupplierDetailContent(props: SupplierDetailContentProps): ReactNode {
  const s = props.supplier
  return (
    <div className={layout}>
      <section className={card}>
        <h2 className={cardTitle}>{t('partners.suppliers.form.section.basic')}</h2>
        <Badge variant={s.activation === 'active' ? 'active' : 'outro'}>
          {t(`partners.suppliers.status.${s.activation}`)}
        </Badge>
        <div className={fieldGrid}>
          <Item label={t('partners.suppliers.form.name')} value={s.name} />
          <Item label={t('partners.suppliers.form.corporateName')} value={s.corporateName} />
          <Item label={t('partners.suppliers.form.fantasyName')} value={s.fantasyName} />
          <Item label={t('partners.suppliers.form.email')} value={s.email} />
          <Item label={t('partners.suppliers.form.cnpj')} value={s.cnpj} />
          <Item label={t('partners.suppliers.form.category')} value={s.serviceCategory} />
        </div>
      </section>

      {props.canViewSensitive ? (
        <aside className={card}>
          {s.bankAccount !== null ? (
            <>
              <h2 className={cardTitle}>{t('partners.suppliers.form.section.banking')}</h2>
              <div className={fieldGrid}>
                <Item label={t('partners.suppliers.form.bank')} value={s.bankAccount.bank} />
                <Item label={t('partners.suppliers.form.agency')} value={s.bankAccount.agency} />
                <Item label={t('partners.suppliers.form.accountNumber')} value={s.bankAccount.accountNumber} />
                <Item label={t('partners.suppliers.form.checkDigit')} value={s.bankAccount.checkDigit} />
              </div>
            </>
          ) : null}
          {s.pixKey !== null ? (
            <>
              <h2 className={cardTitle}>{t('partners.suppliers.form.section.pix')}</h2>
              <div className={fieldGrid}>
                <Item label={t('partners.suppliers.form.pixType')} value={t(`partners.suppliers.pix.${s.pixKey.keyType}`)} />
                <Item label={t('partners.suppliers.form.pixKey')} value={s.pixKey.key} />
              </div>
            </>
          ) : null}
        </aside>
      ) : null}
    </div>
  )
}
