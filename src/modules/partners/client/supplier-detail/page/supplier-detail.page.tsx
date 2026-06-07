import { useState, type ReactNode } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { PageHeader } from '#shared/ui/index.ts'

import { useSupplierDetailBinding } from '../supplier-detail.binding.ts'
import { statusActionFor } from '../supplier-detail.view-model.ts'
import { SupplierDetailContent } from '../components/supplier-detail-content.component.tsx'
import { ConfirmDialog } from '../components/confirm-dialog.component.tsx'
import { actionButton, errorBanner, headerActions, screen } from './supplier-detail.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/parceiros/fornecedores/$id')

export function SupplierDetailPage(): ReactNode {
  const { id } = routeApi.useParams()
  const navigate = useNavigate()
  const { state, statusCommand, canWrite, canViewSensitive } = useSupplierDetailBinding(id)
  const [confirming, setConfirming] = useState(false)

  if (state.status === 'loading') {
    return (
      <div className={screen}>
        <PageHeader
          title={t('partners.suppliers.detail.title')}
          subtitle={t('partners.suppliers.list.loading')}
        />
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className={screen}>
        <PageHeader title={t('partners.suppliers.detail.title')} subtitle={t(state.errorTag)} />
      </div>
    )
  }

  const supplier = state.supplier
  const action = statusActionFor(supplier.activation)
  const actionLabel =
    action === 'deactivate'
      ? t('partners.suppliers.actions.deactivate')
      : t('partners.suppliers.actions.reactivate')

  return (
    <div className={screen}>
      <PageHeader
        title={supplier.name}
        subtitle={supplier.fantasyName}
        actions={
          canWrite ? (
            <div className={headerActions}>
              <button
                type="button"
                className={actionButton}
                onClick={() =>
                  void navigate({ to: '/parceiros/fornecedores/$id/editar', params: { id } })
                }
              >
                {t('partners.suppliers.actions.edit')}
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

      <SupplierDetailContent supplier={supplier} canViewSensitive={canViewSensitive} />

      <ConfirmDialog
        open={confirming}
        title={
          action === 'deactivate'
            ? t('partners.suppliers.confirm.deactivate-title')
            : t('partners.suppliers.confirm.reactivate-title')
        }
        message={
          action === 'deactivate'
            ? t('partners.suppliers.confirm.deactivate-message')
            : t('partners.suppliers.confirm.reactivate-message')
        }
        confirmLabel={t('partners.suppliers.confirm.confirm')}
        cancelLabel={t('partners.suppliers.confirm.cancel')}
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
