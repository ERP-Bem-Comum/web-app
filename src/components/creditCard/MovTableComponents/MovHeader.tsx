import { SubmitButton } from '@/components/layout/Buttons/SubmitButton'
import { FilterDate } from '@/components/layout/FilterComponents/FilterDate'
import { Label } from '@/components/layout/Label'
import { ModalCreditCard } from '@/components/modals/creditCard/ModalCreditCard'
import { useDisclosure } from '@/hooks/useDisclosure'
import { getMovCsv, getMovPDF, useGetCreditCardById } from '@/services/creditCard'
import { ParamsCreditCardMov } from '@/types/creditCard'
import { maskMonetaryValue } from '@/utils/masks'
import { useForm } from 'react-hook-form'
import { ExportButtonMov } from './exportButton'
import { zodResolver } from '@hookform/resolvers/zod'
import { creditCardMovParamsSchema } from '@/validators/creditCard'
import { saveAs } from 'file-saver'
import { Dispatch, SetStateAction, useState } from 'react'
import { ModalNewMov } from '@/components/modals/creditCard/ModalNewMov'
import useCreditCard from '@/hooks/useCreditCard'
import { ModalConfirm } from '@/components/modals/ModalConfirm'
import { OutlineButton } from '@/components/layout/Buttons/OutlineButton'
import { useRouter } from 'next/navigation'
import { ModalAwait } from '@/components/modals/ModalAwait'

interface CreditCardSearchProps {
  cardId: number
  isLoadingFilteredData: boolean
  totalValue?: number
  paramState: [ParamsCreditCardMov, Dispatch<SetStateAction<ParamsCreditCardMov>>]
}

const MovHeader = ({
  cardId,
  isLoadingFilteredData,
  totalValue,
  paramState,
}: CreditCardSearchProps) => {
  const [params, setParams] = paramState
  const [payableId, setPayableId] = useState<number>()
  const { data: cardData } = useGetCreditCardById(cardId)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isOpenAwait, onOpen: onOpenAwait, onClose: onCloseAwait } = useDisclosure()
  const newMovDisclosure = useDisclosure()
  const card = cardData?.data
  const router = useRouter()
  const {
    form: { processMov },
    modals,
    isDisabled,
    errorMessage,
    success,
  } = useCreditCard()

  const {
    control,
    watch,
    formState: { errors },
  } = useForm<ParamsCreditCardMov>({
    resolver: zodResolver(creditCardMovParamsSchema),
    defaultValues: params,
  })

  const values = watch()

  const handleFilter = () => {
    setParams({ ...values })
  }

  const handleExportCSV = async () => {
    const resp = await getMovCsv(values)
    if (resp.data) {
      saveAs(resp?.data, 'movimentações.csv')
    }
  }

  const handleExportPDF = async () => {
    const resp = await getMovPDF(values)
    if (resp.data) {
      saveAs(resp.data, 'movimentações.pdf')
    }
  }

  const confirmMessage = () => {
    if (errorMessage) {
      return errorMessage
    }
    return `Fatura gerada com sucesso!`
  }

  const handleProcess = async () => {
    onOpenAwait()
    const response = await processMov(params)
    setPayableId(response?.payableId)
    onCloseAwait()
  }

  return (
    <div className="flex h-full rounded-lg border bg-card text-card-foreground shadow-sm p-5">
      <div className="flex justify-around items-stretch w-full h-full">
        <div className="p-5 max-w-[35%] flex flex-col gap-2 items-start justify-between">
          <div className="flex flex-col w-full">
            <Label className="truncate w-full">Instituição: {card?.instituition}</Label>
            <Label>Nome: {card?.name}</Label>
            <Label>Responsável: {card?.responsible}</Label>
          </div>
          <div className="flex gap-5">
            <SubmitButton
              createLabel="Processar"
              edit={false}
              disabled={isDisabled}
              editLabel=""
              onClick={handleProcess}
            />

            <OutlineButton label="Editar" onClick={onOpen} disabled={isDisabled} />
          </div>
        </div>
        <div className="border border-b border-erp-divide" />
        <div className="p-5">
          <Label>Fatura atual para o periodo:</Label>
          <Label>{maskMonetaryValue(totalValue ?? 0)}</Label>
        </div>
        <div className="border border-b border-erp-divide" />
        <div className="p-5 flex gap-5 min-w-fit">
          <FilterDate
            control={control}
            label="Período"
            field="dueBetween"
            error={errors.dueBetween?.message}
            width="100"
            clearable={false}
          />
          <div className="flex flex-col gap-5 h-full justify-between">
            <SubmitButton
              createLabel="Filtrar"
              edit={false}
              editLabel=""
              onClick={handleFilter}
              disabled={isLoadingFilteredData}
            />
            <ExportButtonMov
              handleExportCSV={handleExportCSV}
              handleExportPDF={handleExportPDF}
              className="w-full"
            />
          </div>
        </div>
        <div className="p-5">
          <SubmitButton
            createLabel="Lançar despesa"
            edit={false}
            editLabel=""
            onClick={newMovDisclosure.onOpen}
          />
        </div>
        <ModalCreditCard creditCard={card ?? null} onClose={onClose} open={isOpen} />
        <ModalNewMov cardId={cardId} edit {...newMovDisclosure} />
        <ModalAwait open={isOpenAwait} text="Processando..." />
        <ModalConfirm
          open={modals.isOpenModalShowConfirm}
          onClose={() => {
            modals.onCloseModalShowConfirm()
            modals.onCloseModalQuestion()
            success && router.push(`/contas-pagar/editar/${payableId}`)
            onClose()
          }}
          text={confirmMessage()}
          success={success}
        />
      </div>
    </div>
  )
}

export { MovHeader }
