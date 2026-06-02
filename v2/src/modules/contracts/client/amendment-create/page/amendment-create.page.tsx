import type { ReactNode } from 'react'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { useAmendmentCreateBinding } from '../amendment-create.binding.ts'
import { useAmendmentFormController } from '../components/amendment-form.controller.ts'
import { AmendmentForm } from '../components/amendment-form.component.tsx'
import { screen } from './amendment-create.css.ts'

const t = createTranslator(ptBR)

export function AmendmentCreatePage({ contractId }: { contractId: string }): ReactNode {
  const { createCommand } = useAmendmentCreateBinding()
  const form = useAmendmentFormController((input) => createCommand.execute(contractId, input))

  return (
    <div className={screen}>
      <h1>{t('contracts.amendment.title')}</h1>
      <span>{contractId}</span>
      <AmendmentForm
        state={form.state}
        onUpdate={form.update}
        onSubmit={form.submit}
        submitting={createCommand.running}
        errorText={createCommand.errorTag === null ? null : t(createCommand.errorTag)}
      />
    </div>
  )
}
