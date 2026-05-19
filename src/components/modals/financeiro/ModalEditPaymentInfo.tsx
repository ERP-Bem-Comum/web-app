import { AutoComplete } from '@/components/layout/AutoComplete'
import { CustomTextField } from '@/components/layout/TextField'
import { Button } from '@/components/ui/button'
import { useOptions } from '@/hooks/useOptions'
import { editContractPaymentInfo } from '@/services/contracts'
import { editSupplier } from '@/services/supplier'
import { ContractForAccounts } from '@/types/contracts'
import { EditPaymentInfo } from '@/types/global'
import { ISupplier } from '@/types/supplier'
import { editPaymentInfoSchema } from '@/validators/global'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box, FormHelperText, Grid, Modal } from '@mui/material'
import { HttpStatusCode, isAxiosError } from 'axios'
import { useSession } from 'next-auth/react'
import { Fragment, useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { ModalConfirm } from '../ModalConfirm'
import { AgencyComponent } from '@/components/layout/AgencyComponent'
import { SubmitButton } from '@/components/layout/Buttons/SubmitButton'
import { queryClient } from 'lib/react-query'
import { PixData } from '@/components/layout/pixData'

interface Props {
  open: boolean
  onClose: () => void
  onRefetch: () => void
  supplier: ISupplier | null
  paymentInfo: EditPaymentInfo
  hasChanged: boolean
  contract?: ContractForAccounts
  payableId?: number
}

export function ModalEditPaymentInfo({
  open,
  onClose,
  onRefetch,
  supplier,
  contract,
  payableId,
  paymentInfo,
  hasChanged,
}: Props) {
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [isOpenModalSuccess, SetIsOpenModalSuccess] = useState(false)
  const session = useSession()

  const {
    options: { bankOptions },
  } = useOptions()

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EditPaymentInfo>({
    resolver: zodResolver(editPaymentInfoSchema),
  })

  useEffect(() => {
    reset({
      ...paymentInfo,
      updatedBy: session.data?.user.id,
    })
  }, [open, reset, paymentInfo, session.data?.user.id])

  useEffect(() => {
    if (watch('pixInfo.key_type') === null) {
      setValue('pixInfo.key', null)
    }
  }, [watch, setValue])

  const refetchData = () => {
    if (hasChanged || !payableId) {
      onRefetch()
      return
    }
    queryClient.refetchQueries({ queryKey: ['payablesById', payableId] })
  }

  const onSubmit: SubmitHandler<EditPaymentInfo> = async (data, e) => {
    e?.preventDefault()
    setIsLoading(true)
    try {
      let res
      if (contract?.id) {
        res = await editContractPaymentInfo(data, contract.id)
      } else if (supplier?.id) {
        res = await editSupplier(supplier.id, data)
      }
      if (res?.status === HttpStatusCode.Ok) {
        setErrorMessage(undefined)
        refetchData()
      } else {
        setErrorMessage(res?.error ?? 'Não há fornecedor ou contrato para serem alterados')
      }
    } catch (error) {
      console.error(error)
      if (isAxiosError(error)) {
        setErrorMessage(error.message)
      }
    } finally {
      setIsLoading(false)
      SetIsOpenModalSuccess(true)
    }
  }

  return (
    open && (
      <Modal open={open} onClose={onClose} className="flex items-center justify-center pt-10">
        <Fragment>
          <Box
            className={`bg-white text-black border-[1px] border-solid min-w-80 w-3/4 flex flex-col justify-center items-start p-5 gap-[20px] rounded`}
          >
            <label>
              Dados Bancários: {contract ? 'contrato' : supplier ? 'fornecedor' : 'nenhum'}{' '}
            </label>
            <Grid container columnSpacing={1}>
              <Grid item xs={6 / 2}>
                <AutoComplete
                  control={control}
                  editable
                  label="Banco"
                  name="bancaryInfo.bank"
                  options={bankOptions}
                  error={errors.bancaryInfo?.bank?.message || errors.bancaryInfo?.bank?.message}
                />
              </Grid>
              <Grid item xs={6 / 2}>
                <AgencyComponent
                  control={control}
                  editable
                  error={errors.bancaryInfo?.agency?.message || errors.bancaryInfo?.agency?.message}
                  name="bancaryInfo.agency"
                />
              </Grid>

              <Grid item xs={6 / 2}>
                <CustomTextField
                  control={control}
                  label="Número da Conta"
                  name="bancaryInfo.accountNumber"
                  error={
                    errors.bancaryInfo?.accountNumber?.root?.message ||
                    errors.bancaryInfo?.accountNumber?.message
                  }
                  editable
                />
              </Grid>

              <Grid item xs={6 / 2}>
                <CustomTextField
                  control={control}
                  label="Dígito"
                  name="bancaryInfo.dv"
                  error={undefined}
                  editable
                />
              </Grid>
            </Grid>
            <label>Dados PIX: </label>
            <div className="flex gap-5 w-1/2">
              <PixData
                control={control}
                editable
                errors={errors}
                setValue={setValue}
                values={watch('pixInfo')}
              />
            </div>
            <FormHelperText error={true} variant="outlined">
              {errors.pixInfo?.root?.message ?? errors.bancaryInfo?.root?.message}
            </FormHelperText>
            <div className="flex gap-5 justify-end w-full">
              <Button data-test="modalConfirm" className="w-fit" variant="ghost" onClick={onClose}>
                Descartar
              </Button>

              <SubmitButton
                createLabel="Adicionar"
                editLabel="Editar"
                edit={true}
                disabled={isLoading}
                onClick={handleSubmit(onSubmit, (errors) => console.error(errors))}
              />
            </div>
          </Box>
          <ModalConfirm
            open={isOpenModalSuccess}
            onClose={() => {
              setErrorMessage(undefined)
              SetIsOpenModalSuccess(false)
              !errorMessage && onClose()
            }}
            text={!errorMessage ? `Dados de pagamento editados com sucesso!` : errorMessage}
            success={!errorMessage}
          />
        </Fragment>
      </Modal>
    )
  )
}
