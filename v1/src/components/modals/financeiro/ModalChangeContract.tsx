import { OutlineButton } from '@/components/layout/Buttons/OutlineButton'
import { ContractForAccounts } from '@/types/contracts'
import { mountBudgetPlanName, mountPeriod } from '@/utils/UI/contracts'
import { maskMonetaryValue } from '@/utils/masks'
import { ModalPreviewBase } from '../ModalPreviewBase'

interface ModalChangeContractProps {
  contracts?: ContractForAccounts[]
  setContractCallback: (contract: ContractForAccounts) => void
  currentContractId: number | undefined
  open: boolean
  onClose: () => void
}

export function ModalChangeContract({
  contracts,
  setContractCallback,
  open,
  onClose,
  currentContractId,
}: ModalChangeContractProps) {
  const textInfo = (text: string, info: string | undefined) => {
    return (
      <p className="flex gap-1">
        <span className="text-black">{text}:</span> {info}
      </p>
    )
  }

  return (
    <ModalPreviewBase handleOnClose={onClose} open={open} title={`Contratos disponíveis:`}>
      {contracts && (
        <div className="flex flex-col overflow-y-scroll w-full">
          {contracts.map((contract) => {
            return (
              <div
                key={'contrato' + contract.id}
                className="p-2 cursor-pointer hover:bg-[#BFEDFC] rounded border-y mt-3"
                style={{
                  backgroundColor: contract.id === currentContractId ? '#BFEDFC' : '',
                }}
                onClick={() => {
                  setContractCallback(contract)
                  onClose()
                }}
              >
                {textInfo('Código número', contract.contractCode)}
                {textInfo('Vigência', mountPeriod(contract))}
                {textInfo('Valor', maskMonetaryValue(contract.totalValue))}
                {textInfo(
                  'Plano orçamentário',
                  mountBudgetPlanName(contract?.program, contract?.budgetPlan),
                )}
                {contract.collaborator && textInfo('Colaborador', contract.collaborator.name)}
                {contract.financier && textInfo('Financiador', contract.financier.name)}
                {contract.supplier && textInfo('Fornecedor', contract.supplier.name)}
              </div>
            )
          })}
        </div>
      )}
      {!contracts && <p>Nenhum contrato encontrado</p>}

      <OutlineButton disabled={false} label="Fechar" onClick={onClose} />
    </ModalPreviewBase>
  )
}
