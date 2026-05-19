import { payablesContext } from '@/contexts/payablesContext'
import { useContext } from 'react'

export const usePayableContext = () => {
  const context = useContext(payablesContext)
  if (!context) {
    throw new Error('Payable provider não fornecido.')
  }
  return context
}
