'use client'
import { ContractsProvider } from '@/contexts/contractsContext'
import { ReactNode } from 'react'

interface ContratosLayoutProps {
  children: ReactNode
}

const ContratosLayout = ({ children }: ContratosLayoutProps) => {
  return <ContractsProvider>{children}</ContractsProvider>
}

export default ContratosLayout
