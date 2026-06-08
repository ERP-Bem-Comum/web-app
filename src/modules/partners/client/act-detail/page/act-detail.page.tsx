import { useState, type ReactNode } from 'react'
import { getRouteApi, useNavigate, useRouter } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { PageHeader } from '#shared/ui/index.ts'

import { useActDetailBinding } from '../act-detail.binding.ts'
import { statusActionFor } from '../act-detail.view-model.ts'
import { ActDetailContent } from '../components/act-detail-content.component.tsx'
import { ConfirmDialog } from '../components/confirm-dialog.component.tsx'
import { actionButton, errorBanner, headerActions, screen } from './act-detail.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/parceiros/atos/$id')

export function ActDetailPage(): ReactNode {
  const { id } = routeApi.useParams()
  const navigate = useNavigate()
  const router = useRouter()
  const goBack = (): void => { router.history.back(); }
  const { state, statusCommand, canWrite } = useActDetailBinding(id)
  const [confirming, setConfirming] = useState(false)

  if (state.status === 'loading') {
    return (
      <div className={screen}>
        <PageHeader
          title={t('partners.acts.detail.title')}
          subtitle={t('partners.acts.list.loading')}
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
          title={t('partners.acts.detail.title')}
          subtitle={t(state.errorTag)}
          onBack={goBack}
          backLabel={t('common.back')}
        />
      </div>
    )
  }

  const act = state.act
  const action = statusActionFor(act.activation)
  const actionLabel =
    action === 'deactivate' ? t('partners.acts.actions.deactivate') : t('partners.acts.actions.reactivate')

  return (
    <div className={screen}>
      <PageHeader
        title={act.name}
        subtitle={act.role}
        onBack={goBack}
        backLabel={t('common.back')}
        actions={
          canWrite ? (
            <div className={headerActions}>
              <button
                type="button"
                className={actionButton}
                onClick={() => void navigate({ to: '/parceiros/atos/$id/editar', params: { id } })}
              >
                {t('partners.acts.actions.edit')}
              </button>
              <button type="button" className={actionButton} onClick={() => { setConfirming(true); }}>
                {actionLabel}
              </button>
            </div>
          ) : undefined
        }
      />

      {statusCommand.errorTag !== null ? (
        <div className={errorBanner} role="alert">
          {t(statusCommand.errorTag)}
        </div>
      ) : null}

      <ActDetailContent act={act} />

      <ConfirmDialog
        open={confirming}
        title={
          action === 'deactivate'
            ? t('partners.acts.confirm.deactivate-title')
            : t('partners.acts.confirm.reactivate-title')
        }
        message={
          action === 'deactivate'
            ? t('partners.acts.confirm.deactivate-message')
            : t('partners.acts.confirm.reactivate-message')
        }
        confirmLabel={t('partners.acts.confirm.confirm')}
        cancelLabel={t('partners.acts.confirm.cancel')}
        running={statusCommand.running}
        onConfirm={() => {
          statusCommand.execute(id, action)
          setConfirming(false)
        }}
        onCancel={() => {
          setConfirming(false)
        }}
      />
    </div>
  )
}
