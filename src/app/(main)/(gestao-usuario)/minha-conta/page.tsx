import { nextAuthOptions } from '@/app/api/auth/[...nextauth]/route'
import TopPages from '@/components/TopPages'
import CardDetail from '@/components/minha-conta/CardDetail'
import { getServerSession } from 'next-auth'

export default async function MyAccount() {
  const session = await getServerSession(nextAuthOptions)

  return (
    <div className="w-full h-full">
      <TopPages text={'Minha Conta'} isReturn={false} />
      <CardDetail user={session?.user} />
    </div>
  )
}
