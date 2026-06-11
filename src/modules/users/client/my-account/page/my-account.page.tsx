import { useState, type ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Button, PageHeader, formatMask } from '#shared/ui/index.ts'

import { useMyAccountBinding } from '../my-account.binding.ts'
import { initialsFromName, type UserDetail } from '../my-account.view-model.ts'
import { EditProfileModal } from '../components/edit-profile-modal.component.tsx'
import { ResetPasswordModal } from '../components/reset-password-modal.component.tsx'
import {
  actions,
  avatar,
  body,
  card,
  editWrap,
  infoIcon,
  infoRow,
  name as nameClass,
  resetButton,
  screen,
} from './my-account.css.ts'

const t = createTranslator(ptBR)

type Modal = 'none' | 'edit' | 'password'

function IconUser(): ReactNode {
  return <svg className={infoIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></svg>
}
function IconMail(): ReactNode {
  return <svg className={infoIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
}
function IconPhone(): ReactNode {
  return <svg className={infoIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></svg>
}

export function MyAccountPage(): ReactNode {
  const [modal, setModal] = useState<Modal>('none')
  const { state, saveCommand, passwordCommand, passwordLimits } = useMyAccountBinding(() => { setModal('none'); })

  return (
    <div className={screen}>
      <PageHeader title={t('users.account.title')} />

      {state.status === 'loading' ? (
        <p className={infoRow}>{t('users.list.loading')}</p>
      ) : state.status === 'error' ? (
        <p className={infoRow}>{t(state.errorTag)}</p>
      ) : (
        <Ready
          me={state.me}
          onEdit={() => { setModal('edit') }}
          onResetPassword={() => { setModal('password') }}
        />
      )}

      {state.status === 'ready' ? (
        <>
          <EditProfileModal
            open={modal === 'edit'}
            me={state.me}
            running={saveCommand.running}
            errorTag={saveCommand.errorTag}
            onSave={(input) => { saveCommand.execute(input) }}
            onClose={() => { setModal('none') }}
          />
          <ResetPasswordModal
            open={modal === 'password'}
            running={passwordCommand.running}
            errorTag={passwordCommand.errorTag}
            minLength={passwordLimits.minLength}
            maxLength={passwordLimits.maxLength}
            onSave={(input) => { passwordCommand.execute(input) }}
            onClose={() => { setModal('none') }}
          />
        </>
      ) : null}
    </div>
  )
}

function Ready({ me, onEdit, onResetPassword }: Readonly<{ me: UserDetail; onEdit: () => void; onResetPassword: () => void }>): ReactNode {
  return (
    <div className={card}>
      <div className={avatar}>{initialsFromName(me.name)}</div>
      <div className={body}>
        <h2 className={nameClass}>{me.name !== '' ? me.name : t('users.account.unnamed')}</h2>
        {me.cpf !== '' ? <span className={infoRow}><IconUser />{formatMask('cpf', me.cpf)}</span> : null}
        <span className={infoRow}><IconMail />{me.email}</span>
        {me.telephone !== '' ? <span className={infoRow}><IconPhone />{formatMask('phone', me.telephone)}</span> : null}
      </div>
      <div className={actions}>
        <button type="button" className={resetButton} onClick={onResetPassword}>{t('users.account.resetPassword')}</button>
        <div className={editWrap}>
          <Button onClick={onEdit}>{t('users.account.edit')}</Button>
        </div>
      </div>
    </div>
  )
}
