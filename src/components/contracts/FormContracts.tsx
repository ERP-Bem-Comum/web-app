'use client'
import { ContractType } from '@/enums/contracts'
import { useContractContext } from '@/hooks/useContractsContext'
import { Contract, IContract, otherContractSchema } from '@/types/contracts'
import { switchContractedComponent } from '@/utils/UI/contracts'
import { contractSchema } from '@/validators/contracts'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DeepPartial, useForm } from 'react-hook-form'
import { ModalAlert } from '../modals/ModalAlert'
import { ModalConfirm } from '../modals/ModalConfirm'
import { ModalQuestion } from '../modals/ModalQuestion'
import { Card, CardContent, CardFooter } from '../ui/card'
import { Contracts } from './FormComponents'
import { Fragment, useEffect, useRef, useState } from 'react'
import { pixKeyTypes } from '@/utils/enums'

interface Props {
  contract?: IContract
  edit: boolean
  parentId?: number
}

export const getMostRecentInfo = (contract?: IContract, parentId?: number) => {
  let mostRecentInfo = contract
  if (contract && contract.children) {
    if (contract.children.length > 0) {
      mostRecentInfo = contract.children.sort((a, b) => b.id - a.id)[0]
    }
  }
  if (parentId) {
    return {
      ...mostRecentInfo,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      contractStatus: undefined,
      parentId,
    }
  }
  return mostRecentInfo
}

export default function FormContract({ contract, edit, parentId }: Props) {
  const router = useRouter()
  const mostRecentInfo = getMostRecentInfo(contract, parentId)
  const { data: session } = useSession()
  const {
    onSubmit,
    onDelete,
    handleChangeFile,
    isDisabled,
    errorMessage,
    showModalConfirm,
    showModalAlert,
    showModalQuestion,
    setShowModalAlert,
    setShowModalQuestion,
    setShowModalConfirm,
    isDeleting,
    setIsDeleting,
    operationType,
  } = useContractContext()

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<Contract>({
    resolver: zodResolver(contractSchema),
    defaultValues: mostRecentInfo
      ? {
          ...mostRecentInfo,
          contractPeriod: mostRecentInfo.contractPeriod
            ? {
                ...mostRecentInfo.contractPeriod,
                isIndefinite:
                  mostRecentInfo.contractPeriod.isIndefinite ??
                  (mostRecentInfo.contractPeriod.end === null ? true : false),
              }
            : undefined,
          updatedBy: session?.user.id,
          createdById: session?.user.id,
        }
      : {
          contractType: ContractType.SUPPLIER,
        },
  })

  const values = watch()

  const isMounted = useRef(false)

  // Resetar modais ao montar o componente
  useEffect(() => {
    setShowModalConfirm(false)
    setShowModalAlert(false)
    setShowModalQuestion(false)
    setIsDeleting(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (isMounted.current) {
      reset({
        agreement: null,
        pixInfo: null,
        bancaryInfo: null,
        totalValue: null,
        supplierId: null,
        collaboratorId: null,
        financierId: null,
        contractPeriod: null,
        contractModel: null,
        object: null,
        programId: null,
        budgetPlanId: null,
        updatedBy: session?.user.id,
        contractType: values.contractType,
      } as unknown as DeepPartial<Contract>)

      console.log('resetou')
      setValue('contractType', values.contractType)
    } else {
      isMounted.current = true
    }
  }, [reset, setValue, values.contractType])

  return (
    <div className="">
      <Card>
        <CardContent className="pt-8">
          <Contracts.Root>
            <Contracts.Info
              control={control}
              editable={edit}
              errors={errors}
              isAditive={!!parentId}
            />
            <Contracts.Vigency
              contractType={values.contractType}
              control={control}
              editable={edit}
              errors={errors}
              values={values as otherContractSchema}
              setValue={setValue}
            />
            {switchContractedComponent(
              values.contractType,
              edit,
              (id) =>
                setValue(
                  values.contractType === ContractType.FINANCIER
                    ? 'financierId'
                    : values.contractType === ContractType.COLLABORATOR
                      ? 'collaboratorId'
                      : 'supplierId',
                  id,
                ),
              (pix, account) => {
                setValue('pixInfo', pix)
                setValue('bancaryInfo', account)
              },
              contract,
            )}

            {values.contractType !== ContractType.FINANCIER && (
              <Fragment>
                <Contracts.BancaryData control={control} editable={edit} errors={errors} />
                <Contracts.PixData
                  setValue={setValue}
                  control={control}
                  editable={edit}
                  errors={errors}
                  values={values.pixInfo}
                />
              </Fragment>
            )}

            <Contracts.Files onChange={handleChangeFile} initialValue={contract?.files} />
            <Contracts.ChildsList contract={contract} />
          </Contracts.Root>
        </CardContent>
      </Card>
      {edit && (
        <CardFooter className="border-t border-[#C4DADF] mx-4 flex justify-between py-8 px-0">
          <Contracts.Footer
            create={!mostRecentInfo?.id}
            isDisabled={isDisabled}
            isAditive={!!mostRecentInfo?.parentId}
            contractStatus={mostRecentInfo?.contractStatus}
            setShowModalAlert={setShowModalAlert}
            setShowModalQuestion={setShowModalQuestion}
            onSubmit={handleSubmit(
              (data, e) => onSubmit({ data, e, defaultContract: contract }),
              (error) => console.error(error),
            )}
          />
        </CardFooter>
      )}
      <ModalConfirm
        open={showModalConfirm}
        onClose={() => {
          setShowModalConfirm(false)
          errorMessage === '' && router.push('/contratos')
        }}
        text={
          errorMessage === ''
            ? `${mostRecentInfo?.parentId ? 'Aditivo' : 'Contrato'} ${
                operationType === 'delete' 
                  ? 'deletado' 
                  : operationType === 'edit' 
                  ? 'editado' 
                  : operationType === 'create-aditive'
                  ? 'criado'
                  : 'criado'
              } com sucesso!`
            : errorMessage
        }
        success={errorMessage === ''}
      />
      <ModalQuestion
        open={showModalQuestion}
        onConfirm={() => {
          setShowModalQuestion(false)
          setIsDeleting(false)
          router.push('/contratos')
        }}
        onClose={() => {
          setShowModalQuestion(false)
        }}
        text={'Ao confirmar essa opção todas as suas alterações serão perdidas.'}
        textConfirm="Sim, Descartar alterações"
        textCancel="Não Descartar alterações"
      />
      <ModalAlert
        open={showModalAlert}
        onConfirm={() => {
          setIsDeleting(true)
          onDelete(contract?.id, contract?.contractStatus)
        }}
        onClose={() => {
          setShowModalAlert(false)
        }}
        text={`Você está prestes a deletar o contrato de número ${contract?.contractCode}. Tem certeza que deseja continuar?`}
        textConfirm="Sim, tenho certeza"
        textCancel={'Cancelar'}
      />
    </div>
  )
}
