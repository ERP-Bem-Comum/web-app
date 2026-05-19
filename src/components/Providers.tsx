'use client'
import { ApprovalsProvider } from '@/contexts/approvalsContext'
import { AUTH_BYPASS_ENABLED, authBypassSession } from '@/utils/authBypass'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from 'lib/react-query'
import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}
function Providers({ children }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <SessionProvider session={AUTH_BYPASS_ENABLED ? authBypassSession : undefined}>
        <ApprovalsProvider>{children}</ApprovalsProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}

export default Providers
