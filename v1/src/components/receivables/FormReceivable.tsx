/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import { ReceivableType } from '@/enums/receivables'
import { useReceivableContext } from '@/hooks/useReceivableContext'
import { ContractForAccounts } from '@/types/contracts'
import { IEditReceivable, Receivable } from '@/types/receivables'
import { receivableSchema } from '@/validators/receivables'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Card, CardContent } from '../ui/card'
import { ReceivableStructure } from './FormComponents'

interface Props {
  receivable: IEditReceivable | null
  edit: boolean
}

export default function FormReceivable({ receivable, edit }: Props) {
  const [contract, setContract] = useState<ContractForAccounts | undefined>(receivable?.contract)

  const { onSubmit, handleChangeFile, onUpdateCategory } = useReceivableContext()
  const defaultValues = useMemo(() => {
    return (
      receivable ?? {
        recurrent: false,
        receivableType: ReceivableType.CONTRACT,
      }
    )
  }, [receivable])

  const {
    control,
    watch,
    handleSubmit,
    setValue,
    resetField,
    formState: { errors },
  } = useForm<Receivable>({
    resolver: zodResolver(receivableSchema),
    defaultValues,
  })

  const values = watch()

  const isMounted = useRef(false)

  const updateContractInfo = () => {
    if (isMounted.current) {
      if (values.receivableType === ReceivableType.CONTRACT) {
        setValue('totalValue', contract?.totalValue ?? 0)
        setValue('contractId', contract?.id)
      } else {
        setValue('contractId', undefined)
      }
    } else {
      isMounted.current = true
    }
  }

  useEffect(updateContractInfo, [values.receivableType, contract])

  return (
    <div className="">
      <Card>
        <CardContent className="pt-8">
          <ReceivableStructure.Root>
            <ReceivableStructure.ReceivableSubject
              defaultFinancier={receivable?.financier}
              defaultContract={contract}
              receivableType={values.receivableType}
              editable={edit}
              setContract={setContract}
              setValue={setValue}
            />
            <ReceivableStructure.ReceiptionData
              control={control}
              edit={edit}
              errors={errors}
              values={values}
              hasReceivable={!!receivable}
              hasContract={!!contract}
            />
            <ReceivableStructure.Recurrence
              control={control}
              edit={edit}
              errors={errors}
              values={values}
              setValue={setValue}
            />
            <ReceivableStructure.ExtraInfo values={values} />
            <ReceivableStructure.Categorization
              control={control}
              edit={true}
              errors={errors}
              values={values}
              resetField={resetField}
            />
            <ReceivableStructure.Files
              currentFiles={receivable?.currentFiles}
              edit={edit}
              onChange={handleChangeFile}
            />
          </ReceivableStructure.Root>
        </CardContent>
      </Card>
      <ReceivableStructure.Footer
        hasReceivable={!!receivable}
        editable={edit}
        onSubmit={handleSubmit(edit ? onSubmit : onUpdateCategory, (error) => console.error(error))}
      />
      <ReceivableStructure.Modals
        hasReceivable={!!receivable}
        identifierCode={receivable?.identifierCode}
        id={receivable?.id}
      />
    </div>
  )
}
