import { useState, type ReactNode } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { PageHeader } from '#shared/ui/index.ts'

import { useFinancierDetailBinding } from '../financier-detail.binding.ts'
import { statusActionFor } from '../financier-detail.view-model.ts'
import { FinancierDetailContent } from '../components/financier-detail-content.component.tsx'
import { ConfirmDialog } from '../components/confirm-dialog.component.tsx'
import { actionButton, errorBanner, headerActions, screen } from './financier-detail.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/parceiros/financiadores/$id')

export function FinancierDetailPage(): ReactNode {
  const { id } = routeApi.useParams()
  const navigate = useNavigate()
  const { state, statusCommand, canWrite } = useFinancierDetailBinding(id)
  const [confirming, setConfirming] = useState(false)

  if (state.status === 'loading') {
    return (
      <div className={screen}>
        <PageHeader
          title={t('partners.financiers.detail.title')}
          subtitle={t('partners.financiers.list.loading')}
        />
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className={screen}>
        <PageHeader title={t('partners.financiers.detail.title')} subtitle={t(state.errorTag)} />
      </div>
    )
  }

  const financier = state.financier
  const action = statusActionFor(financier.activation)
  const actionLabel =
    action === 'deactivate'
      ? t('partners.financiers.actions.deactivate')
      : t('partners.financiers.actions.reactivate')

  return (
    <div className={screen}>
      <PageHeader
        title={financier.name}
        subtitle={financier.corporateName}
        actions={
          canWrite ? (
            <div className={headerActions}>
              <button
                type="button"
                className={actionButton}
                onClick={() => void navigate({ to: '/parceiros/financiadores/$id/editar', params: { id } })}
              >
                {t('partners.financiers.actions.edit')}
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

      <FinancierDetailContent financier={financier} />

      <ConfirmDialog
        open={confirming}
        title={
          action === 'deactivate'
            ? t('partners.financiers.confirm.deactivate-title')
            : t('partners.financiers.confirm.reactivate-title')
        }
        message={
          action === 'deactivate'
            ? t('partners.financiers.confirm.deactivate-message')
            : t('partners.financiers.confirm.reactivate-message')
        }
        confirmLabel={t('partners.financiers.confirm.confirm')}
        cancelLabel={t('partners.financiers.confirm.cancel')}
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
