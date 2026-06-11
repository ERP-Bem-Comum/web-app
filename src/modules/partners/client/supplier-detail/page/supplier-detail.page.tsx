import { useState, type ReactNode } from 'react'
import { getRouteApi, useRouter } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Button, PageHeader } from '#shared/ui/index.ts'
import { useSupplierFormController, type SupplierFormValues } from '#modules/partners/client/supplier-create/components/supplier-form.controller.ts'

import {
  useSupplierDetailBinding,
  type SupplierSaveCommand,
  type SupplierStatusCommand,
} from '../supplier-detail.binding.ts'
import { statusActionFor, type SupplierDetail } from '../supplier-detail.view-model.ts'
import { SupplierDetailContent } from '../components/supplier-detail-content.component.tsx'
import { ConfirmDialog } from '../components/confirm-dialog.component.tsx'
import { actionButton, errorBanner, footer, saveWrap, screen } from './supplier-detail.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/parceiros/fornecedores/$id')

export function SupplierDetailPage(): ReactNode {
  const { id } = routeApi.useParams()
  const router = useRouter()
  const goBack = (): void => { router.history.back(); }
  const [editing, setEditing] = useState(false)
  const { state, statusCommand, saveCommand, canWrite, canViewSensitive, categories } =
    useSupplierDetailBinding(id, () => { setEditing(false); })

  if (state.status === 'loading') {
    return (
      <div className={screen}>
        <PageHeader title={t('partners.suppliers.detail.title')} subtitle={t('partners.suppliers.list.loading')} onBack={goBack} backLabel={t('common.back')} />
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className={screen}>
        <PageHeader title={t('partners.suppliers.detail.title')} subtitle={t(state.errorTag)} onBack={goBack} backLabel={t('common.back')} />
      </div>
    )
  }

  return (
    <DetailReady
      key={state.supplier.id}
      supplier={state.supplier}
      editing={editing}
      canWrite={canWrite}
      canViewSensitive={canViewSensitive}
      categories={categories}
      statusCommand={statusCommand}
      saveCommand={saveCommand}
      onEdit={() => { setEditing(true); }}
      onCancel={() => { setEditing(false); }}
      onBack={goBack}
    />
  )
}

type DetailReadyProps = Readonly<{
  supplier: SupplierDetail
  editing: boolean
  canWrite: boolean
  canViewSensitive: boolean
  categories: readonly string[]
  statusCommand: SupplierStatusCommand
  saveCommand: SupplierSaveCommand
  onEdit: () => void
  onCancel: () => void
  onBack: () => void
}>

function DetailReady(props: DetailReadyProps): ReactNode {
  const { supplier, editing } = props
  const [confirming, setConfirming] = useState(false)
  const [pendingEdit, setPendingEdit] = useState<SupplierFormValues | null>(null)
  const c = useSupplierFormController({
    initial: {
      name: supplier.name,
      corporateName: supplier.corporateName,
      fantasyName: supplier.fantasyName,
      email: supplier.email,
      cnpj: supplier.cnpj,
      serviceCategory: supplier.serviceCategory,
      bankAccount: supplier.bankAccount,
      pixKey: supplier.pixKey,
    },
    onSubmit: (values) => { setPendingEdit(values); },
  })

  const action = statusActionFor(supplier.activation)
  const actionLabel =
    action === 'deactivate'
      ? t('partners.suppliers.actions.deactivate')
      : t('partners.suppliers.actions.reactivate')
  const errorTag = props.saveCommand.errorTag ?? props.statusCommand.errorTag

  return (
    <div className={screen}>
      <PageHeader title={supplier.name} subtitle={supplier.fantasyName} onBack={props.onBack} backLabel={t('common.back')} />

      {errorTag !== null ? (
        <div className={errorBanner} role="alert">{t(errorTag)}</div>
      ) : null}

      <SupplierDetailContent
        controller={c}
        editing={editing}
        canViewSensitive={props.canWrite}
        cnpjDisabled={!props.canViewSensitive}
        activation={supplier.activation}
        categories={props.categories}
      />

      <div className={footer}>
        {editing ? (
          <>
            <button type="button" className={actionButton} onClick={() => { c.reset({
              name: supplier.name,
              corporateName: supplier.corporateName,
              fantasyName: supplier.fantasyName,
              email: supplier.email,
              cnpj: supplier.cnpj,
              serviceCategory: supplier.serviceCategory,
              bankAccount: supplier.bankAccount,
              pixKey: supplier.pixKey,
            }); props.onCancel(); }}>
              {t('partners.suppliers.form.cancel')}
            </button>
            <div className={saveWrap}>
              <Button onClick={() => { c.submit(); }} loading={props.saveCommand.running} loadingLabel={t('partners.suppliers.form.saving')}>
                {t('partners.suppliers.form.save')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <button type="button" className={actionButton} onClick={props.onBack}>{t('common.back')}</button>
            {props.canWrite ? (
              <>
                <button type="button" className={actionButton} onClick={() => { setConfirming(true); }}>{actionLabel}</button>
                <div className={saveWrap}>
                  <Button onClick={props.onEdit}>{t('partners.suppliers.actions.edit')}</Button>
                </div>
              </>
            ) : null}
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirming}
        title={action === 'deactivate' ? t('partners.suppliers.confirm.deactivate-title') : t('partners.suppliers.confirm.reactivate-title')}
        message={action === 'deactivate' ? t('partners.suppliers.confirm.deactivate-message') : t('partners.suppliers.confirm.reactivate-message')}
        confirmLabel={t('partners.suppliers.confirm.confirm')}
        cancelLabel={t('partners.suppliers.confirm.cancel')}
        running={props.statusCommand.running}
        onConfirm={() => { props.statusCommand.execute(supplier.id, action); setConfirming(false); }}
        onCancel={() => { setConfirming(false); }}
      />

      <ConfirmDialog
        open={pendingEdit !== null}
        title={t('partners.confirm.edit.title')}
        message={t('partners.confirm.edit.message')}
        confirmLabel={t('partners.confirm.confirm')}
        cancelLabel={t('partners.confirm.cancel')}
        running={props.saveCommand.running}
        onConfirm={() => { if (pendingEdit !== null) props.saveCommand.execute(pendingEdit); setPendingEdit(null); }}
        onCancel={() => { setPendingEdit(null); }}
      />
    </div>
  )
}
