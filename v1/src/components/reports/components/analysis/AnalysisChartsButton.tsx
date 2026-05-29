import { Button } from '@/components/ui/button'

interface AnalysisChartsButtonProps {
  chartToggle: () => void
  isOpenChart: boolean
}

const AnalysisChartsButton = ({ chartToggle, isOpenChart }: AnalysisChartsButtonProps) => {
  return (
    <Button variant="erpSecondary" className="mr-4" onClick={chartToggle}>
      {isOpenChart ? 'Tabela' : 'Grafico'}
    </Button>
  )
}

export { AnalysisChartsButton }
