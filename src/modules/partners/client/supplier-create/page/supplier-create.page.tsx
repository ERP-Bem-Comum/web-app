import type { ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { PageHeader } from '#shared/ui/index.ts'

import { useSupplierCreateBinding } from '../supplier-create.binding.ts'
import { useSupplierFormController } from '../components/supplier-form.controller.ts'
import { SupplierForm } from '../components/supplier-form.component.tsx'
import { screen } from './supplier-create.css.ts'

const t = createTranslator(ptBR)

export function SupplierCreatePage(): ReactNode {
  const navigate = useNavigate()
  const { createCommand, canEditSensitive, categories } = useSupplierCreateBinding()
  const controller = useSupplierFormController({
    onSubmit: (values) => {
      createCommand.execute(values)
    },
  })

  return (
    <div className={screen}>
      <PageHeader title={t('partners.suppliers.create.title')} />
      <SupplierForm
        controller={controller}
        categories={categories}
        canEditSensitive={canEditSensitive}
        running={createCommand.running}
        errorTag={createCommand.errorTag}
        onCancel={() => void navigate({ to: '/parceiros/fornecedores' })}
      />
    </div>
  )
}
