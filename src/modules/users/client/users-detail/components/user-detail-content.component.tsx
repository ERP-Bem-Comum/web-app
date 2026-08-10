import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { formatMask, unmask, type InputMask } from '#shared/ui/index.ts'
import { Badge } from '#shared/ui/index.ts'
import { UsersIcon } from '#shared/ui/icons/index.ts'
import type { UserFormController } from '#modules/users/client/users-create/components/user-form.controller.ts'
import {
  sectionCard,
  sectionHeader,
  sectionIcon,
  sectionH2,
  sectionBody,
  grid,
  field,
  fieldLabel,
  input,
} from '#shared/ui/brand/brand-form.css.ts'

import { statusRow, readonlyRow, readonlyLabel } from './user-detail-content.css.ts'

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

  // Campo de texto "brand" — só os campos de TEXTO (massApproval é boolean, tratado como badge read-only).
  const txt = (
    key: 'name' | 'cpf' | 'email' | 'telephone',
    label: string,
    opts?: { type?: 'text' | 'email'; mask?: InputMask },
  ): ReactNode => {
    const display = opts?.mask !== undefined ? formatMask(opts.mask, c.state[key]) : c.state[key]
    const err = invalid(key)
    return (
      <div className={field}>
        <label htmlFor={`ud-${key}`} className={fieldLabel}>
          {label}
        </label>
        <input
          id={`ud-${key}`}
          type={opts?.type ?? 'text'}
          className={input}
          value={display}
          disabled={!editing}
          inputMode={opts?.mask !== undefined ? 'numeric' : undefined}
          onChange={(e) => {
            c.setField(key, opts?.mask !== undefined ? unmask(e.target.value, opts.mask) : e.target.value)
          }}
        />
        {err !== undefined ? <span className={readonlyLabel}>{err}</span> : null}
      </div>
    )
  }

  return (
    <section className={sectionCard}>
      <div className={sectionHeader}>
        <span className={sectionIcon}>
          <UsersIcon size={17} />
        </span>
        <h2 className={sectionH2}>{t('users.form.section.data')}</h2>
      </div>
      <div className={sectionBody}>
        <div className={statusRow} style={{ marginBottom: '0.75rem' }}>
          <Badge variant={props.active ? 'active' : 'terminated'} uppercase size="sm">
            {t(props.active ? 'users.status.active' : 'users.status.inactive')}
          </Badge>
        </div>

        <div className={grid}>
          {txt('name', t('users.form.name'))}
          {txt('cpf', t('users.form.cpf'), { mask: 'cpf' })}
          {txt('email', t('users.form.email'), { type: 'email' })}
          {txt('telephone', t('users.form.telephone'), { mask: 'phone' })}

          {/* Aprovador em Massa — somente leitura (derivado dos perfis de acesso no backend). */}
          <div className={readonlyRow}>
            <span className={readonlyLabel}>{t('users.form.massApproval')}</span>
            <Badge variant={props.massApproval ? 'finished' : 'pending'} uppercase size="sm">
              {t(props.massApproval ? 'users.detail.yes' : 'users.detail.no')}
            </Badge>
          </div>
        </div>
      </div>
    </section>
  )
}
