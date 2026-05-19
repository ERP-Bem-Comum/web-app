import CardLogin from '@/components/auth/CardLogin'
import FormNewPassword from '@/components/auth/FormNewPassword'

type Props = {
  searchParams?: Record<'token', string>
}

export default async function NewPassword({ searchParams }: Props) {
  return (
    <div>
      <CardLogin title={'Redefinição de Senha'}>
        <FormNewPassword token={searchParams?.token} />
      </CardLogin>
    </div>
  )
}
