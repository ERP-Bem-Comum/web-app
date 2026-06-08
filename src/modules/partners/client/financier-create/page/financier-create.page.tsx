import type { ReactNode } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { PageHeader } from '#shared/ui/index.ts'

import { useFinancierCreateBinding } from '../financier-create.binding.ts'
import { useFinancierFormController } from '../components/financier-form.controller.ts'
import { FinancierForm } from '../components/financier-form.component.tsx'
import { screen } from './financier-create.css.ts'

const t = createTranslator(ptBR)

export function FinancierCreatePage(): ReactNode {
  const navigate = useNavigate()
  const router = useRouter()
  const { createCommand } = useFinancierCreateBinding()
  const controller = useFinancierFormController({
    onSubmit: (values) => {
      createCommand.execute(values)
    },
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
    </div>
  )
}
