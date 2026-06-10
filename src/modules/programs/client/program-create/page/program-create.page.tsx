import { useState, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Button } from '#shared/ui/index.ts'

import { useProgramCreateBinding } from '../program-create.binding.ts'
import { useProgramFormController } from '../components/program-form.controller.ts'
import { ProgramForm } from '../components/program-form.component.tsx'
import { DiscardChangesModal } from '../components/discard-changes-modal.component.tsx'
import {
  backButton,
  cancelButton,
  errorBanner,
  footer,
  headerRow,
  headerTitle,
  saveWrap,
  screen,
} from './program-create.css.ts'

const t = createTranslator(ptBR)

function BackIcon(): ReactNode {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
}

export function ProgramCreatePage(): ReactNode {
  const navigate = useNavigate()
  const [discarding, setDiscarding] = useState(false)
  const { createCommand } = useProgramCreateBinding()
  const controller = useProgramFormController({
    onSubmit: (values) => { createCommand.execute(values) },
  })

  const goList = (): void => { void navigate({ to: '/programas' }) }
  const tryLeave = (): void => {
    if (controller.isDirty) setDiscarding(true)
    else goList()
  }

  return (
    <div className={screen}>
      <div className={headerRow}>
        <button type="button" className={backButton} onClick={tryLeave} aria-label={t('common.back')}>
          <BackIcon />
        </button>
        <h1 className={headerTitle}>{t('programs.create.title')}</h1>
      </div>

      <ProgramForm
        controller={controller}
        editing
        errorBanner={createCommand.errorTag !== null ? <div className={errorBanner} role="alert">{t(createCommand.errorTag)}</div> : undefined}
      />

      <div className={footer}>
        <button type="button" className={cancelButton} onClick={tryLeave}>{t('programs.form.cancel')}</button>
        <div className={saveWrap}>
          <Button onClick={() => { controller.submit() }} loading={createCommand.running} loadingLabel={t('programs.form.saving')}>
            {t('programs.form.add')}
          </Button>
        </div>
      </div>

      <DiscardChangesModal
        open={discarding}
        onConfirm={() => { setDiscarding(false); goList() }}
        onCancel={() => { setDiscarding(false) }}
      />
    </div>
  )
}
