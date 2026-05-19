import CardLogin from '@/components/auth/CardLogin'
import FormRecovery from '@/components/auth/FormRecovery'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { nextAuthOptions } from '@/app/api/auth/[...nextauth]/route'

export default async function RecoveryPassword() {
  const session = await getServerSession(nextAuthOptions)

  if (session?.user) {
    redirect('/')
  }
  return (
    <div>
      <CardLogin title={'Recuperar Senha'}>
        <FormRecovery />
      </CardLogin>
    </div>
  )
}
