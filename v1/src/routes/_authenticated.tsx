import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import PageContainer from '@/components/layout/main/PageContainer'
import TopMain from '@/components/layout/main/TopMain'
import Navigation from '@/components/layout/main/Navigation'

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { isLoading, isAuthenticated } = useAuth()
  const navigate = Route.useNavigate()

  // Proteção de rota: redireciona para login se não autenticado
  if (!isLoading && !isAuthenticated) {
    navigate({ to: '/login', replace: true })
    return null
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-erp-background">
      <div className="bg-white w-full h-[56px] flex justify-between items-center shadow-[0_4px_22px_0px_rgba(0,0,0,0.05)] ps-3 pe-7 z-50">
        <div>
          <img src="/images/logo-bem-comum.png" alt="Logo" width={32} height={32} />
        </div>
        <TopMain />
      </div>
      <div className="flex" style={{ height: 'calc(100vh - 56px)' }}>
        <Navigation />
        <PageContainer>
          <Outlet />
        </PageContainer>
      </div>
    </div>
  )
}
