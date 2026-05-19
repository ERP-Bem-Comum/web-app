'use client'
import TopPages from '@/components/TopPages'
import FormUser from '@/components/user/FormUser'
import { useGetUserById } from '@/services/user'
import { useParams } from 'next/navigation'

export default function UserDetails() {
  const params = useParams()

  const { data, isLoading: isLoadingUsers } = useGetUserById(params?.id)

  return (
    <div className="w-full h-full">
      <TopPages text={'Usuários > Detalhes'} />
      {!isLoadingUsers && <FormUser user={data?.user} edit={false} />}
    </div>
  )
}
