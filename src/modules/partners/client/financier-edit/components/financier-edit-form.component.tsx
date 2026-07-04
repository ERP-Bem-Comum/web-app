import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import {
  useFinancierFormController,
  type FinancierFormValues,
} from '#modules/partners/client/financier-create/components/financier-form.controller.ts'
import { FinancierForm } from '#modules/partners/client/financier-create/components/financier-form.component.tsx'

const t = createTranslator(ptBR)

export type FinancierEditFormProps = Readonly<{
  initial: FinancierFormValues
  running: boolean
  errorTag: string | null
  onSubmit: (values: FinancierFormValues) => void
  onCancel: () => void
  onBack: () => void
}>

/**
 * Monta o formulário de edição já pré-preenchido. Isolado em um componente para que o
 * `useFinancierFormController` (que captura `initial` na montagem) só rode quando os dados chegaram.
 */
export function FinancierEditForm(props: FinancierEditFormProps): ReactNode {
  const controller = useFinancierFormController({ initial: props.initial, onSubmit: props.onSubmit })
  return (
    <FinancierForm
      controller={controller}
      running={props.running}
      errorTag={props.errorTag}
      onCancel={props.onCancel}
      onBack={props.onBack}
      title={t('partners.financiers.edit.title')}
    />
  )
}
