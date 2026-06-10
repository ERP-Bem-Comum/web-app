import { useState, type ReactNode } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { PageHeader } from '#shared/ui/index.ts'

import { useCollaboratorCreateBinding } from '../collaborator-create.binding.ts'
import { useCollaboratorFormController, type CollaboratorFormValues } from '../components/collaborator-form.controller.ts'
import { CollaboratorForm } from '../components/collaborator-form.component.tsx'
import { PartnersConfirmDialog } from '#modules/partners/client/shared/partners-confirm-dialog.component.tsx'
import { screen } from './collaborator-create.css.ts'

const t = createTranslator(ptBR)

export function CollaboratorCreatePage(): ReactNode {
  const navigate = useNavigate()
  const router = useRouter()
  const { createCommand } = useCollaboratorCreateBinding()
  const [pending, setPending] = useState<CollaboratorFormValues | null>(null)
  const controller = useCollaboratorFormController({
    onSubmit: (values) => { setPending(values) },
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
