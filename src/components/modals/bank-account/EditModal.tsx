'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Grid } from '@mui/material'
import { CustomDatePicker } from '@/components/layout/DatePicker'
import { CustomTextField } from '@/components/layout/TextField'
import { AutoComplete } from '@/components/layout/AutoComplete'
import { useOptions } from '@/hooks/useOptions'
import { CreatebankRecordApi } from '@/types/reconciliation'
import { createBankRecordApischema } from '@/validators/reconciliation'
import { BankReconciliationType } from '@/enums/reconciliation'
import { useEffect } from 'react'
import { EditModalComponents } from './editModalComponents'

interface EditModalProps {
  isOpen: boolean
  onClose: () => void
  transactionType: BankReconciliationType
  defaultValues: Omit<CreatebankRecordApi, 'categorization'>
  rowCallBack: (row: CreatebankRecordApi) => void
}

const EditModal = ({ isOpen, onClose, defaultValues, rowCallBack }: EditModalProps) => {
  const {
    control,
    handleSubmit,
    watch,
    resetField,
    reset,
    formState: { errors },
  } = useForm<CreatebankRecordApi>({
    resolver: zodResolver(createBankRecordApischema),
    defaultValues: {
      ...defaultValues,
    },
  })

  const { options } = useOptions()

  useEffect(() => {
    reset()
  }, [isOpen, reset])

  const onSubmit = async (data: CreatebankRecordApi) => {
    try {
      rowCallBack(data)
      onClose()
    } catch (error) {
      console.error(error)
    }
  }

  const defaultTitle = {
    [BankReconciliationType.TAX]: 'Editar taxa',
    [BankReconciliationType.PROFIT]: 'Conciliar lucro',
    [BankReconciliationType.TRANSFER]: 'Conciliar transferência',
    [BankReconciliationType.TRANSACTION_ENTRY]: 'Conciliar conta',
  }

  return (
    <EditModalComponents.Root open={isOpen} onClose={onClose}>
      <Grid container spacing={1}>
        <Grid item xs={12 / 4}>
          <AutoComplete
            control={control}
            editable={false}
            label="Conta bancária"
            name="accountId"
            options={options.Accounts()}
            error={errors.accountId?.message}
            defaultValue={options.Accounts()?.find((op) => op.id === defaultValues.accountId)}
          />
        </Grid>
        <Grid item xs={12 / 4}>
          <CustomTextField
            control={control}
            name="documentNumber"
            label="Identificador"
            editable={false}
            error={errors.documentNumber?.message}
          />
        </Grid>
        <Grid item xs={12 / 4}>
          <CustomTextField
            control={control}
            name="transactionAmount"
            label="R$ Valor"
            editable={true}
            error={errors.transactionAmount?.message}
            currency
          />
        </Grid>
        <Grid item xs={12 / 4}>
          <CustomDatePicker
            control={control}
            name="transactionDate"
            label="Data"
            editable={true}
            error={errors.transactionDate ? errors.transactionDate.message : ''}
          />
        </Grid>
        <Grid item xs={12}>
          <CustomTextField
            control={control}
            name="fullTransactionDescription"
            label="Descrição"
            editable={true}
            error={errors.fullTransactionDescription?.message}
          />
        </Grid>
        <EditModalComponents.Categorization
          control={control}
          errors={errors}
          edit={true}
          resetField={resetField}
          values={watch()}
        />
      </Grid>
      <EditModalComponents.Buttons
        onClose={onClose}
        onSubmit={handleSubmit(onSubmit, (error) => console.error(error))}
      />
    </EditModalComponents.Root>
  )
}

export default EditModal
