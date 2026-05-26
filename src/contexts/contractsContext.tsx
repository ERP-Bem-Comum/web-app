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
        const payload = { ...data }
        console.log('[onSubmit create] data.signedContractUrl:', data.signedContractUrl?.length)
        const hasFile = !!payload.signedContractUrl || !!(files && files.length > 0)
        console.log('[onSubmit create] hasFile:', hasFile, 'files.length:', files?.length)
        if (hasFile) {
          payload.contractStatus = ContractStatus.ONGOING
        } else {
          payload.contractStatus = ContractStatus.PENDING
        }
        console.log('[onSubmit create] payload.contractStatus:', payload.contractStatus)

        // Fallback robusto: se há arquivo mas signedContractUrl está vazio, converte aqui
        if (!payload.signedContractUrl && files && files.length > 0 && files[0].file) {
          try {
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onloadend = () => {
                if (reader.result) resolve(reader.result as string)
                else reject(new Error('Falha ao converter'))
              }
              reader.onerror = reject
              reader.readAsDataURL(files[0].file as File)
            })
            payload.signedContractUrl = base64
            console.log('[onSubmit create] Convertido no contexto, tamanho:', base64.length)
          } catch (err) {
            console.error('[onSubmit create] Falha ao converter arquivo no contexto:', err)
          }
        }

        res = await createContract(payload, files)
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
