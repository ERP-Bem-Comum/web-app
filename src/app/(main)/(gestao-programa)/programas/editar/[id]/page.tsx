'use client'

import TopPages from '@/components/TopPages'
import FormProgram from '@/components/programs/FormProgram'
import { useGetProgramById } from '@/services/programs'
import { useParams } from 'next/navigation'

export default function AddProgram() {
  const params = useParams()
  const { data, isLoading: isLoadingPrograms } = useGetProgramById(params?.id)

  return (
    <div className="w-full h-full">
      <TopPages text={'Programas > Editar Programa'} />
      {!isLoadingPrograms && <FormProgram program={data?.program} edit={true} />}
    </div>
  )
}
