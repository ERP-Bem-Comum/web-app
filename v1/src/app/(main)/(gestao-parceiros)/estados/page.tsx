import TopPages from '@/components/TopPages'
import ListStates from '@/components/partners/states/ListStates'

export default function States() {
  return (
    <div className="w-full h-full overflow-auto">
      <TopPages isReturn={false} text={'Estados Parceiros'} />
      <ListStates />
    </div>
  )
}
