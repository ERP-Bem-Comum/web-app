import { CustomFile } from '@/components/files/InputFIleV2'
import { PayableStatus } from '@/enums/payables'
import { useDisclosure } from '@/hooks/useDisclosure'
import {
  createPayable,
  deletePayable,
  updateCategoryPayable,
  updatePayable,
  useGetPayableById,
} from '@/services/payables'
import { Response } from '@/types/global'
import { Payable, payablesContextProps } from '@/types/Payables'
import { pickProps } from '@/utils/pickProps'
import { useMutation } from '@tanstack/react-query'
import { HttpStatusCode } from 'axios'
import { queryClient } from 'lib/react-query'
import { createContext, ReactNode, useState } from 'react'
import { SubmitHandler } from 'react-hook-form'

export const payablesContext = createContext<payablesContextProps | null>(null)

export const PayablesProvider = ({ children }: { children: ReactNode }) => {
  const [currentPayableId, setCurrentPayableId] = useState<number | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [files, setFile] = useState<CustomFile[] | null>(null)
  const [operationType, setOperationType] = useState<'create' | 'edit' | 'delete' | null>(null)

  const { data, isLoading } = useGetPayableById(currentPayableId)

  const payable = data?.data

  const modalConfirmDisclosure = useDisclosure()
  const modalQuestionDisclosure = useDisclosure()
  const modalAlertDisclosure = useDisclosure()
  const { isOpen: isDisabled, onOpen: onDisable, onClose: onEnable } = useDisclosure()

  const verifyError = (res: Response<unknown>) => {
    if ([HttpStatusCode.Created, HttpStatusCode.Ok].includes(res.status)) {
      setSuccess(true)
      setErrorMessage('')
      setFile(null)
    } else {
      setSuccess(false)
      setErrorMessage(res.error)
    }
  }
  const mutatedUpdatePayable = useMutation({
    mutationFn: updatePayable,
    onSuccess: (data, variables) => {
      const { id } = variables
      queryClient.invalidateQueries({ queryKey: ['payablesById', id] })
      queryClient.invalidateQueries({ queryKey: ['filteredPayables'] })
      queryClient.invalidateQueries({ queryKey: ['PayablesForApprovals'] })
    },
  })

  const onSubmit: SubmitHandler<Payable> = async (data, e) => {
    e?.preventDefault()

    if (
      data.id &&
      payable &&
      payable?.payableStatus !== PayableStatus.PENDING &&
      payable?.payableStatus !== PayableStatus.APPROVING &&
      payable?.payableStatus !== PayableStatus.REJECTED
    ) {
      modalConfirmDisclosure.onOpen()
      setSuccess(false)
      setErrorMessage('Não é possível editar uma conta a pagar aprovada.')
      return
    }

    onDisable()
    let res
    if (data.id && payable) {
      setOperationType('edit')
      res = await mutatedUpdatePayable.mutateAsync({
        payable: data,
        files,
        currentFiles: payable.files,
        id: payable.id,
      })
    } else {
      setOperationType('create')
      res = await createPayable(data, files)
    }

    verifyError(res)

    onEnable()

    modalConfirmDisclosure.onOpen()
  }

  const onUpdateCategory: SubmitHandler<Payable> = async (data) => {
    try {
      if (!payable) throw new Error('Erro ao atualizar pagamento.')
      onDisable()
      const res = await updateCategoryPayable(pickProps(data, ['categorization']), payable.id)
      verifyError(res)
      modalConfirmDisclosure.onOpen()
    } catch (e) {
      console.error(e)
    } finally {
      onEnable()
    }
  }

  const onDelete = async (id: number | undefined) => {
    if (!id) return
    if (
      payable?.payableStatus !== PayableStatus.PENDING &&
      payable?.payableStatus !== PayableStatus.APPROVING
    ) {
      setErrorMessage('Não é possível deletar uma conta a pagar aprovada.')
      setSuccess(false)
      return
    }

    setOperationType('delete')
    const res = await deletePayable(id)

    verifyError(res)
  }

  const handleChangeFile = (attachments: Array<CustomFile> | null) => {
    if (attachments) setFile(attachments)
  }

  return (
    <payablesContext.Provider
      value={{
        payable,
        success,
        errorMessage,
        isLoading,
        operationType,
        setCurrentPayableId,
        onDelete,
        onSubmit,
        onUpdateCategory,
        handleChangeFile,
        setErrorMessage,
        disclosure: {
          modalConfirmDisclosure,
          modalQuestionDisclosure,
          modalAlertDisclosure,
        },
        disabled: {
          isDisabled,
          onDisable,
          onEnable,
        },
      }}
    >
      {children}
    </payablesContext.Provider>
  )
}
