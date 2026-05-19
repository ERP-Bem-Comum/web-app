import { useState } from 'react'
import { useDisclosure } from './useDisclosure'
import {
  CreateCard,
  CreateMovimentation,
  deleteCard,
  deleteMovimentation,
  ProcessMovimentations,
  updateCard,
  updateMovimentation,
} from '@/services/creditCard'
import {
  defaultParamsCreditCardFunctions,
  ParamsCreditCardMov,
  useCreditCardReturn,
} from '@/types/creditCard'
import { HttpStatusCode } from 'axios'

const useCreditCard = (): useCreditCardReturn => {
  const [isDisabled, setIsDisabled] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const {
    isOpen: isOpenModalShowConfirm,
    onOpen: onOpenModalShowConfirm,
    onClose: onCloseModalShowConfirm,
  } = useDisclosure()

  const {
    isOpen: isOpenModalQuestion,
    onOpen: onOpenModalQuestion,
    onClose: onCloseModalQuestion,
  } = useDisclosure()

  const {
    isOpen: isOpenModalConfirmDelete,
    onOpen: onOpenModalConfirmDelete,
    onClose: onCloseModalConfirmDelete,
  } = useDisclosure()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const genericRequest = <T extends (...args: any[]) => any>(paramFunc: T) => {
    const func = async ({ e, ...rest }: Partial<defaultParamsCreditCardFunctions<unknown>>) => {
      if (e) {
        e.preventDefault()
      }
      setIsDisabled(true)
      try {
        const response = await paramFunc(rest)
        if (response && response?.error !== '') {
          setSuccess(false)
          setErrorMessage(response.error)
        } else {
          setSuccess(true)
        }
      } catch (err) {
        setIsDisabled(false)
      } finally {
        setIsDisabled(false)
      }

      onOpenModalShowConfirm()
    }

    return func
  }
  const createCreditCard = genericRequest(CreateCard)

  const createMov = genericRequest(CreateMovimentation)

  const updateCreditCard = genericRequest(updateCard)

  const updateMov = genericRequest(updateMovimentation)

  const deleteCreditCard = genericRequest(deleteCard)

  const deleteMov = genericRequest(deleteMovimentation)

  const processMov = async (data: ParamsCreditCardMov) => {
    setIsDisabled(true)
    try {
      const response = await ProcessMovimentations(data)
      if (response.status !== HttpStatusCode.Created) {
        setSuccess(false)
        setErrorMessage(response.error)
      } else {
        setSuccess(true)
      }
      return response.data
    } catch (err) {
      setIsDisabled(false)
    } finally {
      setIsDisabled(false)
      onOpenModalShowConfirm()
    }
  }

  return {
    isDisabled,
    success,
    errorMessage,
    modals: {
      isOpenModalShowConfirm,
      onOpenModalShowConfirm,
      onCloseModalShowConfirm,
      isOpenModalQuestion,
      onOpenModalQuestion,
      onCloseModalQuestion,
      isOpenModalConfirmDelete,
      onOpenModalConfirmDelete,
      onCloseModalConfirmDelete,
    },
    form: {
      createCreditCard,
      createMov,
      updateCreditCard,
      updateMov,
      deleteCreditCard,
      deleteMov,
      processMov,
    },
  }
}

export default useCreditCard
