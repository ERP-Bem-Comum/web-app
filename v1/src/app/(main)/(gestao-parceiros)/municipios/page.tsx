import TopPages from '@/components/TopPages'
import ListCities from '@/components/partners/cities/ListCities'

export default function Cities() {
  return (
    <div className="w-full h-full overflow-auto">
      <TopPages isReturn={false} text={'Municípios Parceiros'} />
      <ListCities />
    </div>
  )
}
