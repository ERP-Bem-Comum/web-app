'use client'
import { ApprovalsProvider } from '@/contexts/approvalsContext'
import { PayablesProvider } from '@/contexts/payablesContext'
import { ReactNode } from 'react'

interface AprovarLayoutProps {
  children: ReactNode
}

const AprovarLayout = ({ children }: AprovarLayoutProps) => {
  return (
    <ApprovalsProvider>
      <PayablesProvider>{children}</PayablesProvider>
    </ApprovalsProvider>
  )
}

export default AprovarLayout
