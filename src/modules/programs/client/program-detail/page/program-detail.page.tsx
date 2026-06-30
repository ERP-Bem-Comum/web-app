import { useState, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Button } from '#shared/ui/index.ts'

import { useProgramFormController } from '#modules/programs/client/program-create/components/program-form.controller.ts'
import { ProgramForm } from '#modules/programs/client/program-create/components/program-form.component.tsx'
import { DiscardChangesModal } from '#modules/programs/client/program-create/components/discard-changes-modal.component.tsx'

import { useProgramDetailBinding, type ProgramSaveCommand } from '../program-detail.binding.ts'
import { ProgramLogoUploader } from '#modules/programs/client/program-logo/program-logo-uploader.component.tsx'
import type {
  ProgramLogoView,
  ProgramLogoUploadCommand,
} from '#modules/programs/client/program-logo/program-logo.binding.ts'
import { detailToFormValues, type ProgramDetail } from '../program-detail.view-model.ts'
import {
  backButton,
  errorBanner,
  footer,
  headerRow,
  headerTitle,
  outlineButton,
  saveWrap,
  screen,
} from './program-detail.css.ts'

const t = createTranslator(ptBR)

function BackIcon(): ReactNode {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

export function ProgramDetailPage({ programId }: { programId: string }): ReactNode {
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const { state, saveCommand, canEdit, logo, logoUpload } = useProgramDetailBinding(programId, () => {
    setEditing(false)
  })

  const header = (subtitle?: string): ReactNode => (
    <div className={headerRow}>
      <button
        type="button"
        className={backButton}
        onClick={() => {
          void navigate({ to: '/programas' })
        }}
        aria-label={t('common.back')}
      >
        <BackIcon />
      </button>
      <h1 className={headerTitle}>
        {t('programs.detail.title')}
        {subtitle !== undefined ? ` — ${subtitle}` : ''}
      </h1>
    </div>
  )

  if (state.status === 'loading') {
    return (
      <div className={screen}>
        {header()}
        <p>{t('programs.list.loading')}</p>
      </div>
    )
  }
  if (state.status === 'error') {
    return (
      <div className={screen}>
        {header()}
        <p>{t(state.errorTag)}</p>
      </div>
    )
  }

  return (
    <DetailReady
      key={state.program.id}
      program={state.program}
      editing={editing}
      canEdit={canEdit}
      saveCommand={saveCommand}
      logo={logo}
      logoUpload={logoUpload}
      onEnterEdit={() => {
        setEditing(true)
      }}
      onExitEdit={() => {
        setEditing(false)
      }}
      onBack={() => {
        void navigate({ to: '/programas' })
      }}
      header={header}
    />
  )
}

type DetailReadyProps = Readonly<{
  program: ProgramDetail
  editing: boolean
  canEdit: boolean
  saveCommand: ProgramSaveCommand
  logo: ProgramLogoView
  logoUpload: ProgramLogoUploadCommand
  onEnterEdit: () => void
  onExitEdit: () => void
  onBack: () => void
  header: (subtitle?: string) => ReactNode
}>

function DetailReady(props: DetailReadyProps): ReactNode {
  const { program, editing } = props
  const [discarding, setDiscarding] = useState(false)
  const c = useProgramFormController({
    initial: detailToFormValues(program),
    onSubmit: (values) => {
      props.saveCommand.execute(values, program.version)
    },
  })

  const cancelEdit = (): void => {
    if (c.isDirty) {
      setDiscarding(true)
      return
    }
    props.onExitEdit()
  }

  return (
    <div className={screen}>
      {props.header()}

      <ProgramLogoUploader
        url={props.logo.url}
        name={program.name}
        canEdit={props.canEdit}
        running={props.logoUpload.running}
        errorTag={props.logoUpload.errorTag}
        onUpload={props.logoUpload.execute}
      />

      <ProgramForm
        controller={c}
        editing={editing}
        errorBanner={
          props.saveCommand.errorTag !== null ? (
            <div className={errorBanner} role="alert">
              {t(props.saveCommand.errorTag)}
            </div>
          ) : undefined
        }
      />

      <div className={footer}>
        {editing ? (
          <>
            <button type="button" className={outlineButton} onClick={cancelEdit}>
              {t('programs.form.cancel')}
            </button>
            <div className={saveWrap}>
              <Button
                onClick={() => {
                  c.submit()
                }}
                loading={props.saveCommand.running}
                loadingLabel={t('programs.detail.saving')}
              >
                {t('programs.detail.save')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <button type="button" className={outlineButton} onClick={props.onBack}>
              {t('programs.detail.back')}
            </button>
            {props.canEdit ? (
              <div className={saveWrap}>
                <Button onClick={props.onEnterEdit}>{t('programs.detail.edit')}</Button>
              </div>
            ) : null}
          </>
        )}
      </div>

      <DiscardChangesModal
        open={discarding}
        onConfirm={() => {
          setDiscarding(false)
          c.reset(detailToFormValues(program))
          props.onExitEdit()
        }}
        onCancel={() => {
          setDiscarding(false)
        }}
      />
    </div>
  )
}
