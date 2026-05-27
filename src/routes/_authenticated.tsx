import { createFileRoute, Outlet, Link } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import PageContainer from '@/components/layout/main/PageContainer'

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout({ data: undefined })
    window.location.href = '/login'
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-erp-background">
      <div className="bg-white w-full h-[56px] flex justify-between items-center shadow-[0_4px_22px_0px_rgba(0,0,0,0.05)] ps-3 pe-7 z-50">
        <div>
          <img src="/images/logo-bem-comum.png" alt="Logo" width={32} height={32} />
        </div>
        <div className="h-full flex justify-end items-center gap-4 z-10">
          <span className="text-sm">Olá, {user?.name ?? 'Visitante'}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-700 font-medium"
          >
            Sair
          </button>
        </div>
      </div>
      <div className="flex" style={{ height: 'calc(100vh - 56px)' }}>
        <nav className="flex bg-erp-nav w-fit hover:w-fit transition-all ease-in-out duration-300 shadow-[0_4px_16px_0px_rgba(0,0,0,0.10)]">
          <ul className="text-white py-4 px-2 space-y-2 min-w-[200px]">
            <li>
              <Link
                to="/contratos"
                className="block px-4 py-2 rounded hover:bg-[#009FD0] transition-colors [&.active]:bg-[#E8EEF0] [&.active]:text-erp-nav"
              >
                Contratos
              </Link>
            </li>
          </ul>
        </nav>
        <PageContainer>
          <Outlet />
        </PageContainer>
      </div>
    </div>
  )
}
