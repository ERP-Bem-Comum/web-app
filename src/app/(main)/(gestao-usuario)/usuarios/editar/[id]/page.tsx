'use client'

import TopPages from '@/components/TopPages'
import FormUser from '@/components/user/FormUser'
import { useGetUserById } from '@/services/user'
import { useParams } from 'next/navigation'

export default function AddUser() {
  const params = useParams()
  const { data, isLoading: isLoadingUsers } = useGetUserById(params?.id)

  return (
    <div className="w-full h-full">
      <TopPages text={'Usuários > Editar Usuário'} />
      {!isLoadingUsers && <FormUser user={data?.user} edit={true} />}
    </div>
  )
}
