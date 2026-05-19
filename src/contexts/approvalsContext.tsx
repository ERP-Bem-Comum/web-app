import { useDisclosure } from '@/hooks/useDisclosure'
import { approveAccess, approvePayable, getPayableForApprovalById } from '@/services/payables'
import { approval, ApprovalsContextProps, credentials, IApproval } from '@/types/approvals'
import { IPayables } from '@/types/Payables'
import { handleDates } from '@/utils/dates'
import { HttpStatusCode } from 'axios'
import { useRouter } from 'next/navigation'
import { setCookie } from 'nookies'
import { createContext, ReactNode, useContext, useState } from 'react'
import { SubmitHandler } from 'react-hook-form'

const ApprovalsContext = createContext<ApprovalsContextProps | null>(null)

export const ApprovalsProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter()

  const [errorMessage, setErrorMessage] = useState<string>('')
  const [approval, setApproval] = useState<IApproval>()
  const [credentials, setCredentials] = useState<credentials | null>(null)
  const [payable, setPayable] = useState<IPayables | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const modalConfirmDisclosure = useDisclosure()

  const onAccess: SubmitHandler<credentials> = async (data) => {
    try {
      const resp = await approveAccess(data)
      setCredentials(data)
      if (resp.status === HttpStatusCode.Created) {
        setErrorMessage('')
        setApproval(resp.data)
        await getPayable(data)
        router.push('/aprovar/detalhes')
        setCookie(null, 'ApprovalsPayableId', String(data.payableId), {
          maxAge: 30 * 24 * 60 * 60,
          path: '/',
        })
        setCookie(null, 'ApprovalsPassword', data.password, {
          maxAge: 30 * 24 * 60 * 60,
          path: '/',
        })
      } else {
        setErrorMessage(resp.error)
      }
    } catch (error) {
      console.error(error)
      setErrorMessage((error as Error).message)
    }
  }

  const onApprove: SubmitHandler<approval> = async (data) => {
    setIsSubmitting(true)
    try {
      if (!approval) return
      const resp = await approvePayable(approval.id, data)
      if (resp.status === HttpStatusCode.Ok) {
        setSuccess(true)
        setErrorMessage('')
      } else {
        setSuccess(false)
        setErrorMessage(resp.error)
      }
    } catch (error) {
      console.error(error)
      setErrorMessage((error as Error).message)
    } finally {
      modalConfirmDisclosure.onOpen()
      setIsSubmitting(false)
    }
  }

  const getPayable = async (credentials: credentials) => {
    try {
      const { data } = await getPayableForApprovalById(credentials)
      if (data) {
        const plainData = data
        setPayable({
          ...plainData,
          approvers: plainData.approvals
            .filter(({ collaborator }) => collaborator)
            .map(({ collaborator }) => collaborator.id),
          recurenceData: {
            recurrenceType: plainData.recurenceData?.recurrenceType,
            startDate: handleDates(plainData.recurenceData?.startDate),
            endDate: handleDates(plainData.recurenceData?.endDate),
            dueDay: plainData.recurenceData?.dueDay ?? 0,
          },
          dueDate: handleDates(plainData.dueDate),
          paymentDate: handleDates(plainData.paymentDate),
        })
      }
    } catch (error) {
      console.error(error)
      setErrorMessage((error as Error).message)
    }
  }

  const getBasicAuthHeader = () =>
    'Basic ' + btoa(credentials?.payableId + ':' + credentials?.password)

  const credentialsValidated = (): void => {
    if (!approval) {
      router.back()
    }
  }
  return (
    <ApprovalsContext.Provider
      value={{
        payable,
        approval,
        errorMessage,
        isSubmitting,
        modalConfirmDisclosure,
        success,
        onAccess,
        onApprove,
        credentialsValidated,
        setErrorMessage,
        getBasicAuthHeader,
        credentials,
      }}
    >
      {children}
    </ApprovalsContext.Provider>
  )
}

export const useApproval = () => {
  const context = useContext(ApprovalsContext)
  if (!context) {
    throw new Error('ApprovalsProvider não fornecido.')
  }
  return context
}
