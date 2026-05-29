import { createBankAccount, updateBankAccount } from '@/services/bankAccount'
import { BankAccount, useBankAccountsReturn } from '@/types/bankAccount'
import { BaseSyntheticEvent, useState } from 'react'
import { useDisclosure } from './useDisclosure'
import { queryClient } from 'lib/react-query'
import { HttpStatusCode } from 'axios'
import { getBalance } from '@/services/apiBradesco'

const useBankAccounts = (): useBankAccountsReturn => {
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
    isOpen: isOpenAwaitModal,
    onOpen: onOpenAwaitModal,
    onClose: onCloseAwaitModal,
  } = useDisclosure()

  const onSubmit = async (
    data: BankAccount,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    e?: BaseSyntheticEvent<object, any, any>,
    id?: number,
  ) => {
    if (e) {
      e.preventDefault()
    }
    setIsDisabled(true)

    let response
    try {
      if (id) {
        response = await updateBankAccount(id, data)
      } else {
        response = await createBankAccount(data)
      }
    } catch (err) {
      setIsDisabled(false)
    } finally {
      setIsDisabled(false)
    }

    if (response && response?.error !== '') {
      setSuccess(false)
      setErrorMessage(response.error)
    } else {
      setSuccess(true)
      queryClient.invalidateQueries({
        queryKey: ['bankAccountById', id],
        exact: true,
      })
      queryClient.invalidateQueries({
        queryKey: ['bankAccounts'],
      })
      queryClient.refetchQueries({
        queryKey: ['accountsOptions'],
      })
    }

    onOpenModalShowConfirm()
  }

  const UpdateInitialbalance = async (
    { accountNumber, agency }: BankAccount,
    enableInitialbalance: () => void,
    setValue: (balance: number) => void,
  ) => {
    try {
      if (accountNumber && agency) {
        onOpenAwaitModal()
        const resp = await getBalance({
          agencia: Number(agency.split('-')[0]),
          conta: Number(accountNumber),
        })

        const balance = resp.data?.balance

        if (resp.status !== HttpStatusCode.Ok || !balance) {
          enableInitialbalance()
        } else {
          setValue(balance)
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      onCloseAwaitModal()
    }
  }

  return {
    isDisabled,
    success,
    errorMessage,
    UpdateInitialbalance,
    modals: {
      isOpenModalShowConfirm,
      onOpenModalShowConfirm,
      onCloseModalShowConfirm,
      isOpenModalQuestion,
      onOpenModalQuestion,
      onCloseModalQuestion,
      isOpenAwaitModal,
    },
    form: { onSubmit },
  }
}

export default useBankAccounts
