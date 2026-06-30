import { useState, type ReactNode } from 'react'
import { useNavigate, useRouter, useSearch } from '@tanstack/react-router'

import { safeRedirect } from '#modules/auth/public-api/index.ts'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { PageHeader } from '#shared/ui/index.ts'

import { useCollaboratorCreateBinding } from '../collaborator-create.binding.ts'
import {
  useCollaboratorFormController,
  type CollaboratorFormValues,
} from '../components/collaborator-form.controller.ts'
import { CollaboratorForm } from '../components/collaborator-form.component.tsx'
import { PartnersConfirmDialog } from '#modules/partners/client/shared/partners-confirm-dialog.component.tsx'
import { PartnersSuccessDialog } from '#modules/partners/client/shared/partners-success-dialog.component.tsx'
import { screen } from './collaborator-create.css.ts'

const t = createTranslator(ptBR)

export function CollaboratorCreatePage(): ReactNode {
  const navigate = useNavigate()
  const router = useRouter()
  const search = useSearch({ strict: false })
  const { createCommand } = useCollaboratorCreateBinding()
  const [pending, setPending] = useState<CollaboratorFormValues | null>(null)
  // Modal de sucesso DERIVADO do comando (sem setState em efeito); `dismissed` fecha ao clicar "Entendi".
  const [dismissed, setDismissed] = useState(false)
  const controller = useCollaboratorFormController({
    onSubmit: (values) => {
      setPending(values)
    },
  })

  const successOpen = createCommand.succeeded && !dismissed

  const goToList = (): void => {
    void navigate({
      to: safeRedirect(
        typeof search.returnTo === 'string' ? search.returnTo : undefined,
        '/parceiros/colaboradores',
      ),
    })
  }

  return (
    <div className={screen}>
      <PageHeader
        title={t('partners.collaborators.create.title')}
        onBack={() => {
          router.history.back()
        }}
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
        onConfirm={() => {
          if (pending !== null) createCommand.execute(pending)
          setPending(null)
        }}
        onCancel={() => {
          setPending(null)
        }}
      />

      <PartnersSuccessDialog
        open={successOpen}
        title={t('partners.collaborators.create.success.title')}
        message={t('partners.collaborators.create.success.body')}
        okLabel={t('partners.collaborators.create.success.ok')}
        onConfirm={() => {
          setDismissed(true)
          goToList()
        }}
      />
    </div>
  )
}
