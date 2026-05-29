import { Button } from '@/components/ui/button'

interface RealizedChartsButtonProps {
  chartToggle: () => void
  isOpenChart: boolean
}

const RealizedChartsButton = ({ chartToggle, isOpenChart }: RealizedChartsButtonProps) => {
  return (
    <Button variant="erpSecondary" className="mr-4" onClick={chartToggle}>
      {isOpenChart ? 'Tabela' : 'Grafico'}
    </Button>
  )
}

export { RealizedChartsButton }
