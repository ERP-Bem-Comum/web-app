import { CustomFile } from '@/components/files/InputFIleV2'
import { ContractStatus } from '@/enums/contracts'
import { createAditive, createContract, deleteContract, updateContract } from '@/services/contracts'
import { deletePayable } from '@/services/payables'
import { Contract, IContract } from '@/types/contracts'
import { useMutation } from '@tanstack/react-query'
import { HttpStatusCode } from 'axios'
import { queryClient } from 'lib/react-query'
import { useSession } from 'next-auth/react'
import { BaseSyntheticEvent, createContext, ReactNode, useState } from 'react'

interface ContractsContextProps {
  onSubmit: ({
    data,
    e,
    defaultContract,
  }: {
    data: Contract
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    e: BaseSyntheticEvent<object, any, any> | undefined
    defaultContract?: IContract
  }) => void
  onDelete: (id: number | undefined, status: ContractStatus | undefined) => void
  handleChangeFile: (attachments: Array<CustomFile> | null) => void
  setShowModalQuestion: (data: boolean) => void
  setShowModalAlert: (data: boolean) => void
  setShowModalConfirm: (data: boolean) => void
  isDisabled: boolean
  showModalConfirm: boolean
  showModalQuestion: boolean
  showModalAlert: boolean
  errorMessage: string
  isDeleting: boolean
  setIsDeleting: (value: boolean) => void
  operationType: 'create' | 'edit' | 'delete' | 'create-aditive' | null
}

export const contractContext = createContext<ContractsContextProps | null>(null)

export const ContractsProvider = ({ children }: { children: ReactNode }) => {
  const [isDisabled, setIsDisabled] = useState(false)
  const [showModalConfirm, setShowModalConfirm] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [files, setFile] = useState<CustomFile[] | null>(null)
  const [showModalQuestion, setShowModalQuestion] = useState(false)
  const [showModalAlert, setShowModalAlert] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [operationType, setOperationType] = useState<'create' | 'edit' | 'delete' | 'create-aditive' | null>(null)
  const { data: session } = useSession()

  const mutatedUpdateContract = useMutation({
    mutationFn: updateContract,
    onSuccess: (data, variables) => {
      const { id } = variables
      queryClient.refetchQueries({ queryKey: ['ContractById', id] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    },
  })

  const onSubmit = async ({
    data,
    e,
    defaultContract,
  }: {
    data: Contract
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    e: BaseSyntheticEvent<object, any, any> | undefined
    defaultContract?: IContract
  }) => {
    try {
      e?.preventDefault()

      setIsDisabled(true)
      let res

      if (defaultContract && !data?.parentId) {
        setOperationType('edit')
        res = await mutatedUpdateContract.mutateAsync({
          contract: data,
          files,
          currentFiles: defaultContract.currentFiles,
          id: defaultContract.id,
          userId: session?.user.id,
        })
      } else if (data.parentId) {
        setOperationType('create-aditive')
        res = await createAditive(data, files, session?.user.id)
      } else {
        setOperationType('create')
        res = await createContract(data, files)
      }

      if (res.data) {
        setErrorMessage('')
        setFile(null)
      } else {
        setErrorMessage(res.error)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsDisabled(false)
      setShowModalConfirm(true)
    }
  }

  const onDelete = async (id: number | undefined, status: ContractStatus | undefined) => {
    if (!id) return
    try {
      setIsDeleting(true)
      setOperationType('delete')
      if (status && status !== ContractStatus.PENDING) {
        setShowModalConfirm(true)
        setErrorMessage('Não é possível deletar um contrato assinado.')
        return
      }

      const res = await deleteContract(id)

      if (res.status === HttpStatusCode.Ok) {
        setErrorMessage('')
      } else {
        setErrorMessage(res.error)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setShowModalConfirm(true)
      setShowModalAlert(false)
    }
  }

  const handleChangeFile = (attachments: Array<CustomFile> | null) => {
    if (attachments) setFile(attachments)
  }

  return (
    <contractContext.Provider
      value={{
        onSubmit,
        onDelete,
        handleChangeFile,
        isDisabled,
        errorMessage,
        showModalConfirm,
        showModalQuestion,
        showModalAlert,
        setShowModalQuestion,
        setShowModalAlert,
        setShowModalConfirm,
        isDeleting,
        setIsDeleting,
        operationType,
      }}
    >
      {children}
    </contractContext.Provider>
  )
}
