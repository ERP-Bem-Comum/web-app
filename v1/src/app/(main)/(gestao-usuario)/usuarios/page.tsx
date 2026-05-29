import TopPages from '@/components/TopPages'
import UsersTable from '@/components/user/UsersTable'

export default function Users() {
  return (
    <div className="w-full h-full overflow-auto">
      <TopPages isReturn={false} text={'Usuários'} />
      <UsersTable />
    </div>
  )
}
