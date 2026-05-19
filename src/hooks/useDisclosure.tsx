import { useEffect, useState } from 'react'

export const useDisclosure = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState)

  useEffect(() => {
    if (isOpen !== initialState) {
      setIsOpen(initialState)
    }
  }, [initialState])

  const onOpen = () => {
    setIsOpen(true)
  }

  const onClose = () => {
    setIsOpen(false)
  }

  const toggle = () => {
    if (isOpen) {
      onClose()
    } else {
      onOpen()
    }
  }

  return { isOpen, onOpen, onClose, toggle }
}
