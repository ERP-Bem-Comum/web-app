/**
 * CollaboratorDetailPage — detalhe do colaborador (clique na linha da grid). Exibe o pré-cadastro e,
 * se o cadastro estiver completo, também a 2ª etapa. `Editar` habilita todos os campos na própria tela;
 * `Salvar` persiste (pré via update + completo via complete-registration). `Voltar` retorna.
 */
import { useState, type ReactNode } from 'react'
import { getRouteApi, useRouter } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Button, PageHeader } from '#shared/ui/index.ts'

import { useCollaboratorDetailBinding, type CollaboratorSaveCommand, type CollaboratorDetail } from '../collaborator-detail.binding.ts'
import { useCollaboratorDetailFormController } from '../components/collaborator-detail-form.controller.ts'
import { CollaboratorDetailContent } from '../components/collaborator-detail-content.component.tsx'
import { PartnersConfirmDialog } from '#modules/partners/client/shared/partners-confirm-dialog.component.tsx'
import { errorBanner, footer, saveWrap, screen, secondaryButton } from './collaborator-detail.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/parceiros/colaboradores/$id')

export function CollaboratorDetailPage(): ReactNode {
  const { id } = routeApi.useParams()
  const router = useRouter()
  const goBack = (): void => { router.history.back(); }
  const [editing, setEditing] = useState(false)
  const { state, saveCommand, canWrite } = useCollaboratorDetailBinding(id, () => { setEditing(false); })

  if (state.status === 'loading') {
    return (
      <div className={screen}>
        <PageHeader title={t('partners.collaborators.detail.title')} subtitle={t('partners.collaborators.list.loading')} onBack={goBack} backLabel={t('common.back')} />
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className={screen}>
        <PageHeader title={t('partners.collaborators.detail.title')} onBack={goBack} backLabel={t('common.back')} />
        <div className={errorBanner} role="alert">{t(state.errorTag)}</div>
      </div>
    )
  }

  return (
    <DetailReady
      key={state.collaborator.id}
      collaborator={state.collaborator}
      editing={editing}
      canWrite={canWrite}
      saveCommand={saveCommand}
      onEdit={() => { setEditing(true); }}
      onCancel={() => { setEditing(false); }}
      onBack={goBack}
    />
  )
}

type DetailReadyProps = Readonly<{
  collaborator: CollaboratorDetail
  editing: boolean
  canWrite: boolean
  saveCommand: CollaboratorSaveCommand
  onEdit: () => void
  onCancel: () => void
  onBack: () => void
}>

function DetailReady({ collaborator, editing, canWrite, saveCommand, onEdit, onCancel, onBack }: DetailReadyProps): ReactNode {
  const c = useCollaboratorDetailFormController(collaborator)
  const [confirmingEdit, setConfirmingEdit] = useState(false)
  // Em edição mostramos sempre as 2 seções (permite completar o cadastro); em leitura, a 2ª só se já completo.
  const showComplete = editing || collaborator.registration === 'complete'
  const preTitle = showComplete
    ? t('partners.collaborators.detail.section.prefilled')
    : t('partners.collaborators.form.section.basic')

  return (
    <div className={screen}>
      <PageHeader
        title={collaborator.name}
        subtitle={t(`partners.collaborators.registration.${collaborator.registration}`)}
        onBack={onBack}
        backLabel={t('common.back')}
      />

      {saveCommand.errorTag !== null ? (
        <div className={errorBanner} role="alert">{t(saveCommand.errorTag)}</div>
      ) : null}

      <CollaboratorDetailContent controller={c} editing={editing} showComplete={showComplete} preTitle={preTitle} />

      <div className={footer}>
        {editing ? (
          <>
            <button type="button" className={secondaryButton} onClick={() => { c.reset(collaborator); onCancel(); }}>
              {t('partners.collaborators.detail.cancel')}
            </button>
            <div className={saveWrap}>
              <Button
                onClick={() => { setConfirmingEdit(true) }}
                loading={saveCommand.running}
                loadingLabel={t('partners.collaborators.detail.saving')}
              >
                {t('partners.collaborators.detail.save')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <button type="button" className={secondaryButton} onClick={onBack}>{t('common.back')}</button>
            {canWrite ? (
              <div className={saveWrap}>
                <Button onClick={onEdit}>{t('partners.collaborators.actions.edit')}</Button>
              </div>
            ) : null}
          </>
        )}
      </div>

      <PartnersConfirmDialog
        open={confirmingEdit}
        title={t('partners.confirm.edit.title')}
        message={t('partners.confirm.edit.message')}
        confirmLabel={t('partners.confirm.confirm')}
        cancelLabel={t('partners.confirm.cancel')}
        running={saveCommand.running}
        onConfirm={() => {
          saveCommand.execute({
            id: collaborator.id,
            pre: c.buildPre(),
            complete: c.buildComplete(collaborator.id),
            includeComplete: c.hasCompleteData(),
          })
          setConfirmingEdit(false)
        }}
        onCancel={() => { setConfirmingEdit(false) }}
      />
    </div>
  )
}
