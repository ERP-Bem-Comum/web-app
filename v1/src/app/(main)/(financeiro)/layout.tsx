'use client'
import { PayablesProvider } from '@/contexts/payablesContext'
import { ReceivableProvider } from '@/contexts/receivablesContext'
import { ReactNode } from 'react'

interface FinanceiroLayoutProps {
  children: ReactNode
}

const FinanceiroLayout = ({ children }: FinanceiroLayoutProps) => {
  return (
    <ReceivableProvider>
      <PayablesProvider>{children}</PayablesProvider>
    </ReceivableProvider>
  )
}

export default FinanceiroLayout
