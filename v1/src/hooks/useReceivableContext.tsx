import { receivablesContext } from '@/contexts/receivablesContext'
import { useContext } from 'react'

export const useReceivableContext = () => {
  const context = useContext(receivablesContext)
  if (!context) {
    throw new Error('Receivable provider não fornecido.')
  }
  return context
}
