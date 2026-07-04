import { useState, type ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { formatMask } from '#shared/ui/index.ts'
import { UsersIcon } from '#shared/ui/icons/index.ts'
import {
  page,
  scrollArea,
  content,
  head,
  headTitle,
  sectionCard,
  sectionHeader,
  sectionIcon,
  sectionH2,
  sectionBody,
  grid,
  field,
  fieldLabel,
  input,
  actionbar,
  actionbarInner,
  btnGhost,
  btnPrimary,
} from '#shared/ui/brand/brand-form.css.ts'

import { useMyAccountBinding, type MyAccountBinding } from '../my-account.binding.ts'
import { initialsFromName, type UserDetail } from '../my-account.view-model.ts'
import { EditProfileModal } from '../components/edit-profile-modal.component.tsx'
import { ResetPasswordModal } from '../components/reset-password-modal.component.tsx'
import { UserAvatarUploader } from '../../user-photo/user-avatar-uploader.component.tsx'
import { screen, avatarRow, identity, accountName, accountEmail, stateMessage } from './my-account.css.ts'

const t = createTranslator(ptBR)

type Modal = 'none' | 'edit' | 'password'

export function MyAccountPage(): ReactNode {
  const [modal, setModal] = useState<Modal>('none')
  const { state, saveCommand, passwordCommand, passwordLimits, photo, photoUpload } = useMyAccountBinding(
    () => {
      setModal('none')
    },
  )

  return (
    <div className={screen}>
      <div className={page}>
        <div className={scrollArea}>
          <div className={content}>
            <div className={head}>
              <h1 className={headTitle}>{t('users.account.title')}</h1>
            </div>

            {state.status === 'loading' ? (
              <p className={stateMessage}>{t('users.list.loading')}</p>
            ) : state.status === 'error' ? (
              <p className={stateMessage}>{t(state.errorTag)}</p>
            ) : (
              <ReadyCard me={state.me} photo={photo} photoUpload={photoUpload} />
            )}
          </div>
        </div>

        {state.status === 'ready' ? (
          <div className={actionbar}>
            <div className={actionbarInner}>
              <button
                type="button"
                className={btnGhost}
                onClick={() => {
                  setModal('password')
                }}
              >
                {t('users.account.resetPassword')}
              </button>
              <button
                type="button"
                className={btnPrimary}
                onClick={() => {
                  setModal('edit')
                }}
              >
                {t('users.account.edit')}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {state.status === 'ready' ? (
        <>
          <EditProfileModal
            open={modal === 'edit'}
            me={state.me}
            running={saveCommand.running}
            errorTag={saveCommand.errorTag}
            onSave={(input) => {
              saveCommand.execute(input)
            }}
            onClose={() => {
              setModal('none')
            }}
          />
          <ResetPasswordModal
            open={modal === 'password'}
            running={passwordCommand.running}
            errorTag={passwordCommand.errorTag}
            minLength={passwordLimits.minLength}
            maxLength={passwordLimits.maxLength}
            onSave={(input) => {
              passwordCommand.execute(input)
            }}
            onClose={() => {
              setModal('none')
            }}
          />
        </>
      ) : null}
    </div>
  )
}

function ReadyCard({
  me,
  photo,
  photoUpload,
}: Readonly<{
  me: UserDetail
  photo: MyAccountBinding['photo']
  photoUpload: MyAccountBinding['photoUpload']
}>): ReactNode {
  return (
    <section className={sectionCard}>
      <div className={sectionHeader}>
        <span className={sectionIcon}>
          <UsersIcon size={17} />
        </span>
        <h2 className={sectionH2}>{t('users.form.section.data')}</h2>
      </div>
      <div className={sectionBody}>
        <div className={avatarRow}>
          <UserAvatarUploader
            url={photo.url}
            initials={initialsFromName(me.name)}
            name={me.name}
            canEdit
            running={photo.loading || photoUpload.running}
            errorTag={photoUpload.errorTag}
            onUpload={(fileBase64, mimeType) => {
              photoUpload.execute(fileBase64, mimeType)
            }}
          />
          <div className={identity}>
            <h2 className={accountName}>{me.name !== '' ? me.name : t('users.account.unnamed')}</h2>
            <span className={accountEmail}>{me.email}</span>
          </div>
        </div>

        <div className={grid}>
          <div className={field}>
            <label htmlFor="acc-name" className={fieldLabel}>
              {t('users.form.name')}
            </label>
            <input id="acc-name" className={input} value={me.name} disabled />
          </div>
          <div className={field}>
            <label htmlFor="acc-cpf" className={fieldLabel}>
              {t('users.form.cpf')}
            </label>
            <input
              id="acc-cpf"
              className={input}
              value={me.cpf !== '' ? formatMask('cpf', me.cpf) : ''}
              disabled
            />
          </div>
          <div className={field}>
            <label htmlFor="acc-email" className={fieldLabel}>
              {t('users.form.email')}
            </label>
            <input id="acc-email" className={input} value={me.email} disabled />
          </div>
          <div className={field}>
            <label htmlFor="acc-phone" className={fieldLabel}>
              {t('users.form.telephone')}
            </label>
            <input
              id="acc-phone"
              className={input}
              value={me.telephone !== '' ? formatMask('phone', me.telephone) : ''}
              disabled
            />
          </div>
        </div>
      </div>
    </section>
  )
}
