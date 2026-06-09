import { useState, type ReactNode } from 'react'
import { getRouteApi, useRouter } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Button, PageHeader } from '#shared/ui/index.ts'
import { useFinancierFormController } from '#modules/partners/client/financier-create/components/financier-form.controller.ts'
import { detailToFormValues } from '#modules/partners/client/financier-edit/financier-edit.view-model.ts'

import {
  useFinancierDetailBinding,
  type FinancierSaveCommand,
  type FinancierStatusCommand,
} from '../financier-detail.binding.ts'
import { statusActionFor, type FinancierDetail } from '../financier-detail.view-model.ts'
import { FinancierDetailContent } from '../components/financier-detail-content.component.tsx'
import { ConfirmDialog } from '../components/confirm-dialog.component.tsx'
import { actionButton, errorBanner, footer, saveWrap, screen } from './financier-detail.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/parceiros/financiadores/$id')

export function FinancierDetailPage(): ReactNode {
  const { id } = routeApi.useParams()
  const router = useRouter()
  const goBack = (): void => { router.history.back(); }
  const [editing, setEditing] = useState(false)
  const { state, statusCommand, saveCommand, canWrite } = useFinancierDetailBinding(id, () => { setEditing(false); })

  if (state.status === 'loading') {
    return (
      <div className={screen}>
        <PageHeader title={t('partners.financiers.detail.title')} subtitle={t('partners.financiers.list.loading')} onBack={goBack} backLabel={t('common.back')} />
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className={screen}>
        <PageHeader title={t('partners.financiers.detail.title')} subtitle={t(state.errorTag)} onBack={goBack} backLabel={t('common.back')} />
      </div>
    )
  }

  return (
    <DetailReady
      key={state.financier.id}
      financier={state.financier}
      editing={editing}
      canWrite={canWrite}
      statusCommand={statusCommand}
      saveCommand={saveCommand}
      onEdit={() => { setEditing(true); }}
      onCancel={() => { setEditing(false); }}
      onBack={goBack}
    />
  )
}

type DetailReadyProps = Readonly<{
  financier: FinancierDetail
  editing: boolean
  canWrite: boolean
  statusCommand: FinancierStatusCommand
  saveCommand: FinancierSaveCommand
  onEdit: () => void
  onCancel: () => void
  onBack: () => void
}>

function DetailReady(props: DetailReadyProps): ReactNode {
  const { financier, editing } = props
  const [confirming, setConfirming] = useState(false)
  const c = useFinancierFormController({
    initial: detailToFormValues(financier),
    onSubmit: (values) => { props.saveCommand.execute(values); },
  })

  const action = statusActionFor(financier.activation)
  const actionLabel =
    action === 'deactivate' ? t('partners.financiers.actions.deactivate') : t('partners.financiers.actions.reactivate')
  const errorTag = props.saveCommand.errorTag ?? props.statusCommand.errorTag

  return (
    <div className={screen}>
      <PageHeader title={financier.name} subtitle={financier.corporateName} onBack={props.onBack} backLabel={t('common.back')} />

      {errorTag !== null ? (
        <div className={errorBanner} role="alert">{t(errorTag)}</div>
      ) : null}

      <FinancierDetailContent controller={c} editing={editing} activation={financier.activation} />

      <div className={footer}>
        {editing ? (
          <>
            <button type="button" className={actionButton} onClick={() => { c.reset(detailToFormValues(financier)); props.onCancel(); }}>
              {t('partners.financiers.form.cancel')}
            </button>
            <div className={saveWrap}>
              <Button onClick={() => { c.submit(); }} loading={props.saveCommand.running} loadingLabel={t('partners.financiers.form.saving')}>
                {t('partners.financiers.form.save')}
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
                  <Button onClick={props.onEdit}>{t('partners.financiers.actions.edit')}</Button>
                </div>
              </>
            ) : null}
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirming}
        title={action === 'deactivate' ? t('partners.financiers.confirm.deactivate-title') : t('partners.financiers.confirm.reactivate-title')}
        message={action === 'deactivate' ? t('partners.financiers.confirm.deactivate-message') : t('partners.financiers.confirm.reactivate-message')}
        confirmLabel={t('partners.financiers.confirm.confirm')}
        cancelLabel={t('partners.financiers.confirm.cancel')}
        running={props.statusCommand.running}
        onConfirm={() => { props.statusCommand.execute(financier.id, action); setConfirming(false); }}
        onCancel={() => { setConfirming(false); }}
      />
    </div>
  )
}
