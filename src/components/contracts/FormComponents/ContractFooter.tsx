import { GhostButton } from '@/components/layout/Buttons/GhostButton'
import { SubmitButton } from '@/components/layout/Buttons/SubmitButton'
import { ContractStatus } from '@/enums/contracts'

interface ContractsFooterProps {
  isDisabled: boolean
  create: boolean
  isAditive: boolean
  contractStatus?: ContractStatus
  setShowModalQuestion: (data: boolean) => void
  setShowModalAlert: (data: boolean) => void
  onSubmit: () => void
}

export const ContractFooter = ({
  isDisabled,
  create,
  isAditive,
  contractStatus,
  setShowModalAlert,
  setShowModalQuestion,
  onSubmit,
}: ContractsFooterProps) => {
  return (
    <div className="flex justify-end w-full">
      {!create && contractStatus === ContractStatus.PENDING && (
        <GhostButton
          disabled={isDisabled}
          label="Excluir"
          onClick={() => setShowModalAlert(true)}
        />
      )}
      <GhostButton
        disabled={isDisabled}
        label="Descartar"
        onClick={() => setShowModalQuestion(true)}
      />
      <SubmitButton
        disabled={isDisabled}
        edit={!create}
        createLabel={isAditive ? 'Criar Aditivo' : 'Criar Contrato'}
        editLabel={isAditive ? 'Editar Aditivo' : 'Editar Contrato'}
        onClick={onSubmit}
      />
    </div>
  )
}
