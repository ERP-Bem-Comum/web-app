import { useState, type ReactNode } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { PageHeader } from '#shared/ui/index.ts'

import { useSupplierCreateBinding } from '../supplier-create.binding.ts'
import { useSupplierFormController, type SupplierFormValues } from '../components/supplier-form.controller.ts'
import { SupplierForm } from '../components/supplier-form.component.tsx'
import { PartnersConfirmDialog } from '#modules/partners/client/shared/partners-confirm-dialog.component.tsx'
import { screen } from './supplier-create.css.ts'

const t = createTranslator(ptBR)

export function SupplierCreatePage(): ReactNode {
  const navigate = useNavigate()
  const router = useRouter()
  // Banco/PIX (payment target) é editável por `supplier:write` no core-api (supplier-plugin.ts) e é
  // OBRIGATÓRIO (invariante "≥1 payment target" → CHECK no MySQL): sem banco nem PIX o create dá 422
  // ("Há campos inválidos"). Por isso liberamos as seções para quem tem ESCRITA (canWrite), não só
  // `supplier:edit-sensitive` (que no backend só protege o campo VITAL, o CNPJ, e só na edição).
  const { createCommand, canWrite, categories } = useSupplierCreateBinding()
  const [pending, setPending] = useState<SupplierFormValues | null>(null)
  const controller = useSupplierFormController({
    onSubmit: (values) => { setPending(values) },
  })

  return (
    <div className={screen}>
      <PageHeader
        title={t('partners.suppliers.create.title')}
        onBack={() => { router.history.back(); }}
        backLabel={t('common.back')}
      />
      <SupplierForm
        controller={controller}
        categories={categories}
        canEditSensitive={canWrite}
        running={createCommand.running}
        errorTag={createCommand.errorTag}
        onCancel={() => void navigate({ to: '/parceiros/fornecedores' })}
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
