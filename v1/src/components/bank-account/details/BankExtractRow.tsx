import { Fragment } from 'react'
import { TransactionCard } from './TransactionCard'
import { cn } from 'lib/utils'
import { BankReconciliationType } from '@/enums/reconciliation'
import { TransactionCardProps } from '@/types/reconciliation'

interface BankExtractRowProps {
  extract: TransactionCardProps
  system?: TransactionCardProps
  reconciled?: boolean
  transferedById?: number
  type: BankReconciliationType
}

export function BankExtractRow({
  extract,
  reconciled = false,
  system,
  transferedById,
  type,
}: BankExtractRowProps) {
  return (
    <Fragment>
      <TransactionCard {...extract} />
      <SwitchBankReconciliation
        type={type}
        reconciled={reconciled}
        transferedById={transferedById}
        system={system}
      />
    </Fragment>
  )
}

interface SwitchBankReconciliationProps {
  type: BankReconciliationType
  transferedById?: number
  reconciled: boolean
  system?: TransactionCardProps
}

function SwitchBankReconciliation(props: SwitchBankReconciliationProps) {
  const { type, reconciled, system } = props
  switch (type) {
    case BankReconciliationType.TRANSACTION_ENTRY:
      return system ? (
        <TransactionCard className={cn('w-full', reconciled && 'reconciled-border')} {...system} />
      ) : (
        <div className="flex items-center justify-center p-5">
          <div className="border-dashed border-[#576B71] border rounded-lg py-[38px] px-[100px] bg-[#EBF9FE]">
            <p className="text-erp-baseDark text-base">Movimentação não conciliada</p>
          </div>
        </div>
      )
    case BankReconciliationType.TRANSFER:
      return (
        <div
          className={cn(
            'flex items-center justify-center p-5 w-full',
            reconciled && 'reconciled-border',
          )}
        >
          <div className="border-dashed border-[#576B71] border rounded-lg py-[38px] px-[100px] bg-[#EBF9FE]">
            {/* TODO: add nome da conta bancária */}
            <p className="text-erp-baseDark text-base">
              Conciliado por Bradesco {props.transferedById}
            </p>
          </div>
        </div>
      )
  }
}
