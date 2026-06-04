import type { ReactNode } from 'react'
import { useState } from 'react'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { isOk } from '#shared/primitives/result.ts'
import { useContractDetailBinding } from '#modules/contracts/client/contract-detail/contract-detail.binding.ts'
import { useContractEditBinding } from '../contract-edit.binding.ts'
import { ContractEditForm } from '../components/contract-edit-form.component.tsx'
import { screen } from './contract-edit.css.ts'

const t = createTranslator(ptBR)

export function ContractEditPage({ contractId }: { contractId: string }): ReactNode {
  const { data: detailData } = useContractDetailBinding(contractId)
  const { editCommand } = useContractEditBinding()

  const contract = detailData && isOk(detailData) ? detailData.value : null

  const [email, setEmail] = useState(contract?.email ?? '')
  const [telephone, setTelephone] = useState(contract?.telephone ?? '')
  const [observations, setObservations] = useState(contract?.observations ?? '')

  const handleSubmit = () => {
    editCommand.execute({ id: contractId, email, telephone, observations })
  }

  if (!contract) return <div>{t('common.loading')}</div>

  return (
    <div className={screen}>
      <h1>{t('contracts.edit.title')}</h1>
      <p>{t('contracts.edit.subtitle')}</p>
      <ContractEditForm
        email={email}
        telephone={telephone}
        observations={observations}
        onEmailChange={setEmail}
        onTelephoneChange={setTelephone}
        onObservationsChange={setObservations}
        onSubmit={handleSubmit}
        submitting={editCommand.running}
        errorText={editCommand.errorTag === null ? null : t(editCommand.errorTag)}
      />
      {editCommand.result && <div role="alert">{t('contracts.edit.modal.title')}</div>}
    </div>
  )
}
