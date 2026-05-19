import { useDisclosure } from './useDisclosure'
import { useState } from 'react'
import { HttpStatusCode } from 'axios'
import { approveManyPayable } from '@/services/payables'
import { ApproveManyPayables } from '@/types/approvals'
import { queryClient } from 'lib/react-query'

const useMassApprovals = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Array<number>>([])
  const [obs, setObs] = useState<string>('')
  const [isAllChecked, setIsAllChecked] = useState(false)

  const {
    onOpen: onOpenModalAwait,
    onClose: onCloseModalAwait,
    isOpen: isOpenModalAwait,
  } = useDisclosure()

  const {
    onOpen: startIsSubmitting,
    onClose: stopIsSubmitting,
    isOpen: isSubmitting,
  } = useDisclosure()

  const { onOpen: onOpenConfirm, onClose: onCloseConfirm, isOpen: isOpenConfirm } = useDisclosure()

  const onSubmit = async (approved = false) => {
    onOpenModalAwait()
    try {
      startIsSubmitting()
      if (selectedIds.length === 0) {
        throw new Error('Nenhuma conta selecionada.')
      }

      const data: ApproveManyPayables = {
        approved,
        obs,
      }

      const res = await approveManyPayable(selectedIds, data)
      if (res.status !== HttpStatusCode.Ok) {
        setErrorMessage(res.error)
      } else {
        setErrorMessage(null)
      }
    } catch (error) {
      console.error(error)
      setErrorMessage((error as Error).message)
    } finally {
      setSelectedIds([])
      setObs('')
      setIsAllChecked(false)
      onCloseModalAwait()
      onOpenConfirm()
      stopIsSubmitting()
      queryClient.invalidateQueries({ queryKey: ['filteredPayables'] })
    }
  }

  return {
    setSelectedIds,
    onSubmit,
    setObs,
    setIsAllChecked,
    isAllChecked,
    selectedIds,
    errorMessage,
    isSubmitting,
    obs,
    modal: {
      isOpenModalAwait,
      onCloseConfirm,
      isOpenConfirm,
    },
  }
}

export { useMassApprovals }
