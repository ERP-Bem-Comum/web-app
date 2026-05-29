'use client'

import { ParamsCreditCardMov } from '@/types/creditCard'
import { useGetMovimentations } from '@/services/creditCard'
import { addMonths } from 'date-fns'
import { useCallback, useState } from 'react'
import { CardMov } from './MovTableComponents'
import { MovimentationStatus } from '@/enums/creditCard'
import { useSession } from 'next-auth/react'

export default function MovTable({ id }: { id: number }) {
  const { data: session } = useSession()
  const [params, setParams] = useState<ParamsCreditCardMov>({
    dueBetween: {
      start: addMonths(new Date(), -1),
      end: new Date(),
    },
    cardId: id,
    userId: session?.user.id ?? -1,
  })

  const { data, isLoading } = useGetMovimentations(params)

  const totalValue = useCallback(() => {
    return data?.data?.reduce(
      (acc, mov) => (mov.status === MovimentationStatus.OPEN ? acc + mov.value : 0),
      0,
    )
  }, [data])

  return (
    <CardMov.root>
      <CardMov.header
        cardId={id}
        isLoadingFilteredData={isLoading}
        totalValue={totalValue()}
        paramState={[params, setParams]}
      />
      <CardMov.body cardMovs={data?.data} isLoadingMovs={isLoading} cardId={id} />
    </CardMov.root>
  )
}
