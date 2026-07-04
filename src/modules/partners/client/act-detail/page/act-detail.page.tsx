/**
 * ActDetailPage — detalhe do Acordo de Cooperação Técnica (clique na linha da grid). Exibe as 3 seções
 * (instrumento, instituição, repasse). `Editar` habilita todos os campos na própria tela; `Salvar`
 * persiste; `Inativar`/`Reativar` alterna o status. `Voltar` retorna.
 * Visual: identidade "brand" de formulário (`brand-form.css.ts`) — mesma da tela Novo ACT.
 */
import { useState, type ReactNode } from 'react'
import { getRouteApi, useRouter } from '@tanstack/react-router'

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
import {
  useActFormController,
  type ActFormValues,
} from '#modules/partners/client/act-create/components/act-form.controller.ts'
import { detailToFormValues } from '#modules/partners/client/act-edit/act-edit.view-model.ts'

import { useActDetailBinding, type ActSaveCommand, type ActStatusCommand } from '../act-detail.binding.ts'
import { statusActionFor, type ActDetail } from '../act-detail.view-model.ts'
import { ActDetailContent } from '../components/act-detail-content.component.tsx'
import { ConfirmDialog } from '../components/confirm-dialog.component.tsx'
import { errorBanner, screen } from './act-detail.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/parceiros/atos/$id')

export function ActDetailPage(): ReactNode {
  const { id } = routeApi.useParams()
  const router = useRouter()
  const goBack = (): void => {
    router.history.back()
  }
  const [editing, setEditing] = useState(false)
  const { state, statusCommand, saveCommand, canWrite } = useActDetailBinding(id, () => {
    setEditing(false)
  })

  if (state.status === 'loading') {
    return (
      <div className={screen}>
        <div className={page}>
          <div className={scrollArea}>
            <div className={content}>
              <DetailHead
                title={t('partners.acts.detail.title')}
                subtitle={t('partners.acts.list.loading')}
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
              <DetailHead title={t('partners.acts.detail.title')} onBack={goBack} />
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
      key={state.act.id}
      act={state.act}
      editing={editing}
      canWrite={canWrite}
      statusCommand={statusCommand}
      saveCommand={saveCommand}
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
  const [pendingEdit, setPendingEdit] = useState<ActFormValues | null>(null)
  const c = useActFormController({
    initial: detailToFormValues(act),
    onSubmit: (values) => {
      setPendingEdit(values)
    },
  })

  const action = statusActionFor(act.active)
  const actionLabel =
    action === 'deactivate' ? t('partners.acts.actions.deactivate') : t('partners.acts.actions.reactivate')
  const errorTag = props.saveCommand.errorTag ?? props.statusCommand.errorTag

  return (
    <div className={screen}>
      <div className={page}>
        <div className={scrollArea}>
          <div className={content}>
            <DetailHead title={act.name} subtitle={act.corporateName} onBack={props.onBack} />

            {errorTag !== null ? (
              <div className={errorBanner} role="alert">
                {t(errorTag)}
              </div>
            ) : null}

            <ActDetailContent controller={c} editing={editing} active={act.active} />
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
                    c.reset(detailToFormValues(act))
                    props.onCancel()
                  }}
                >
                  {t('partners.acts.form.cancel')}
                </button>
                <button
                  type="button"
                  className={btnPrimary}
                  disabled={props.saveCommand.running}
                  onClick={() => {
                    c.submit()
                  }}
                >
                  {props.saveCommand.running ? t('partners.acts.form.saving') : t('partners.acts.form.save')}
                </button>
              </>
            ) : (
              <>
                <button type="button" className={btnGhost} onClick={props.onBack}>
                  {t('common.back')}
                </button>
                {props.canWrite ? (
                  <>
                    <button
                      type="button"
                      className={btnGhost}
                      onClick={() => {
                        setConfirming(true)
                      }}
                    >
                      {actionLabel}
                    </button>
                    <button type="button" className={btnPrimary} onClick={props.onEdit}>
                      {t('partners.acts.actions.edit')}
                    </button>
                  </>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

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
        running={props.statusCommand.running}
        onConfirm={() => {
          props.statusCommand.execute(act.id, action)
          setConfirming(false)
        }}
        onCancel={() => {
          setConfirming(false)
        }}
      />

      <ConfirmDialog
        open={pendingEdit !== null}
        title={t('partners.confirm.edit.title')}
        message={t('partners.confirm.edit.message')}
        confirmLabel={t('partners.confirm.confirm')}
        cancelLabel={t('partners.confirm.cancel')}
        running={props.saveCommand.running}
        onConfirm={() => {
          if (pendingEdit !== null) props.saveCommand.execute(pendingEdit)
          setPendingEdit(null)
        }}
        onCancel={() => {
          setPendingEdit(null)
        }}
      />
    </div>
  )
}
