import { useState, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { ChevronLeftIcon } from '#shared/ui/icons/index.ts'
import {
  page,
  scrollArea,
  content,
  head,
  backBtn,
  headTitle,
  actionbar,
  actionbarInner,
  btnGhost,
  btnPrimary,
} from '#shared/ui/brand/brand-form.css.ts'

import { useProgramCreateBinding } from '../program-create.binding.ts'
import { useProgramFormController } from '../components/program-form.controller.ts'
import { ProgramForm } from '../components/program-form.component.tsx'
import { DiscardChangesModal } from '../components/discard-changes-modal.component.tsx'
import { errorBanner, screen } from './program-create.css.ts'

const t = createTranslator(ptBR)

export function ProgramCreatePage(): ReactNode {
  const navigate = useNavigate()
  const [discarding, setDiscarding] = useState(false)
  const { createCommand } = useProgramCreateBinding()
  const controller = useProgramFormController({
    onSubmit: (values) => {
      createCommand.execute(values)
    },
  })

  const goList = (): void => {
    void navigate({ to: '/programas' })
  }
  const tryLeave = (): void => {
    if (controller.isDirty) setDiscarding(true)
    else goList()
  }

  return (
    <div className={screen}>
      <div className={page}>
        <div className={scrollArea}>
          <div className={content}>
            <div className={head}>
              <button type="button" className={backBtn} onClick={tryLeave} aria-label={t('common.back')}>
                <ChevronLeftIcon size={18} />
              </button>
              <h1 className={headTitle}>{t('programs.create.title')}</h1>
            </div>

            <ProgramForm
              controller={controller}
              editing
              errorBanner={
                createCommand.errorTag !== null ? (
                  <div className={errorBanner} role="alert">
                    {t(createCommand.errorTag)}
                  </div>
                ) : undefined
              }
            />
          </div>
        </div>

        <div className={actionbar}>
          <div className={actionbarInner}>
            <button type="button" className={btnGhost} onClick={tryLeave}>
              {t('programs.form.cancel')}
            </button>
            <button
              type="button"
              className={btnPrimary}
              disabled={createCommand.running}
              onClick={() => {
                controller.submit()
              }}
            >
              {createCommand.running ? t('programs.form.saving') : t('programs.form.add')}
            </button>
          </div>
        </div>
      </div>

      <DiscardChangesModal
        open={discarding}
        onConfirm={() => {
          setDiscarding(false)
          goList()
        }}
        onCancel={() => {
          setDiscarding(false)
        }}
      />
    </div>
  )
}
