import { LoadingTable } from '@/components/table/loadingTable'
import { CreditCardMov } from '@/types/creditCard'
import { MovTransactionCard } from './MovTransactionCard'
import { useGetMovimentationById } from '@/services/creditCard'
import { ModalNewMov } from '@/components/modals/creditCard/ModalNewMov'
import { useDisclosure } from '@/hooks/useDisclosure'
import { Box } from '@mui/material'
import { ContentSection } from './ContentSection'
import { useState } from 'react'

interface MovBodyProps {
  cardMovs?: CreditCardMov[]
  isLoadingMovs: boolean
  cardId: number
}

const MovBody = ({ cardMovs, isLoadingMovs, cardId }: MovBodyProps) => {
  const [selectedId, setSelectedId] = useState<number>()
  const editMovDiscolsure = useDisclosure()

  const { data, isLoading } = useGetMovimentationById(selectedId)

  const handleSelectMov = (id: number) => {
    setSelectedId(id)
    editMovDiscolsure.onOpen()
  }
  return (
    <Box className="mt-10">
      <ContentSection>
        <div className="w-full flex mb-5">
          <p className="flex-1 ml-5">Lançamentos do periodo:</p>
        </div>
        {isLoadingMovs ? (
          <LoadingTable />
        ) : (
          <ul className="flex flex-col gap-y-5 ml-5 overflow-auto">
            {cardMovs && cardMovs.length > 0 ? (
              cardMovs?.map((row) => (
                <MovTransactionCard
                  {...row}
                  key={'mov' + row.id}
                  onClick={() => handleSelectMov(row.id)}
                />
              ))
            ) : (
              <li className="py-5 text-center text-gray-600">Nenhum lançamento para o periodo</li>
            )}
          </ul>
        )}
      </ContentSection>
      <ModalNewMov
        cardId={cardId}
        edit
        movimentation={data?.data}
        {...editMovDiscolsure}
        isLoading={isLoading}
      />
    </Box>
  )
}

export { MovBody }
