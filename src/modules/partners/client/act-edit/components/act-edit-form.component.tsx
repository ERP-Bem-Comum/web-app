import type { ReactNode } from 'react'

import {
  useActFormController,
  type ActFormValues,
} from '#modules/partners/client/act-create/components/act-form.controller.ts'
import { ActForm } from '#modules/partners/client/act-create/components/act-form.component.tsx'

export type ActEditFormProps = Readonly<{
  initial: ActFormValues
  running: boolean
  errorTag: string | null
  onSubmit: (values: ActFormValues) => void
  onCancel: () => void
}>

/**
 * Monta o formulário de edição já pré-preenchido. Isolado para que o `useActFormController` (que
 * captura `initial` na montagem) só rode quando os dados chegaram.
 */
export function ActEditForm(props: ActEditFormProps): ReactNode {
  const controller = useActFormController({ initial: props.initial, onSubmit: props.onSubmit })
  return (
    <ActForm
      controller={controller}
      running={props.running}
      errorTag={props.errorTag}
      onCancel={props.onCancel}
    />
  )
}
