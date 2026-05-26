'use client'
import { ApprovalsProvider } from '@/contexts/approvalsContext'
import { AUTH_BYPASS_ENABLED, authBypassSession } from '@/utils/authBypass'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from 'lib/react-query'
import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'


/* ═══════════════════════════════════════════════════════════
   Tema MUI — alinhado à identidade institucional
   Fonte base: Nunito (corpo/textos longos)
   Fonte labels: Inter via CSS Modules
   ═══════════════════════════════════════════════════════════ */
const muiTheme = createTheme({
  typography: {
    fontFamily: 'var(--font-nunito), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 14,
    htmlFontSize: 16,
  },
  palette: {
    primary: {
      main: '#396496',
      dark: '#2d4f75',
      light: '#8bb0d6',
      contrastText: '#ffffff',
    },
    success: {
      main: '#1f7d55',
      dark: '#176642',
      light: 'rgba(31, 125, 85, 0.10)',
      contrastText: '#ffffff',
    },
  },

})

interface Props {
  children: ReactNode
}
function Providers({ children }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <SessionProvider session={AUTH_BYPASS_ENABLED ? authBypassSession : undefined}>
        <ApprovalsProvider>
          <ThemeProvider theme={muiTheme}>
            {children}
          </ThemeProvider>
        </ApprovalsProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}

export default Providers
