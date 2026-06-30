import type { ReactNode } from 'react'

import {
  useSupplierFormController,
  type SupplierFormValues,
} from '#modules/partners/client/supplier-create/components/supplier-form.controller.ts'
import { SupplierForm } from '#modules/partners/client/supplier-create/components/supplier-form.component.tsx'

export type SupplierEditFormProps = Readonly<{
  initial: SupplierFormValues
  categories: readonly string[]
  canEditSensitive: boolean
  cnpjDisabled: boolean
  running: boolean
  errorTag: string | null
  onSubmit: (values: SupplierFormValues) => void
  onCancel: () => void
}>

/**
 * Monta o formulário de edição já pré-preenchido. Isolado em um componente para que o
 * `useSupplierFormController` (que captura `initial` na montagem) só rode quando os dados chegaram.
 */
export function SupplierEditForm(props: SupplierEditFormProps): ReactNode {
  const controller = useSupplierFormController({ initial: props.initial, onSubmit: props.onSubmit })
  return (
    <SupplierForm
      controller={controller}
      categories={props.categories}
      canEditSensitive={props.canEditSensitive}
      cnpjDisabled={props.cnpjDisabled}
      running={props.running}
      errorTag={props.errorTag}
      onCancel={props.onCancel}
    />
  )
}
