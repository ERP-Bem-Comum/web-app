import Dashboard from '@/components/dashboard/Dashboard'
import TopPages from '@/components/TopPages'

export default function Home() {
  return (
    // deploy
    <div className="w-full h-full overflow-auto">
      <TopPages isReturn={false} text={'Dashboard - Resumo Mensal'} />
      <Dashboard />
    </div>
  )
}
