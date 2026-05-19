import { nextAuthOptions } from '@/app/api/auth/[...nextauth]/route'
import CardLogin from '@/components/auth/CardLogin'
import FormLogin from '@/components/auth/FormLogin'
import { AUTH_BYPASS_ENABLED } from '@/utils/authBypass'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

type Props = {
  searchParams?: Record<'callbackUrl' | 'error', string>
}

export default async function Login(props: Props) {
  if (AUTH_BYPASS_ENABLED) {
    redirect('/')
  }

  const session = await getServerSession(nextAuthOptions)

  if (session?.user) {
    redirect('/')
  }

  return (
    <div>
      <CardLogin title={'Login'}>
        <FormLogin error={props.searchParams?.error} />
      </CardLogin>
    </div>
  )
}
