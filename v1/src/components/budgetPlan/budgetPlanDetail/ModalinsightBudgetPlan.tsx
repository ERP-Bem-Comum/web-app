import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { useGetBudgetPlanInsight } from '@/services/budgetPlan'
import { useGetBudgetPlanInsightShared } from '@/services/budgetPlanShared'
import { DataForInsights } from '@/types/budgetPlan'
import { Box, Modal } from '@mui/material'
import { Fragment, useEffect, useState } from 'react'
import { MdOutlineArrowDownward, MdOutlineArrowUpward, MdOutlineClose } from 'react-icons/md'
import { GraphInsight } from './GraphInsight'

interface Props {
  open: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClose: any
  budgetId: number
  shared?: boolean
}

export function ModalInsightBudgetPlan({ open, onClose, budgetId, shared = false }: Props) {
  const [listData, setListData] = useState<DataForInsights[]>([])
  const [columnSelect, setColumnSelect] = useState<number>(0)

  const { data } = useGetBudgetPlanInsight(budgetId, !shared)

  const { data: dataShared } = useGetBudgetPlanInsightShared(budgetId, shared)

  useEffect(() => {
    if (!shared) {
      if (data?.data) {
        setListData(data?.data.sort((a: DataForInsights, b: DataForInsights) => a.year - b.year))
        setColumnSelect(data?.data.length - 1)
      }
    } else {
      if (dataShared?.data) {
        setListData(
          dataShared?.data.sort((a: DataForInsights, b: DataForInsights) => a.year - b.year),
        )
        setColumnSelect(dataShared?.data.length - 1)
      }
    }
  }, [data, dataShared])

  const abbreviateValue = (value: number) => {
    if (!value) {
      return 'R$0,00'
    }
    if (value > 100000000) {
      return 'R$ ' + Math.floor(value / 1000000) / 100 + 'Mi'
    }
    return (value / 100).toLocaleString('pt-br', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      className=""
    >
      <Box className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 `}>
        <Card className="w-96 p-4">
          <CardHeader className="h-16 flex flex-row items-center justify-between border-b border-erp-neutrals mb-5 px-0">
            <div className="text-xl">Plano Insight</div>
            <Button variant="ghost" size="none" data-test="close" onClick={onClose}>
              <MdOutlineClose size={32} color={'#155366'} />
            </Button>
          </CardHeader>
          <CardContent className="px-0">
            <div className="text-sm mb-3">
              Use esses insights para planejar seu plano orçamentário.
            </div>
            <div className="bg-erp-baseLight px-[15px] py-[10px]">
              <div className="font-semibold">Histórico</div>
              <div className="flex items-center justify-start">
                <div className="w-40 h-28 mr-5">
                  <GraphInsight
                    averageValue={
                      !shared
                        ? data?.medInCentsTheLastFiveYears
                        : dataShared?.medInCentsTheLastFiveYears
                    }
                    listData={listData}
                    changeColumnSelect={setColumnSelect}
                  />
                </div>
                <div>
                  <div>
                    {abbreviateValue(
                      !shared
                        ? data?.medInCentsTheLastFiveYears
                        : dataShared?.medInCentsTheLastFiveYears,
                    )}
                  </div>
                  <div className="text-xs">Média de orçamento nos últimos 5 anos</div>
                </div>
              </div>
              {listData.length > 0 && (
                <Fragment>
                  <div className="border border-[#76D9F8] rounded-sm">
                    <div className="flex justify-between items-center px-3 py-2">
                      <div className="text-[#248DAD] text-xs font-bold">
                        {listData[columnSelect]?.year}
                      </div>
                      {listData[columnSelect]?.differenceValueInPercentage !== null ? (
                        <div className="text-[#248DAD] text-xs">diferença em % do plano atual</div>
                      ) : null}
                    </div>
                    <div className="flex justify-between items-center px-3 py-2 border-b border-[#76D9F8]">
                      <div>
                        <div className="text-xs font-semibold text-[#576B71]">Planejado</div>
                        <div>
                          {listData[columnSelect]?.totalInCents
                            ? (listData[columnSelect]?.totalInCents / 100).toLocaleString('pt-br', {
                                style: 'currency',
                                currency: 'BRL',
                              })
                            : 'R$0,00'}
                        </div>
                      </div>
                      {listData[columnSelect]?.differenceValueInPercentage !== null ? (
                        <div className="bg-white px-2 py-1">
                          <div
                            className={`text-xs font-bold ${
                              listData[columnSelect]?.differenceValueInPercentage === 0
                                ? 'text-erp-primary'
                                : listData[columnSelect]?.type === 'down'
                                  ? 'text-erp-danger'
                                  : 'text-erp-success'
                            }  flex items-center`}
                          >
                            {listData[columnSelect]?.differenceValueInPercentage ===
                            0 ? null : listData[columnSelect]?.type === 'down' ? (
                              <MdOutlineArrowDownward size={12} />
                            ) : (
                              <MdOutlineArrowUpward size={12} />
                            )}
                            {listData[columnSelect]?.differenceValueInPercentage?.toFixed(0)}%
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div className="px-3 py-2 border-b border-[#76D9F8]">
                      <div className="text-xs font-semibold text-[#576B71]">Realizado</div>
                      <div>R$ 11.450.000,00</div>
                    </div>
                    <div className="px-3 py-2">
                      <div className="text-xs font-semibold text-[#576B71]">
                        Média de{' '}
                        {listData[columnSelect]?.countPartnerMunicipalities > 0
                          ? listData[columnSelect]?.countPartnerMunicipalities + ' Municípios'
                          : listData[columnSelect]?.countPartnerStates + ' Estados'}
                      </div>
                      <div>
                        {listData[columnSelect]?.medInCentsForPartners
                          ? (listData[columnSelect]?.medInCentsForPartners / 100)?.toLocaleString(
                              'pt-br',
                              {
                                style: 'currency',
                                currency: 'BRL',
                              },
                            )
                          : 'R$0,00'}
                      </div>
                    </div>
                  </div>
                </Fragment>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-center">
            <Button data-test="cancel" className="mt-4" variant="ghost" onClick={onClose}>
              Fechar
            </Button>
          </CardFooter>
        </Card>
      </Box>
    </Modal>
  )
}
