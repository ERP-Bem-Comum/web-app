import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Badge, Field, Input } from '#shared/ui/index.ts'
import { UsersIcon } from '#shared/ui/icons/index.ts'
import type { UserFormController } from '#modules/users/client/users-create/components/user-form.controller.ts'

import {
  stack,
  section,
  sectionTitle,
  statusRow,
  fieldGrid,
  readonlyRow,
  readonlyLabel,
} from './user-detail-content.css.ts'

const t = createTranslator(ptBR)

export type UserDetailContentProps = Readonly<{
  controller: UserFormController
  editing: boolean
  active: boolean
  massApproval: boolean
}>

export function UserDetailContent(props: UserDetailContentProps): ReactNode {
  const { controller: c, editing } = props
  const invalid = (key: string): string | undefined =>
    c.errors[key] === true ? t('users.form.invalid') : undefined

  const txt = (
    // Só os campos de TEXTO (massApprovalPermission é boolean e não usa este helper de Input).
    key: 'name' | 'cpf' | 'email' | 'telephone',
    label: string,
    type?: 'text' | 'email',
    mask?: 'cpf' | 'phone',
  ): ReactNode => (
    <Field htmlFor={`ud-${key}`} label={label} error={invalid(key)}>
      <Input
        id={`ud-${key}`}
        type={type}
        mask={mask}
        value={c.state[key]}
        disabled={!editing}
        onChange={(v) => {
          c.setField(key, v)
        }}
      />
    </Field>
  )

  return (
    <div className={stack}>
      <section className={section}>
        <h2 className={sectionTitle}>
          <UsersIcon size={18} />
          {t('users.form.section.data')}
        </h2>
        <div className={statusRow}>
          <Badge variant={props.active ? 'active' : 'terminated'} uppercase size="sm">
            {t(props.active ? 'users.status.active' : 'users.status.inactive')}
          </Badge>
        </div>
        <div className={fieldGrid}>
          {txt('name', t('users.form.name'))}
          {txt('cpf', t('users.form.cpf'), undefined, 'cpf')}
          {txt('email', t('users.form.email'), 'email')}
          {txt('telephone', t('users.form.telephone'), undefined, 'phone')}
        </div>

        {/* Aprovador em Massa — somente leitura (derivado dos perfis de acesso no backend). */}
        <div className={readonlyRow}>
          <span className={readonlyLabel}>{t('users.form.massApproval')}</span>
          <Badge variant={props.massApproval ? 'finished' : 'pending'} uppercase size="sm">
            {t(props.massApproval ? 'users.detail.yes' : 'users.detail.no')}
          </Badge>
        </div>
      </section>
    </div>
  )
}
