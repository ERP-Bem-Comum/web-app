import { SubmitButton } from '@/components/layout/Buttons/SubmitButton'
import { InstallmentStatus, InstallmentType } from '@/enums/installments'
import { useDisclosure } from '@/hooks/useDisclosure'
import { updatePayableinstallments } from '@/services/payables'
import { updateReceivableInstallments } from '@/services/receivable'
import { Installments, outputPairedValues, PairedDefaultValues } from '@/types/installments'
import { maskMonetaryValue } from '@/utils/masks'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ptBR as brLocale } from 'date-fns/locale'
import { useEffect, useMemo, useState } from 'react'
import { ModalConfirm } from '../ModalConfirm'
import { ModalPreviewBase } from '../ModalPreviewBase'
import { PreviewSection } from '../PreviewSection'
import { HttpStatusCode } from '@/services/http-status'
import { OutlineButton } from '@/components/layout/Buttons/OutlineButton'
import { TextField } from '@mui/material'
import { Controller, SubmitHandler, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { postergateInstallmentsSchema } from '@/validators/installments'
import { handleDates } from '@/utils/dates'
import ErrorText from '@/components/ErrorText'

interface ModalPostergationProps {
  onClose: () => void
  isOpen: boolean
  defaultValues: Installments[]
  accountId: number
  totalValue: number
  type: 'payable' | 'receivable'
}

export const ModalPostergation = ({
  onClose,
  isOpen,
  defaultValues,
  accountId,
  totalValue,
  type,
}: ModalPostergationProps) => {
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const {
    isOpen: isOpenConfirmModal,
    onOpen: onOpenConfirmModal,
    onClose: onCloseConfirmModal,
  } = useDisclosure()

  const { pairedDefaultValues, paidTotal } = useMemo(() => {
    const pairedDefaultValues: PairedDefaultValues['itens'] = []
    const peinding = defaultValues.filter((val) =>
      [InstallmentStatus.PENDING, InstallmentStatus.OVERDUE].includes(val.status),
    )
    const liquidInstallments = peinding.filter((val) => val.type === InstallmentType.LIQUID)

    liquidInstallments.forEach((liquid) => {
      const tax = peinding.find((val) => val.relatedLiquidInstallmentId === liquid.id)
      pairedDefaultValues.push({ liquid, tax })
    })

    const paidTotal = defaultValues.reduce(
      (acc, val) => (val.status === InstallmentStatus.PAID ? acc + val.value : acc),
      0,
    )

    return { pairedDefaultValues, paidTotal }
  }, [defaultValues])

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<PairedDefaultValues>({
    defaultValues: {
      itens: pairedDefaultValues,
      totalValue,
      paidTotal,
    },
    resolver: zodResolver(postergateInstallmentsSchema),
  })

  useEffect(() => {
    if (pairedDefaultValues) {
      reset({
        itens: pairedDefaultValues,
        totalValue,
        paidTotal,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairedDefaultValues, reset])

  const { fields } = useFieldArray({
    control,
    name: 'itens',
  })

  const onSubmit: SubmitHandler<PairedDefaultValues> = async (data) => {
    let res
    setIsLoading(true)
    try {
      // * data is arriving transformed but casted as untrasnformed for some reason.
      const castedData = data as unknown as outputPairedValues
      if (type === 'payable') {
        res = await updatePayableinstallments(castedData, accountId)
      } else {
        res = await updateReceivableInstallments(castedData, accountId)
      }

      if (res.status === HttpStatusCode.Ok) {
        setErrorMessage('')
      } else {
        setErrorMessage(res.error)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
      onOpenConfirmModal()
    }
  }

  return (
    <ModalPreviewBase
      handleOnClose={onClose}
      open={isOpen}
      title={'Postergar parcelas'}
      width={'fit-content'}
    >
      <form className="w-full max-h-[90dvh] overflow-y-scroll">
        {fields.map((field, index) => (
          <div key={field.id} className="flex p-5 gap-2 w-full items-center justify-center">
            <label className="whitespace-nowrap pr-5">Parcela {index + 1}</label>
            <Controller
              name={`itens.${index}.liquid.dueDate`}
              control={control}
              render={({ field: { value, ...field } }) => (
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={brLocale}>
                  <DatePicker
                    {...field}
                    value={handleDates(value)}
                    onChange={(value) => {
                      if (value) {
                        setValue(`itens.${index}.liquid.dueDate`, value)
                        setValue(`itens.${index}.tax.dueDate`, value)
                      }
                    }}
                    label={'Data de pagamento'}
                    openTo="month"
                    views={['year', 'month', 'day']}
                    sx={{
                      backgroundColor: '#fff',
                    }}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                      },
                    }}
                  />
                </LocalizationProvider>
              )}
            />
            <Controller
              name={`itens.${index}.liquid.value`}
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={maskMonetaryValue(field.value ?? 0)}
                  onChange={(e) => {
                    field.onChange(Number(e.target.value.replace(/\D/g, '')) / 100)
                  }}
                  type="text"
                  label={'Valor líquido'}
                  size="small"
                  fullWidth
                />
              )}
            />
            {type === 'payable' && (
              <Controller
                name={`itens.${index}.tax.value`}
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <TextField
                    {...field}
                    value={maskMonetaryValue(value ?? 0)}
                    onChange={(e) => {
                      const newTaxValue = Number(e.target.value.replace(/\D/g, '')) / 100
                      if (!getValues(`itens.${index}.tax.id`)) {
                        const liquidInstallment = getValues(`itens.${index}.liquid`)
                        const newTaxInstallment = {
                          ...liquidInstallment,
                          id: undefined,
                          value: newTaxValue,
                          type: InstallmentType.TAX,
                          relatedLiquidInstallmentId: liquidInstallment.id ?? null,
                        }
                        setValue(`itens.${index}.tax`, newTaxInstallment)
                      } else {
                        onChange(newTaxValue)
                      }
                    }}
                    type="text"
                    label={'Impostos'}
                    size="small"
                    fullWidth
                  />
                )}
              />
            )}
          </div>
        ))}
      </form>
      <ErrorText className="w-full text-center text-base">{errors.totalValue?.message}</ErrorText>
      <PreviewSection className="flex-row py-3">
        <OutlineButton
          onClick={() => {
            onClose()
            reset()
          }}
          disabled={isLoading}
          label="Descartar"
        />
        <SubmitButton
          createLabel=""
          edit
          editLabel="Editar data(s)"
          onClick={handleSubmit(onSubmit, (e) => console.error(e))}
          disabled={isLoading}
        />
      </PreviewSection>
      <ModalConfirm
        open={isOpenConfirmModal}
        onClose={() => {
          onCloseConfirmModal()
          errorMessage === '' && onClose()
        }}
        text={errorMessage === '' ? `Parcelas postergadas com sucesso!` : errorMessage}
        success={errorMessage === ''}
      />
    </ModalPreviewBase>
  )
}
