import { approvalSchema, credentialsSchema } from '@/validators/approval'
import { Dispatch, SetStateAction } from 'react'
import { SubmitHandler } from 'react-hook-form'
import { z } from 'zod'
import { IPayables } from './Payables'

export interface ICredentialsApprovePayable {
  payableId: number
  password: string
}

export interface IApproval {
  id: number
  collaboratorId: number
  approved: boolean
  obs?: string | undefined | null
}

export interface IApprove {
  payableId: number
  approved: boolean
  obs?: string | undefined | null
}

export interface ApproveManyPayables {
  approved: boolean
  obs?: string | undefined | null
}

export type credentials = z.infer<typeof credentialsSchema>

export type approval = z.infer<typeof approvalSchema>

export interface ApprovalsContextProps {
  approval?: IApproval
  errorMessage: string
  isSubmitting: boolean
  success: boolean
  modalConfirmDisclosure: {
    isOpen: boolean
    onOpen: () => void
    onClose: () => void
  }
  onAccess: SubmitHandler<credentials>
  onApprove: SubmitHandler<approval>
  credentialsValidated: () => void
  setErrorMessage: Dispatch<SetStateAction<string>>
  getBasicAuthHeader: () => string
  credentials: credentials | null
  payable: IPayables | null
}
