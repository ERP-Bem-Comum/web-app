import type { ReactNode } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { PageHeader } from '#shared/ui/index.ts'

import { useCollaboratorCreateBinding } from '../collaborator-create.binding.ts'
import { useCollaboratorFormController } from '../components/collaborator-form.controller.ts'
import { CollaboratorForm } from '../components/collaborator-form.component.tsx'
import { screen } from './collaborator-create.css.ts'

const t = createTranslator(ptBR)

export function CollaboratorCreatePage(): ReactNode {
  const navigate = useNavigate()
  const router = useRouter()
  const { createCommand } = useCollaboratorCreateBinding()
  const controller = useCollaboratorFormController({
    onSubmit: (values) => {
      createCommand.execute(values)
    },
  })

  return (
    <div className={screen}>
      <PageHeader
        title={t('partners.collaborators.create.title')}
        onBack={() => { router.history.back(); }}
        backLabel={t('common.back')}
      />
      <CollaboratorForm
        controller={controller}
        running={createCommand.running}
        errorTag={createCommand.errorTag}
        onCancel={() => void navigate({ to: '/parceiros/colaboradores' })}
      />
    </div>
  )
}
