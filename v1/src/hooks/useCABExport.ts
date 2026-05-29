import { generateCnab } from '@/services/exportCNAB'
import { useDisclosure } from './useDisclosure'
import { useState } from 'react'
import { HttpStatusCode } from 'axios'

const useCNABExport = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Array<number>>([])

  const {
    onOpen: onOpenModalAwait,
    onClose: onCloseModalAwait,
    isOpen: isOpenModalAwait,
  } = useDisclosure()

  const { onOpen: onOpenConfirm, onClose: onCloseConfirm, isOpen: isOpenConfirm } = useDisclosure()
  const handleSelect = (id: number, isSelected: boolean) => {
    if (isSelected) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id))
    }
  }

  const onSubmit = async () => {
    onOpenModalAwait()
    try {
      if (selectedIds.length === 0) {
        throw new Error('Nenhuma conta selecionada.')
      }

      const res = await generateCnab(selectedIds)
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
      onCloseModalAwait()
      onOpenConfirm()
    }
  }

  return {
    handleSelect,
    onSubmit,
    selectedIds,
    errorMessage,
    modal: {
      isOpenModalAwait,
      onCloseConfirm,
      isOpenConfirm,
    },
  }
}

export { useCNABExport }
