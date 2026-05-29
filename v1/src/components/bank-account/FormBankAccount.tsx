'use client'
import { useIsMounted } from '@/hooks/useIsMounted'
import { zodResolver } from '@hookform/resolvers/zod'
import { Grid } from '@mui/material'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { ModalConfirm } from '../modals/ModalConfirm'
import { ModalQuestion } from '../modals/ModalQuestion'
import { Card, CardContent, CardFooter } from '../ui/card'
import { TitleLabel } from '../layout/TitleLabel'
import { BankAccount, EditBankAccount } from '@/types/bankAccount'
import { bankAccountSchema } from '@/validators/account'
import useBankAccounts from '@/hooks/useBankAccounts'
import { CustomTextField } from '../layout/TextField'
import { GhostButton } from '../layout/Buttons/GhostButton'
import { SubmitButton } from '../layout/Buttons/SubmitButton'
import { pickProps } from '@/utils/pickProps'
import { useCallback, useEffect, useState } from 'react'
import { debounce } from 'lodash-es'
import { ModalAwait } from '../modals/ModalAwait'
import { AgencyComponent } from '../layout/AgencyComponent'

interface FormBankAccountProps {
  account: EditBankAccount | null
}

export default function FormBankAccount({ account }: FormBankAccountProps) {
  useIsMounted()
  const router = useRouter()
  const { modals, isDisabled, success, errorMessage, form, UpdateInitialbalance } =
    useBankAccounts()
  const [enableInitialBalance, setEnableInitialBalance] = useState(false)
  const edit = !account

  const defaultValues = pickProps(account as EditBankAccount, [
    'name',
    'initialBalance',
    'bank',
    'agency',
    'accountNumber',
    'dv',
  ])

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BankAccount>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: { ...defaultValues, bank: defaultValues.bank ?? 'BRADESCO' },
  })

  const values = watch()

  const debouncedSetBalance = useCallback(
    debounce(
      async () => {
        UpdateInitialbalance(
          values,
          () => setEnableInitialBalance(true),
          (balance) => setValue('initialBalance', balance),
        )
      },
      500,
      { maxWait: 2000 },
    ),
    [UpdateInitialbalance],
  )

  const shouldUpdateBalance = () => {
    return values.agency?.length === 6 && values.accountNumber?.length > 4
  }

  useEffect(() => {
    if (shouldUpdateBalance()) {
      debouncedSetBalance()
    }

    return () => debouncedSetBalance.cancel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.agency, values.accountNumber])

  return (
    <div className="">
      <Card>
        <CardContent className="pt-8 space-y-[35px]">
          <div className="space-y-[10px]">
            <TitleLabel>Dados cadastrais do fornecedor:</TitleLabel>

            <Grid container spacing={2}>
              <Grid size={{ xs: 3 }}>
                <CustomTextField
                  control={control}
                  editable={true}
                  error={errors.name?.message}
                  label="Nome da Conta"
                  name="name"
                />
              </Grid>
              <Grid size={{ xs: 3 }}>
                <CustomTextField
                  control={control}
                  editable={edit && enableInitialBalance}
                  currency
                  error={errors.initialBalance?.message}
                  label="Saldo Inicial"
                  name="initialBalance"
                />
              </Grid>
            </Grid>
          </div>
          <div className="space-y-[10px]">
            <TitleLabel>Dados da Conta:</TitleLabel>

            <Grid container spacing={2}>
              <Grid size={{ xs: 3 }}>
                <CustomTextField
                  control={control}
                  editable={false}
                  error={errors.bank?.message}
                  label="Banco"
                  name="bank"
                />
              </Grid>
              <Grid size={{ xs: 3 }}>
                <AgencyComponent
                  control={control}
                  editable={edit}
                  error={errors.agency?.message}
                  name="agency"
                />
              </Grid>
              <Grid size={{ xs: 3 }}>
                <CustomTextField
                  control={control}
                  editable={edit}
                  error={errors.accountNumber?.message}
                  label="Número da Conta"
                  name="accountNumber"
                />
              </Grid>
              <Grid size={{ xs: 3 }}>
                <CustomTextField
                  control={control}
                  editable={edit}
                  error={errors.dv?.message}
                  label="DV"
                  name="dv"
                />
              </Grid>
            </Grid>
          </div>
        </CardContent>
        <CardFooter className="border-t border-[#C4DADF] mx-4 flex justify-end py-8 px-0">
          <div>
            <GhostButton
              disabled={isDisabled}
              label="Cancelar"
              onClick={modals.onOpenModalQuestion}
            />
            <SubmitButton
              createLabel="Adicionar"
              editLabel="Editar"
              edit={!!account}
              disabled={isDisabled}
              onClick={handleSubmit(
                (data, e) => form.onSubmit(data, e, account?.id),
                (error) => console.error(error),
              )}
            />
          </div>
        </CardFooter>
      </Card>
      <ModalConfirm
        open={modals.isOpenModalShowConfirm}
        onClose={() => {
          modals.onCloseModalShowConfirm()
          success && router.back()
        }}
        text={
          success
            ? `Conta bancária ${account ? 'editada' : 'adicionada'}  com sucesso!`
            : errorMessage
        }
        success={success}
      />
      <ModalQuestion
        open={modals.isOpenModalQuestion}
        onConfirm={() => {
          router.back()
        }}
        onClose={() => {
          modals.onCloseModalQuestion()
        }}
        text={'Ao confirmar essa opção todas as suas alterações serão perdidas.'}
        textConfirm="Sim, Descartar alterações"
        textCancel="Não Descartar alterações"
      />
      <ModalAwait open={modals.isOpenAwaitModal} text="Obtendo saldo inicial..." />
    </div>
  )
}
