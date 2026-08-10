import { useState, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { ChevronLeftIcon, FileTextIcon } from '#shared/ui/icons/index.ts'
import {
  page,
  scrollArea,
  content,
  head,
  backBtn,
  headText,
  headTitle,
  headSubtitle,
  sectionCard,
  sectionHeader,
  sectionIcon,
  sectionH2,
  sectionBody,
  actionbar,
  actionbarInner,
  btnGhost,
  btnPrimary,
} from '#shared/ui/brand/brand-form.css.ts'

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
import { errorBanner, screen } from './program-detail.css.ts'

const t = createTranslator(ptBR)

// Cabeçalho "brand": voltar + título/subtítulo (nome do programa).
function DetailHead({ subtitle, onBack }: { subtitle?: string; onBack: () => void }): ReactNode {
  return (
    <div className={head}>
      <button type="button" className={backBtn} onClick={onBack} aria-label={t('common.back')}>
        <ChevronLeftIcon size={18} />
      </button>
      <div className={headText}>
        <h1 className={headTitle}>{t('programs.detail.title')}</h1>
        {subtitle !== undefined ? <p className={headSubtitle}>{subtitle}</p> : null}
      </div>
    </div>
  )
}

export function ProgramDetailPage({ programId }: { programId: string }): ReactNode {
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const { state, saveCommand, canEdit, logo, logoUpload } = useProgramDetailBinding(programId, () => {
    setEditing(false)
  })

  const goBack = (): void => {
    void navigate({ to: '/programas' })
  }

  if (state.status === 'loading') {
    return (
      <div className={screen}>
        <div className={page}>
          <div className={scrollArea}>
            <div className={content}>
              <DetailHead onBack={goBack} />
              <p>{t('programs.list.loading')}</p>
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
              <DetailHead onBack={goBack} />
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
      onBack={goBack}
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
      <div className={page}>
        <div className={scrollArea}>
          <div className={content}>
            <DetailHead subtitle={program.name} onBack={props.onBack} />

            {/* Logo do Programa — card "brand" envolvendo o uploader (componente inalterado). */}
            <section className={sectionCard}>
              <div className={sectionHeader}>
                <span className={sectionIcon}>
                  <FileTextIcon size={17} />
                </span>
                <h2 className={sectionH2}>{t('programs.form.logo')}</h2>
              </div>
              <div className={sectionBody}>
                <ProgramLogoUploader
                  url={props.logo.url}
                  name={program.name}
                  canEdit={props.canEdit}
                  running={props.logoUpload.running}
                  errorTag={props.logoUpload.errorTag}
                  onUpload={props.logoUpload.execute}
                />
              </div>
            </section>

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
          </div>
        </div>

        <div className={actionbar}>
          <div className={actionbarInner}>
            {editing ? (
              <>
                <button type="button" className={btnGhost} onClick={cancelEdit}>
                  {t('programs.form.cancel')}
                </button>
                <button
                  type="button"
                  className={btnPrimary}
                  disabled={props.saveCommand.running}
                  onClick={() => {
                    c.submit()
                  }}
                >
                  {props.saveCommand.running ? t('programs.detail.saving') : t('programs.detail.save')}
                </button>
              </>
            ) : (
              <>
                <button type="button" className={btnGhost} onClick={props.onBack}>
                  {t('programs.detail.back')}
                </button>
                {props.canEdit ? (
                  <button type="button" className={btnPrimary} onClick={props.onEnterEdit}>
                    {t('programs.detail.edit')}
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>
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
