import { TransactionCard } from '../TransactionCard'
import { Button } from '../../../ui/button'
import { Grid } from '@mui/material'
import { cn } from 'lib/utils'
import RadioButtons from './ReconciliationRadioButtons'
import { FilterDateType, TransactionCardProps } from '@/types/reconciliation'
import { useOptions } from '@/hooks/useOptions'
import { Options } from '@/types/global'
import { useEffect, useState } from 'react'
import SearchModal from '@/components/modals/bank-account/searchModal'
import { useDisclosure } from '@/hooks/useDisclosure'
import { useReconciliation } from '@/hooks/useReconciliation'
import { BankReconciliationType } from '@/enums/reconciliation'
import { ModalConfirm } from '@/components/modals/ModalConfirm'
import { ReconciliationButtons } from './ReconciliationButton'
import { useForm } from 'react-hook-form'
import { AutoComplete } from '@/components/layout/AutoComplete'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import EditModal from '@/components/modals/bank-account/EditModal'

interface BankReconciliationRowProps {
  extract: TransactionCardProps
  defaultSystem?: TransactionCardProps
  period: FilterDateType['period']
  transferedById?: number
  type: BankReconciliationType
  reconciled: boolean
  index: number
  accountId: number
}

export function BankReconciliationRow({
  extract,
  period,
  defaultSystem,
  reconciled,
  transferedById,
  type,
  accountId,
  index,
}: BankReconciliationRowProps) {
  const { options } = useOptions()

  const [transactionType, setTransactionType] = useState<BankReconciliationType>(type)
  const [defaultAccount, setDefaultAccount] = useState<Options | undefined>()

  useEffect(() => {
    const account = options.Accounts()?.find((account) => account.id === transferedById)
    setDefaultAccount(account)
  }, [transferedById, options])

  const { control, watch } = useForm({
    resolver: zodResolver(
      z.object({
        account: z.string(),
      }),
    ),
  })

  const selectedApiAccount = watch('account')

  const [system, setSystem] = useState<TransactionCardProps | undefined>(defaultSystem)
  const {
    isOpen: isOpenSearchModal,
    onOpen: onOpenSearchModal,
    onClose: onCloseSearchModal,
  } = useDisclosure()

  const {
    isOpen: isOpenEditModal,
    onOpen: onOpenEditModal,
    onClose: onCloseEditModal,
  } = useDisclosure()

  const {
    mutateReconcile,
    mutateUnlink,
    isPendingUnlink,
    isPendingReconcile,
    errorMessage,
    clearErrorMessage,
  } = useReconciliation()

  const handleReconcile = () => {
    const params = {
      extract,
      appointmentId:
        transactionType === BankReconciliationType.TRANSACTION_ENTRY
          ? Number(system?.id)
          : Number(selectedApiAccount),
      type: transactionType,
      accountId,
      index,
      period,
      system,
    }
    mutateReconcile(params)
  }

  const handleUnlink = () => {
    if (defaultSystem?.id && reconciled) {
      const params = {
        id: defaultSystem.id,
        accountId,
        index,
        period,
      }
      mutateUnlink(params, { onSuccess: () => setSystem(undefined) })
    } else if (!reconciled) {
      setSystem(undefined)
    }
  }

  return (
    <Grid container columnSpacing={2}>
      <Grid item xs={5}>
        <TransactionCard
          {...extract}
          className={cn('w-full h-full', reconciled && 'reconciled-border')}
        />
      </Grid>
      <Grid item xs={2} flexGrow={1}>
        <ReconciliationButtons
          isReconciliating={isPendingReconcile}
          isUnlinking={isPendingUnlink}
          isDisabled={
            !reconciled &&
            (transactionType === BankReconciliationType.TRANSACTION_ENTRY ||
            transactionType === BankReconciliationType.TAX ||
            transactionType === BankReconciliationType.PROFIT
              ? !system
              : !selectedApiAccount)
          }
          onUnlink={handleUnlink}
          onReconciliate={handleReconcile}
          reconciled={reconciled}
        />
      </Grid>

      <Grid item xs={5}>
        {system && transactionType !== BankReconciliationType.TRANSFER ? (
          <TransactionCard
            {...system}
            className={cn('w-full h-full', reconciled && 'reconciled-border')}
          />
        ) : (
          <div
            className={cn(
              'flex flex-col justify-center w-full p-5 h-full',
              'border rounded-lg',
              reconciled ? 'border-erp-positive' : 'border-transparent',
            )}
          >
            <RadioButtons
              id={extract.documentNumber}
              amount={extract.amount}
              disabled={reconciled}
              radio={transactionType}
              setRadio={setTransactionType}
            />
            {transactionType === BankReconciliationType.TRANSACTION_ENTRY && (
              <div className="border-dashed border-[#576B71] border rounded-lg py-[31px] flex justify-center bg-[#EBF9FE]">
                <Button variant="erpSecondary" onClick={onOpenSearchModal}>
                  Buscar
                </Button>
              </div>
            )}

            {transactionType === BankReconciliationType.TRANSFER && (
              <AutoComplete
                label="Conta API"
                control={control}
                name="account"
                options={options.Accounts() ?? []}
                defaultValue={defaultAccount}
                editable={!reconciled && transactionType === BankReconciliationType.TRANSFER}
              />
            )}

            {transactionType === BankReconciliationType.TAX && (
              <div className="border-dashed border-[#576B71] border rounded-lg py-[31px] flex justify-center bg-[#EBF9FE]">
                <Button variant="erpSecondary" onClick={onOpenEditModal}>
                  Adicionar/Editar Taxa
                </Button>
              </div>
            )}

            {transactionType === BankReconciliationType.PROFIT && (
              <div className="border-dashed border-[#576B71] border rounded-lg py-[31px] flex justify-center bg-[#EBF9FE]">
                <Button variant="erpSecondary" onClick={onOpenEditModal}>
                  Adicionar/Editar Lucro
                </Button>
              </div>
            )}
          </div>
        )}
      </Grid>
      <SearchModal
        isOpen={isOpenSearchModal}
        onClose={onCloseSearchModal}
        dueBetween={period}
        accountId={accountId}
        rowCallBack={(data) => {
          setSystem({
            amount: data.value,
            date: data.dueDate,
            description: data.aditionalDescription,
            documentNumber: data.identification,
            title: data.identification,
            id: data.id,
          })
        }}
      />

      <EditModal
        defaultValues={{
          accountId,
          documentNumber: extract.documentNumber,
          transactionAmount: extract.amount,
          fullTransactionDescription: extract.description,
          transactionDate: new Date(extract.date),
        }}
        isOpen={isOpenEditModal}
        onClose={onCloseEditModal}
        transactionType={transactionType}
        rowCallBack={(data) => {
          setSystem({
            amount: data.transactionAmount,
            date: data.transactionDate,
            description: data.fullTransactionDescription,
            documentNumber: data.documentNumber,
            title: data.documentNumber,
            id: system?.id,
            categorization: data.categorization,
          })
        }}
      />
      <ModalConfirm
        open={!!errorMessage}
        onClose={clearErrorMessage}
        text={errorMessage ?? ''}
        success={false}
      />
    </Grid>
  )
}
