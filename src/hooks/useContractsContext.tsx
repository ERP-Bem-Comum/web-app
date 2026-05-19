import { contractContext } from '@/contexts/contractsContext'
import { useContext } from 'react'

export const useContractContext = () => {
  const context = useContext(contractContext)
  if (!context) {
    throw new Error('Contracts provider não fornecido.')
  }
  return context
}
