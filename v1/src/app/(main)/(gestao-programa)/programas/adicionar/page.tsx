import TopPages from '@/components/TopPages'
import FormProgram from '@/components/programs/FormProgram'

export default function AddProgram() {
  return (
    <div className="w-full h-full">
      <TopPages text={'Novo Programa'} />
      <FormProgram program={null} edit={true} />
    </div>
  )
}
