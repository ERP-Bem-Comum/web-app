import type { ReactNode } from 'react'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { useContractCreateBinding } from '../contract-create.binding.ts'
import { useContractFormController } from '../components/contract-form.controller.ts'
import { ContractForm } from '../components/contract-form.component.tsx'
import { screen } from './contract-create.css.ts'

const t = createTranslator(ptBR)

export function ContractCreatePage(): ReactNode {
  const { createCommand } = useContractCreateBinding()
  const form = useContractFormController(createCommand.execute)

  return (
    <div className={screen}>
      <h1>{t('contracts.create.title')}</h1>
      <p>{t('contracts.create.subtitle')}</p>
      <ContractForm
        state={form.state}
        onUpdate={form.update}
        onSubmit={form.submit}
        submitting={createCommand.running}
        errorText={createCommand.errorTag === null ? null : t(createCommand.errorTag)}
      />
      {createCommand.result && (
        <div role="dialog">
          <h2>{t('contracts.create.modal.title')}</h2>
          <p>{t('contracts.create.modal.subtitle').replace('{{code}}', createCommand.result.sequentialNumber)}</p>
          <a href={`/contratos/${createCommand.result.id}`}>{t('contracts.create.modal.button')}</a>
        </div>
      )}
    </div>
  )
}
