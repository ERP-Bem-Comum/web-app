import TopPages from '@/components/TopPages'
import FormUser from '@/components/user/FormUser'

export default function AddUser() {
  return (
    <div className="w-full h-full">
      <TopPages text={'Novo Usuário'} />
      <FormUser user={null} edit={true} />
    </div>
  )
}
