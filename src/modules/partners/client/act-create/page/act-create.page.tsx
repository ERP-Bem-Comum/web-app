import type { ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { PageHeader } from '#shared/ui/index.ts'

import { useActCreateBinding } from '../act-create.binding.ts'
import { useActFormController } from '../components/act-form.controller.ts'
import { ActForm } from '../components/act-form.component.tsx'
import { screen } from './act-create.css.ts'

const t = createTranslator(ptBR)

export function ActCreatePage(): ReactNode {
  const navigate = useNavigate()
  const { createCommand } = useActCreateBinding()
  const controller = useActFormController({
    onSubmit: (values) => {
      createCommand.execute(values)
    },
  })

  return (
    <div className={screen}>
      <PageHeader title={t('partners.acts.create.title')} />
      <ActForm
        controller={controller}
        running={createCommand.running}
        errorTag={createCommand.errorTag}
        onCancel={() => void navigate({ to: '/parceiros/atos' })}
      />
    </div>
  )
}
