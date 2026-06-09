import { useState, type ReactNode } from 'react'
import { getRouteApi, useRouter } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Button, PageHeader } from '#shared/ui/index.ts'
import { useActFormController } from '#modules/partners/client/act-create/components/act-form.controller.ts'
import { detailToFormValues } from '#modules/partners/client/act-edit/act-edit.view-model.ts'

import { useActDetailBinding, type ActSaveCommand, type ActStatusCommand } from '../act-detail.binding.ts'
import { statusActionFor, type ActDetail } from '../act-detail.view-model.ts'
import { ActDetailContent } from '../components/act-detail-content.component.tsx'
import { ConfirmDialog } from '../components/confirm-dialog.component.tsx'
import { actionButton, errorBanner, footer, saveWrap, screen } from './act-detail.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/parceiros/atos/$id')

export function ActDetailPage(): ReactNode {
  const { id } = routeApi.useParams()
  const router = useRouter()
  const goBack = (): void => { router.history.back(); }
  const [editing, setEditing] = useState(false)
  const { state, statusCommand, saveCommand, canWrite } = useActDetailBinding(id, () => { setEditing(false); })

  if (state.status === 'loading') {
    return (
      <div className={screen}>
        <PageHeader title={t('partners.acts.detail.title')} subtitle={t('partners.acts.list.loading')} onBack={goBack} backLabel={t('common.back')} />
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className={screen}>
        <PageHeader title={t('partners.acts.detail.title')} subtitle={t(state.errorTag)} onBack={goBack} backLabel={t('common.back')} />
      </div>
    )
  }

  return (
    <DetailReady
      key={state.act.id}
      act={state.act}
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
  act: ActDetail
  editing: boolean
  canWrite: boolean
  statusCommand: ActStatusCommand
  saveCommand: ActSaveCommand
  onEdit: () => void
  onCancel: () => void
  onBack: () => void
}>

function DetailReady(props: DetailReadyProps): ReactNode {
  const { act, editing } = props
  const [confirming, setConfirming] = useState(false)
  const c = useActFormController({
    initial: detailToFormValues(act),
    onSubmit: (values) => { props.saveCommand.execute(values); },
  })

  const action = statusActionFor(act.activation)
  const actionLabel =
    action === 'deactivate' ? t('partners.acts.actions.deactivate') : t('partners.acts.actions.reactivate')
  const errorTag = props.saveCommand.errorTag ?? props.statusCommand.errorTag

  return (
    <div className={screen}>
      <PageHeader title={act.name} subtitle={act.role} onBack={props.onBack} backLabel={t('common.back')} />

      {errorTag !== null ? (
        <div className={errorBanner} role="alert">{t(errorTag)}</div>
      ) : null}

      <ActDetailContent controller={c} editing={editing} activation={act.activation} />

      <div className={footer}>
        {editing ? (
          <>
            <button type="button" className={actionButton} onClick={() => { c.reset(detailToFormValues(act)); props.onCancel(); }}>
              {t('partners.acts.form.cancel')}
            </button>
            <div className={saveWrap}>
              <Button onClick={() => { c.submit(); }} loading={props.saveCommand.running} loadingLabel={t('partners.acts.form.saving')}>
                {t('partners.acts.form.save')}
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
                  <Button onClick={props.onEdit}>{t('partners.acts.actions.edit')}</Button>
                </div>
              </>
            ) : null}
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirming}
        title={action === 'deactivate' ? t('partners.acts.confirm.deactivate-title') : t('partners.acts.confirm.reactivate-title')}
        message={action === 'deactivate' ? t('partners.acts.confirm.deactivate-message') : t('partners.acts.confirm.reactivate-message')}
        confirmLabel={t('partners.acts.confirm.confirm')}
        cancelLabel={t('partners.acts.confirm.cancel')}
        running={props.statusCommand.running}
        onConfirm={() => { props.statusCommand.execute(act.id, action); setConfirming(false); }}
        onCancel={() => { setConfirming(false); }}
      />
    </div>
  )
}
