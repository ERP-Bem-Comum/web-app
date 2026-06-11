import { useState, type ReactNode } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { PageHeader } from '#shared/ui/index.ts'

import { useFinancierCreateBinding } from '../financier-create.binding.ts'
import { useFinancierFormController, type FinancierFormValues } from '../components/financier-form.controller.ts'
import { FinancierForm } from '../components/financier-form.component.tsx'
import { PartnersConfirmDialog } from '#modules/partners/client/shared/partners-confirm-dialog.component.tsx'
import { screen } from './financier-create.css.ts'

const t = createTranslator(ptBR)

export function FinancierCreatePage(): ReactNode {
  const navigate = useNavigate()
  const router = useRouter()
  const { createCommand } = useFinancierCreateBinding()
  const [pending, setPending] = useState<FinancierFormValues | null>(null)
  const controller = useFinancierFormController({
    onSubmit: (values) => { setPending(values) },
  })

  return (
    <div className={screen}>
      <PageHeader
        title={t('partners.financiers.create.title')}
        onBack={() => { router.history.back(); }}
        backLabel={t('common.back')}
      />
      <FinancierForm
        controller={controller}
        running={createCommand.running}
        errorTag={createCommand.errorTag}
        onCancel={() => void navigate({ to: '/parceiros/financiadores' })}
      />

      <PartnersConfirmDialog
        open={pending !== null}
        title={t('partners.confirm.create.title')}
        message={t('partners.confirm.create.message')}
        confirmLabel={t('partners.confirm.confirm')}
        cancelLabel={t('partners.confirm.cancel')}
        running={createCommand.running}
        onConfirm={() => { if (pending !== null) createCommand.execute(pending); setPending(null) }}
        onCancel={() => { setPending(null) }}
      />
    </div>
  )
}
