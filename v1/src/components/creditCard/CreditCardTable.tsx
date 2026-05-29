'use client'

import { useForm } from 'react-hook-form'
import { ParamsCreditCard } from '@/types/creditCard'
import { CreditCard } from './CardTableComponents'
import { useDisclosure } from '@/hooks/useDisclosure'
import { ModalCreditCard } from '../modals/creditCard/ModalCreditCard'

export default function CreditCardTable() {
  const { setValue, control, watch } = useForm<ParamsCreditCard>()
  const { isOpen, onClose, onOpen } = useDisclosure()

  return (
    <CreditCard.root>
      <CreditCard.header control={control} onOpen={onOpen} />
      <CreditCard.body params={watch()} setValue={setValue} />
      <ModalCreditCard creditCard={null} onClose={onClose} open={isOpen} />
    </CreditCard.root>
  )
}
