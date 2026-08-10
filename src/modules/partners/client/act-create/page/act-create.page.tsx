import { useState, type ReactNode } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import { useActCreateBinding } from '../act-create.binding.ts'
import { useActFormController, type ActFormValues } from '../components/act-form.controller.ts'
import { ActForm } from '../components/act-form.component.tsx'
import { PartnersConfirmDialog } from '#modules/partners/client/shared/partners-confirm-dialog.component.tsx'
import { screen } from './act-create.css.ts'

const t = createTranslator(ptBR)

export function ActCreatePage(): ReactNode {
  const navigate = useNavigate()
  const router = useRouter()
  const { createCommand } = useActCreateBinding()
  const [pending, setPending] = useState<ActFormValues | null>(null)
  const controller = useActFormController({
    onSubmit: (values) => {
      setPending(values)
    },
  })

  return (
    <div className={screen}>
      <ActForm
        controller={controller}
        running={createCommand.running}
        errorTag={createCommand.errorTag}
        onCancel={() => void navigate({ to: '/parceiros/atos' })}
        onBack={() => {
          router.history.back()
        }}
      />

      <PartnersConfirmDialog
        open={pending !== null}
        title={t('partners.confirm.create.title')}
        message={t('partners.confirm.create.message')}
        confirmLabel={t('partners.confirm.confirm')}
        cancelLabel={t('partners.confirm.cancel')}
        running={createCommand.running}
        onConfirm={() => {
          if (pending !== null) createCommand.execute(pending)
          setPending(null)
        }}
        onCancel={() => {
          setPending(null)
        }}
      />
    </div>
  )
}
