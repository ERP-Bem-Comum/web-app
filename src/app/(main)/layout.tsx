import Navigation from '@/components/layout/main/Navigation'
import PageContainer from '@/components/layout/main/PageContainer'
import TopMain from '@/components/layout/main/TopMain'
import { AUTH_BYPASS_ENABLED, authBypassSession } from '@/utils/authBypass'
import { getServerSession } from 'next-auth'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { nextAuthOptions } from '../api/auth/[...nextauth]/route'

export const dynamic = 'force-dynamic'

export default async function LayoutMain({ children }: { children: React.ReactNode }) {
  const session = AUTH_BYPASS_ENABLED ? authBypassSession : await getServerSession(nextAuthOptions)

  if (!session?.user) {
    console.log('redirected')
    redirect('/login')
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-erp-background">
      <div className="bg-white w-full h-[56px] flex justify-between items-center shadow-[0_4px_22px_0px_rgba(0,0,0,0.05)] ps-3 pe-7 z-50">
        <div className="  ">
          <Image src="/images/logo-bem-comum.png" alt="Logo" width={32} height={32} />
        </div>
        <TopMain user={session?.user} />
      </div>
      <div className="flex" style={{ height: 'calc(100vh - 56px)' }}>
        <Navigation />
        <PageContainer>{children}</PageContainer>
      </div>
    </div>
  )
}
