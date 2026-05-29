'use client'
import { useIsMounted } from '@/hooks/useIsMounted'
import { FilterDate } from '@/components/layout/FilterComponents/FilterDate'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as Tabs from '@radix-ui/react-tabs'
import { BankExtractRow } from './BankExtractRow'
import { BankReconciliationRow } from './Reconciliation/ReconciliationRow'
import { BankDetail, useGetBankDetails } from '@/services/bankDetails'
import { ModalEditAccountName } from './ModalEditAccountName'
import { maskMonetaryValue } from '@/utils/masks'
import { useDisclosure } from '@/hooks/useDisclosure'
import ContainerInfo from './Reconciliation/ReconciliationContainerInfo'
import ReconciliationSection from './Reconciliation/ReconciliationSection'
import ReconciliationDivider from './Reconciliation/ReconciliationDivider'
import { FilterDateType } from '@/types/reconciliation'
import { filterDateSchema } from '@/validators/reconciliation'
import { DetailsTab } from '../../layout/AccountDetails/DetailsTab'
import { DetailsTabContent } from '../../layout/AccountDetails/DetailsTabContent'
import { SubmitButton } from '@/components/layout/Buttons/SubmitButton'
import { TransactionCard } from './TransactionCard'
import { cn } from 'lib/utils'
import { useState } from 'react'
import { LoadingTable } from '@/components/table/loadingTable'
import { BankReconciliationType } from '@/enums/reconciliation'

interface BankAccountDetailsProps {
  accountId?: number
}

export default function BankAccountDetails({ accountId = 1 }: BankAccountDetailsProps) {
  useIsMounted()
  const [period, setPeriod] = useState<FilterDateType['period']>({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)), // mês anterior
    end: new Date(),
  })

  const {
    isOpen: isOpenRenameModal,
    onOpen: onOpenRenameModal,
    onClose: onCloseRenameModal,
  } = useDisclosure()

  const {
    control,
    formState: { errors },
    watch,
  } = useForm<FilterDateType>({
    resolver: zodResolver(filterDateSchema),
    defaultValues: {
      period,
    },
  })

  const values = watch()

  const { response, isLoading, isRefetching } = useGetBankDetails(accountId, period)

  const refetchBankDetails = () => {
    setPeriod(values.period)
  }

  if (isLoading) return <LoadingTable />

  if (response?.error) {
    return <div>{response.error}</div>
  }

  if (!response?.data) {
    return <div>Não foi possível carregar os dados da conta, por favor tente mais tarde.</div>
  }

  const { data } = response

  return (
    <div>
      <ReconciliationSection className="flex justify-around py-[30px]">
        <ContainerInfo>
          <h2 className="text-xl">{data.accountInfo.name}</h2>
          <span className="text-sm">Agência: {data.accountInfo.agency}</span>
          <br />
          <span className="text-sm">Conta: {data.accountInfo.account}</span>
        </ContainerInfo>
        <ReconciliationDivider />
        <ContainerInfo>
          <h3 className="text-sm font-bold">Saldo no banco:</h3>
          <span
            className={`${
              data.accountInfo.balance >= 0 ? 'text-erp-positive' : 'text-erp-negativeValue'
            } text-2xl`}
          >
            {maskMonetaryValue(data.accountInfo.balance)}
          </span>
          <br />
          <span className="text-sm">
            Atualizado em{' '}
            {new Intl.DateTimeFormat('pt-BR').format(new Date(data.accountInfo.updatedAt))}
          </span>
        </ContainerInfo>
        <ReconciliationDivider />

        <ContainerInfo>
          <h3 className="text-sm font-bold">Saldo no sistema:</h3>
          <span className="text-erp-positive text-2xl">
            {maskMonetaryValue(data.accountInfo.balanceSystem)}
          </span>
        </ContainerInfo>
        <ReconciliationDivider />

        <ContainerInfo className="flex gap-[22.86px] items-center">
          <FilterDate
            control={control}
            label="Período"
            field="period"
            error={errors.period?.message}
            width="260px"
            clearable={false}
          />
          <SubmitButton
            createLabel="Filtrar"
            edit={false}
            editLabel=""
            onClick={refetchBankDetails}
            disabled={isRefetching}
          />
          <SubmitButton
            createLabel="Editar Conta"
            edit={false}
            editLabel=""
            onClick={onOpenRenameModal}
          />
        </ContainerInfo>
      </ReconciliationSection>

      <Tabs.Root className="mt-10" defaultValue="tab1">
        <Tabs.List className="space-x-[10px] mb-0 pb-0">
          <DetailsTab name="Conciliação" value="tab1" />
          <DetailsTab name="Extrato" value="tab2" />
          <DetailsTab name="Lançamentos futuros" value="tab3" />
        </Tabs.List>
        <DetailsTabContent value="tab1">
          <div className="w-full flex mb-5">
            <p className="flex-1 ml-5">Lançamentos importados do seu extrato:</p>
            <p className="flex-1 ml-[calc(200px+20px)]">Lançamentos cadastrados no sistema:</p>
          </div>

          <ul className="flex flex-col gap-y-5 overflow-auto">
            {data.transactions.map((transaction, index) => {
              return (
                <BankReconciliationRow
                  key={index}
                  reconciled={transaction.reconciled}
                  extract={transaction.extract}
                  defaultSystem={transaction.system}
                  transferedById={transaction?.transferedById}
                  type={transaction.type}
                  period={period}
                  index={index}
                  accountId={accountId}
                />
              )
            })}
          </ul>
        </DetailsTabContent>
        <DetailsTabContent value="tab2">
          <div className="grid grid-cols-2 gap-x-12 gap-y-5">
            <p className="ml-5">Lançamentos importados do seu extrato:</p>
            <p className="ml-5">Lançamentos cadastrados no sistema:</p>

            {data.transactions.map((transaction, index) => (
              <BankExtractRow
                key={index}
                reconciled={transaction.reconciled}
                transferedById={transaction?.transferedById}
                type={transaction.type}
                extract={transaction.extract}
                system={transaction.system && transaction.system}
              />
            ))}
          </div>
        </DetailsTabContent>
        <DetailsTabContent value="tab3">
          <div className="grid grid-cols-1 gap-x-12 gap-y-5">
            <p className="ml-5">Lançamentos futuros importados do seu extrato:</p>

            {data.futureTransactions ? (
              data.futureTransactions.map((transaction, index) => (
                <TransactionCard
                  key={index}
                  {...transaction}
                  className={cn('future-border w-1/4')}
                />
              ))
            ) : (
              <p className="ml-5">Nenhum lançamento futuro para este periodo</p>
            )}
          </div>
        </DetailsTabContent>
      </Tabs.Root>
      <ModalEditAccountName
        open={isOpenRenameModal}
        onClose={onCloseRenameModal}
        account={{
          id: accountId,
          name: data.accountInfo.name,
        }}
      />
    </div>
  )
}
