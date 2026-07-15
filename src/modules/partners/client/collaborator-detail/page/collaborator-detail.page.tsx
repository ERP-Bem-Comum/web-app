/**
 * CollaboratorDetailPage — detalhe do colaborador (clique na linha da grid). Exibe o pré-cadastro e,
 * se o cadastro estiver completo, também a 2ª etapa. `Editar` habilita todos os campos na própria tela;
 * `Salvar` persiste (pré via update + completo via complete-registration). `Voltar` retorna.
 * Visual: identidade "brand" de formulário (`brand-form.css.ts`) — mesma da tela Novo Colaborador.
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
  headActions,
  actionbar,
  actionbarInner,
  btnGhost,
  btnPrimary,
} from '#shared/ui/brand/brand-form.css.ts'

import {
  useCollaboratorDetailBinding,
  type CollaboratorSaveCommand,
  type CollaboratorExportHistoryCommand,
  type CollaboratorDetail,
} from '../collaborator-detail.binding.ts'
import { useCollaboratorDetailFormController } from '../components/collaborator-detail-form.controller.ts'
import { CollaboratorDetailContent } from '../components/collaborator-detail-content.component.tsx'
import { PartnersConfirmDialog } from '#modules/partners/client/shared/partners-confirm-dialog.component.tsx'
import { downloadCsvFile } from '#modules/partners/client/shared/download-file.ts'
import { errorBanner, screen } from './collaborator-detail.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/parceiros/colaboradores/$id')

export function CollaboratorDetailPage(): ReactNode {
  const { id } = routeApi.useParams()
  const router = useRouter()
  const goBack = (): void => {
    router.history.back()
  }
  const [editing, setEditing] = useState(false)
  const { state, saveCommand, exportHistoryCommand, canWrite } = useCollaboratorDetailBinding(
    id,
    () => {
      setEditing(false)
    },
    (file) => {
      downloadCsvFile(file.filename, file.csv)
    },
  )

  if (state.status === 'loading') {
    return (
      <div className={screen}>
        <div className={page}>
          <div className={scrollArea}>
            <div className={content}>
              <DetailHead
                title={t('partners.collaborators.detail.title')}
                subtitle={t('partners.collaborators.list.loading')}
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
              <DetailHead title={t('partners.collaborators.detail.title')} onBack={goBack} />
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
      key={state.collaborator.id}
      collaborator={state.collaborator}
      editing={editing}
      canWrite={canWrite}
      saveCommand={saveCommand}
      exportHistoryCommand={exportHistoryCommand}
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

// Cabeçalho "brand": voltar + título/subtítulo + ações opcionais (ex.: Exportar histórico).
function DetailHead({
  title,
  subtitle,
  onBack,
  actions,
}: {
  title: string
  subtitle?: string
  onBack: () => void
  actions?: ReactNode
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
      {actions !== undefined ? <div className={headActions}>{actions}</div> : null}
    </div>
  )
}

type DetailReadyProps = Readonly<{
  collaborator: CollaboratorDetail
  editing: boolean
  canWrite: boolean
  saveCommand: CollaboratorSaveCommand
  exportHistoryCommand: CollaboratorExportHistoryCommand
  onEdit: () => void
  onCancel: () => void
  onBack: () => void
}>

function DetailReady({
  collaborator,
  editing,
  canWrite,
  saveCommand,
  exportHistoryCommand,
  onEdit,
  onCancel,
  onBack,
}: DetailReadyProps): ReactNode {
  const c = useCollaboratorDetailFormController(collaborator)
  const [confirmingEdit, setConfirmingEdit] = useState(false)
  // Em edição mostramos sempre as 2 seções (permite completar o cadastro); em leitura, a 2ª só se já completo.
  const showComplete = editing || collaborator.registration === 'complete'
  const preTitle = showComplete
    ? t('partners.collaborators.detail.section.prefilled')
    : t('partners.collaborators.form.section.basic')

  return (
    <div className={screen}>
      <div className={page}>
        <div className={scrollArea}>
          <div className={content}>
            <DetailHead
              title={collaborator.name}
              subtitle={t(`partners.collaborators.registration.${collaborator.registration}`)}
              onBack={onBack}
              actions={
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => {
                    exportHistoryCommand.execute()
                  }}
                  disabled={exportHistoryCommand.running}
                  aria-busy={exportHistoryCommand.running || undefined}
                >
                  {exportHistoryCommand.running
                    ? t('partners.collaborators.detail.exportHistory.loading')
                    : t('partners.collaborators.detail.exportHistory')}
                </button>
              }
            />

            {exportHistoryCommand.errorTag !== null ? (
              <div className={errorBanner} role="alert">
                {t(exportHistoryCommand.errorTag)}
              </div>
            ) : null}

            {saveCommand.errorTag !== null ? (
              <div className={errorBanner} role="alert">
                {t(saveCommand.errorTag)}
              </div>
            ) : null}

            <CollaboratorDetailContent
              controller={c}
              editing={editing}
              showComplete={showComplete}
              preTitle={preTitle}
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
                    c.reset(collaborator)
                    onCancel()
                  }}
                >
                  {t('partners.collaborators.detail.cancel')}
                </button>
                <button
                  type="button"
                  className={btnPrimary}
                  disabled={saveCommand.running}
                  onClick={() => {
                    setConfirmingEdit(true)
                  }}
                >
                  {saveCommand.running
                    ? t('partners.collaborators.detail.saving')
                    : t('partners.collaborators.detail.save')}
                </button>
              </>
            ) : (
              <>
                <button type="button" className={btnGhost} onClick={onBack}>
                  {t('common.back')}
                </button>
                {canWrite ? (
                  <button type="button" className={btnPrimary} onClick={onEdit}>
                    {t('partners.collaborators.actions.edit')}
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>
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
            // `completeRegistration` é 1x só (o domínio rejeita já-completo → 'collaborator-already-complete'
            // → conflito "Já existe um registro"). Num colaborador JÁ cadastrado, só o `update` (cadastrais)
            // roda; os pessoais (data de nascimento etc.) dependem de o backend expor edição pós-cadastro.
            includeComplete: c.hasCompleteData() && collaborator.registration !== 'complete',
          })
          setConfirmingEdit(false)
        }}
        onCancel={() => {
          setConfirmingEdit(false)
        }}
      />
    </div>
  )
}
