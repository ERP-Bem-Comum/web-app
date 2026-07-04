/**
 * UsersDetailPage — detalhe do usuário. Exibe os Dados + status + Aprovador em Massa. `Editar` habilita
 * os campos na própria tela; `Salvar` persiste; `Voltar` retorna; `Inativar/Reativar` alterna o status.
 * Visual: identidade "brand" de formulário (`brand-form.css.ts`) — mesma da tela Novo Usuário / Colaborador.
 */
import { useState, type ReactNode } from 'react'
import { useRouter } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { ChevronLeftIcon } from '#shared/ui/icons/index.ts'
import {
  page,
  scrollArea,
  content,
  head,
  backBtn,
  headText,
  headTitle,
  headSubtitle,
  actionbar,
  actionbarInner,
  btnGhost,
  btnPrimary,
} from '#shared/ui/brand/brand-form.css.ts'

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
import { avatarRow, errorBanner, screen } from './users-detail.css.ts'

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
        <div className={page}>
          <div className={scrollArea}>
            <div className={content}>
              <DetailHead
                title={t('users.detail.title')}
                subtitle={t('users.list.loading')}
                onBack={goBack}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className={screen}>
        <div className={page}>
          <div className={scrollArea}>
            <div className={content}>
              <DetailHead title={t('users.detail.title')} onBack={goBack} />
              <div className={errorBanner} role="alert">
                {t(state.errorTag)}
              </div>
            </div>
          </div>
        </div>
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

// Cabeçalho "brand": voltar + título/subtítulo.
function DetailHead({
  title,
  subtitle,
  onBack,
}: {
  title: string
  subtitle?: string
  onBack: () => void
}): ReactNode {
  return (
    <div className={head}>
      <button type="button" className={backBtn} onClick={onBack} aria-label={t('common.back')}>
        <ChevronLeftIcon size={18} />
      </button>
      <div className={headText}>
        <h1 className={headTitle}>{title}</h1>
        {subtitle !== undefined ? <p className={headSubtitle}>{subtitle}</p> : null}
      </div>
    </div>
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
      <div className={page}>
        <div className={scrollArea}>
          <div className={content}>
            <DetailHead
              title={user.name !== '' ? user.name : t('users.detail.title')}
              subtitle={user.email}
              onBack={props.onBack}
            />

            {errorTag !== null ? (
              <div className={errorBanner} role="alert">
                {t(errorTag)}
              </div>
            ) : null}

            <div className={avatarRow}>
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
            </div>

            <UserDetailContent
              controller={c}
              editing={editing}
              active={user.active}
              massApproval={user.massApprovalPermission}
            />
          </div>
        </div>

        <div className={actionbar}>
          <div className={actionbarInner}>
            {editing ? (
              <>
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => {
                    c.reset(detailToFormValues(user))
                    props.onCancel()
                  }}
                >
                  {t('users.form.cancel')}
                </button>
                <button
                  type="button"
                  className={btnPrimary}
                  disabled={props.saveCommand.running}
                  onClick={() => {
                    c.submit()
                  }}
                >
                  {props.saveCommand.running ? t('users.detail.saving') : t('users.detail.save')}
                </button>
              </>
            ) : (
              <>
                <button type="button" className={btnGhost} onClick={props.onBack}>
                  {t('common.back')}
                </button>
                {props.canSetStatus ? (
                  <button
                    type="button"
                    className={btnGhost}
                    onClick={() => {
                      setConfirming(true)
                    }}
                  >
                    {actionLabel}
                  </button>
                ) : null}
                {props.canUpdate ? (
                  <button type="button" className={btnPrimary} onClick={props.onEdit}>
                    {t('users.actions.edit')}
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>
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
