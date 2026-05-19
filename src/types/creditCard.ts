import { abstractType } from './global'
import { z } from 'zod'
import {
  creditCardMovimentationSchema,
  creditCardMovParamsSchema,
  creditCardSchema,
} from '@/validators/creditCard'
import { MovimentationStatus } from '@/enums/creditCard'
import { PaginateParams } from './paginateParams'
import { BaseSyntheticEvent } from 'react'

export type ParamsCreditCard = {
  paginationParams: PaginateParams
  search: string
}

export type ParamsCreditCardMov = z.infer<typeof creditCardMovParamsSchema>

export type CreateCreditCard = z.infer<typeof creditCardSchema>

export type CreateCreditCardMov = z.infer<typeof creditCardMovimentationSchema>

export type CreditCard = abstractType & CreateCreditCard

export type CreditCardMov = abstractType &
  CreateCreditCardMov & {
    referenceDate: string
    currentInstallment: number
    payableId: number | null
    status: MovimentationStatus
    installmentId: string
  }

export type defaultParamsCreditCardFunctions<T> = {
  id: number | string
  data: T
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  e?: BaseSyntheticEvent<object, any, any>
}

type genericFunction = (params: Partial<defaultParamsCreditCardFunctions<unknown>>) => Promise<void>
export interface useCreditCardReturn {
  isDisabled: boolean
  success: boolean
  errorMessage: string
  modals: {
    isOpenModalShowConfirm: boolean
    onOpenModalShowConfirm: () => void
    onCloseModalShowConfirm: () => void
    isOpenModalQuestion: boolean
    onOpenModalQuestion: () => void
    onCloseModalQuestion: () => void
    isOpenModalConfirmDelete: boolean
    onOpenModalConfirmDelete: () => void
    onCloseModalConfirmDelete: () => void
  }

  form: {
    createCreditCard: genericFunction
    createMov: genericFunction
    updateCreditCard: genericFunction
    updateMov: genericFunction
    deleteCreditCard: genericFunction
    deleteMov: genericFunction
    processMov: (data: ParamsCreditCardMov) => Promise<{ payableId: number } | undefined>
  }
}
