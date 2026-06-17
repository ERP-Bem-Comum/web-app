import { useState, type ReactNode } from 'react'
import { useRouter } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Button, PageHeader } from '#shared/ui/index.ts'

import { useUserFormController } from '#modules/users/client/users-create/components/user-form.controller.ts'
import { ConfirmDialog } from '#modules/users/client/users-create/components/confirm-dialog.component.tsx'

import {
  useUsersDetailBinding,
  type UsersDetailBinding,
  type UsersSaveCommand,
  type UsersStatusCommand,
} from '../users-detail.binding.ts'
import { detailToFormValues, statusActionFor, type UserDetail } from '../users-detail.view-model.ts'
import { UserDetailContent } from '../components/user-detail-content.component.tsx'
import { UserAvatarUploader } from '../../user-photo/user-avatar-uploader.component.tsx'
import { initialsFromName } from '../../my-account/my-account.view-model.ts'
import { actionButton, errorBanner, footer, saveWrap, screen } from './users-detail.css.ts'

const t = createTranslator(ptBR)

export function UsersDetailPage({ userId }: { userId: string }): ReactNode {
  const router = useRouter()
  const goBack = (): void => {
    router.history.back()
  }
  const [editing, setEditing] = useState(false)
  const { state, saveCommand, statusCommand, canUpdate, canSetStatus, photo, photoUpload } =
    useUsersDetailBinding(userId, () => {
      setEditing(false)
    })

  if (state.status === 'loading') {
    return (
      <div className={screen}>
        <PageHeader
          title={t('users.detail.title')}
          subtitle={t('users.list.loading')}
          onBack={goBack}
          backLabel={t('common.back')}
        />
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className={screen}>
        <PageHeader
          title={t('users.detail.title')}
          subtitle={t(state.errorTag)}
          onBack={goBack}
          backLabel={t('common.back')}
        />
      </div>
    )
  }

  return (
    <DetailReady
      key={state.user.id}
      user={state.user}
      editing={editing}
      canUpdate={canUpdate}
      canSetStatus={canSetStatus}
      saveCommand={saveCommand}
      statusCommand={statusCommand}
      photo={photo}
      photoUpload={photoUpload}
      onEdit={() => {
        setEditing(true)
      }}
      onCancel={() => {
        setEditing(false)
      }}
      onBack={goBack}
    />
  )
}

type DetailReadyProps = Readonly<{
  user: UserDetail
  editing: boolean
  canUpdate: boolean
  canSetStatus: boolean
  saveCommand: UsersSaveCommand
  statusCommand: UsersStatusCommand
  photo: UsersDetailBinding['photo']
  photoUpload: UsersDetailBinding['photoUpload']
  onEdit: () => void
  onCancel: () => void
  onBack: () => void
}>

function DetailReady(props: DetailReadyProps): ReactNode {
  const { user, editing } = props
  const [confirming, setConfirming] = useState(false)
  const c = useUserFormController({
    initial: detailToFormValues(user),
    onSubmit: (values) => {
      props.saveCommand.execute(values)
    },
  })

  const action = statusActionFor(user.active)
  const actionLabel = action === 'deactivate' ? t('users.actions.deactivate') : t('users.actions.reactivate')
  const errorTag = props.saveCommand.errorTag ?? props.statusCommand.errorTag

  return (
    <div className={screen}>
      <PageHeader
        title={user.name !== '' ? user.name : t('users.detail.title')}
        subtitle={user.email}
        onBack={props.onBack}
        backLabel={t('common.back')}
      />

      {errorTag !== null ? (
        <div className={errorBanner} role="alert">
          {t(errorTag)}
        </div>
      ) : null}

      <UserAvatarUploader
        url={props.photo.url}
        initials={initialsFromName(user.name)}
        name={user.name}
        canEdit={props.canUpdate}
        running={props.photo.loading || props.photoUpload.running}
        errorTag={props.photoUpload.errorTag}
        onUpload={(fileBase64, mimeType) => {
          props.photoUpload.execute(fileBase64, mimeType)
        }}
      />

      <UserDetailContent
        controller={c}
        editing={editing}
        active={user.active}
        massApproval={user.massApprovalPermission}
      />

      <div className={footer}>
        {editing ? (
          <>
            <button
              type="button"
              className={actionButton}
              onClick={() => {
                c.reset(detailToFormValues(user))
                props.onCancel()
              }}
            >
              {t('users.form.cancel')}
            </button>
            <div className={saveWrap}>
              <Button
                onClick={() => {
                  c.submit()
                }}
                loading={props.saveCommand.running}
                loadingLabel={t('users.detail.saving')}
              >
                {t('users.detail.save')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <button type="button" className={actionButton} onClick={props.onBack}>
              {t('common.back')}
            </button>
            {props.canSetStatus ? (
              <button
                type="button"
                className={actionButton}
                onClick={() => {
                  setConfirming(true)
                }}
              >
                {actionLabel}
              </button>
            ) : null}
            {props.canUpdate ? (
              <div className={saveWrap}>
                <Button onClick={props.onEdit}>{t('users.actions.edit')}</Button>
              </div>
            ) : null}
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirming}
        title={
          action === 'deactivate' ? t('users.confirm.deactivate-title') : t('users.confirm.reactivate-title')
        }
        message={
          action === 'deactivate'
            ? t('users.confirm.deactivate-message')
            : t('users.confirm.reactivate-message')
        }
        confirmLabel={t('users.confirm.confirm')}
        cancelLabel={t('users.confirm.cancel')}
        running={props.statusCommand.running}
        onConfirm={() => {
          props.statusCommand.execute(user.id, action)
          setConfirming(false)
        }}
        onCancel={() => {
          setConfirming(false)
        }}
      />
    </div>
  )
}
