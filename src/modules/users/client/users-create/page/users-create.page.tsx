import { useState, type ReactNode } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { PageHeader } from '#shared/ui/index.ts'

import { useUsersCreateBinding } from '../users-create.binding.ts'
import { useUserFormController, type UserFormValues } from '../components/user-form.controller.ts'
import { UserForm } from '../components/user-form.component.tsx'
import { ConfirmDialog } from '../components/confirm-dialog.component.tsx'
import { screen } from './users-create.css.ts'

const t = createTranslator(ptBR)

export function UsersCreatePage(): ReactNode {
  const navigate = useNavigate()
  const router = useRouter()
  const { createCommand } = useUsersCreateBinding()
  // Valores válidos aguardando confirmação no modal (submit valida → abre o modal → confirma → cria).
  const [pending, setPending] = useState<UserFormValues | null>(null)
  const controller = useUserFormController({
    onSubmit: (values) => { setPending(values); },
  })

  return (
    <div className={screen}>
      <PageHeader
        title={t('users.create.title')}
        subtitle={t('users.create.subtitle')}
        onBack={() => { router.history.back(); }}
        backLabel={t('common.back')}
      />
      <UserForm
        controller={controller}
        running={createCommand.running}
        errorTag={createCommand.errorTag}
        onCancel={() => void navigate({ to: '/usuarios' })}
      />

      <ConfirmDialog
        open={pending !== null}
        title={t('users.create.confirm.title')}
        message={
          pending !== null
            ? t('users.create.confirm.message').replace('{name}', pending.name)
            : ''
        }
        confirmLabel={t('users.form.save')}
        cancelLabel={t('users.form.cancel')}
        running={createCommand.running}
        onConfirm={() => {
          if (pending !== null) createCommand.execute(pending)
          setPending(null)
        }}
        onCancel={() => { setPending(null); }}
      />
    </div>
  )
}
