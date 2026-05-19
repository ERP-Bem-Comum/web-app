import { CustomFile } from '@/components/files/InputFIleV2'
import { ReceivableStatus } from '@/enums/receivables'
import { useDisclosure } from '@/hooks/useDisclosure'
import {
  createReceivable,
  deleteReceivable,
  updateCategoryReceivable,
  updateReceivable,
  useGetReceivableById,
} from '@/services/receivable'
import { Response } from '@/types/global'
import { IReceivable, Receivable, ReceivablesContextProps } from '@/types/receivables'
import { handleDates } from '@/utils/dates'
import { pickProps } from '@/utils/pickProps'
import { useMutation } from '@tanstack/react-query'
import { HttpStatusCode } from 'axios'
import { queryClient } from 'lib/react-query'
import { createContext, ReactNode, useEffect, useState } from 'react'
import { SubmitHandler } from 'react-hook-form'

export const receivablesContext = createContext<ReceivablesContextProps | null>(null)

export const ReceivableProvider = ({ children }: { children: ReactNode }) => {
  const [receivable, setReceivable] = useState<IReceivable | null>(null)
  const [currentReceivableId, setCurrentReceivableId] = useState<number | null>(null)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [files, setFile] = useState<CustomFile[] | null>(null)

  const { data } = useGetReceivableById(currentReceivableId)

  useEffect(() => {
    if (data && data.data) {
      const { data: plainData } = data

      setReceivable({
        ...plainData,
        recurenceData: {
          recurrenceType: plainData.recurenceData?.recurrenceType,
          startDate: handleDates(plainData.recurenceData?.startDate),
          endDate: handleDates(plainData.recurenceData?.endDate),
          dueDay: plainData.recurenceData?.dueDay ?? 0,
        },
        dueDate: handleDates(plainData.dueDate),
      })
    }
  }, [data])

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

  const mutatedUpdateReceivable = useMutation({
    mutationFn: updateReceivable,
    onSuccess: (data, variables) => {
      const { id } = variables
      queryClient.invalidateQueries({ queryKey: ['receivableById', id] })
      queryClient.invalidateQueries({ queryKey: ['filteredReceivables'] })
    },
  })

  const onSubmit: SubmitHandler<Receivable> = async (data, e) => {
    e?.preventDefault()
    if (data.id && receivable && receivable?.receivableStatus !== ReceivableStatus.PENDING) {
      setErrorMessage('Não é possível editar uma recebimento que não esteja pendente.')
      return
    }
    onDisable()
    let res
    data.id && receivable
      ? (res = await mutatedUpdateReceivable.mutateAsync({
          receivable: data,
          files,
          currentFiles: receivable.files,
          id: receivable.id,
        }))
      : (res = await createReceivable(data, files))

    verifyError(res)

    onEnable()

    modalConfirmDisclosure.onOpen()
  }

  const onUpdateCategory: SubmitHandler<Receivable> = async (data) => {
    try {
      if (!receivable) throw new Error('Erro ao atualizar pagamento.')
      onDisable()
      const res = await updateCategoryReceivable(pickProps(data, ['categorization']), receivable.id)
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
    const res = await deleteReceivable(id)

    verifyError(res)
  }

  const handleChangeFile = (attachments: Array<CustomFile> | null) => {
    if (attachments) setFile(attachments)
  }

  return (
    <receivablesContext.Provider
      value={{
        receivable,
        success,
        errorMessage,
        setCurrentReceivableId,
        onDelete,
        onSubmit,
        onUpdateCategory,
        handleChangeFile,
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
    </receivablesContext.Provider>
  )
}
