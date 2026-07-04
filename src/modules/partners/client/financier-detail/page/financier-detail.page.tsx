/**
 * FinancierDetailPage — detalhe do financiador (clique na linha da grid). Exibe os dados e permite
 * `Editar` (habilita os campos na própria tela), `Salvar`, além de Inativar/Reativar. `Voltar` retorna.
 * Visual: identidade "brand" de formulário (`brand-form.css.ts`) — mesma da tela Novo Financiador.
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
  useFinancierFormController,
  type FinancierFormValues,
} from '#modules/partners/client/financier-create/components/financier-form.controller.ts'
import { detailToFormValues } from '#modules/partners/client/financier-edit/financier-edit.view-model.ts'

import {
  useFinancierDetailBinding,
  type FinancierSaveCommand,
  type FinancierStatusCommand,
} from '../financier-detail.binding.ts'
import { statusActionFor, type FinancierDetail } from '../financier-detail.view-model.ts'
import { FinancierDetailContent } from '../components/financier-detail-content.component.tsx'
import { ConfirmDialog } from '../components/confirm-dialog.component.tsx'
import { errorBanner, screen } from './financier-detail.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/parceiros/financiadores/$id')

export function FinancierDetailPage(): ReactNode {
  const { id } = routeApi.useParams()
  const router = useRouter()
  const goBack = (): void => {
    router.history.back()
  }
  const [editing, setEditing] = useState(false)
  const { state, statusCommand, saveCommand, canWrite } = useFinancierDetailBinding(id, () => {
    setEditing(false)
  })

  if (state.status === 'loading') {
    return (
      <div className={screen}>
        <div className={page}>
          <div className={scrollArea}>
            <div className={content}>
              <DetailHead
                title={t('partners.financiers.detail.title')}
                subtitle={t('partners.financiers.list.loading')}
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
              <DetailHead
                title={t('partners.financiers.detail.title')}
                subtitle={t(state.errorTag)}
                onBack={goBack}
              />
            </div>
          </div>
        </div>
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
  const [pendingEdit, setPendingEdit] = useState<FinancierFormValues | null>(null)
  const c = useFinancierFormController({
    initial: detailToFormValues(financier),
    onSubmit: (values) => {
      setPendingEdit(values)
    },
  })

  const action = statusActionFor(financier.activation)
  const actionLabel =
    action === 'deactivate'
      ? t('partners.financiers.actions.deactivate')
      : t('partners.financiers.actions.reactivate')
  const errorTag = props.saveCommand.errorTag ?? props.statusCommand.errorTag

  return (
    <div className={screen}>
      <div className={page}>
        <div className={scrollArea}>
          <div className={content}>
            <DetailHead title={financier.name} subtitle={financier.corporateName} onBack={props.onBack} />

            {errorTag !== null ? (
              <div className={errorBanner} role="alert">
                {t(errorTag)}
              </div>
            ) : null}

            <FinancierDetailContent controller={c} editing={editing} activation={financier.activation} />
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
                    c.reset(detailToFormValues(financier))
                    props.onCancel()
                  }}
                >
                  {t('partners.financiers.form.cancel')}
                </button>
                <button
                  type="button"
                  className={btnPrimary}
                  disabled={props.saveCommand.running}
                  onClick={() => {
                    c.submit()
                  }}
                >
                  {props.saveCommand.running
                    ? t('partners.financiers.form.saving')
                    : t('partners.financiers.form.save')}
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
                      {t('partners.financiers.actions.edit')}
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
        running={props.statusCommand.running}
        onConfirm={() => {
          props.statusCommand.execute(financier.id, action)
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
