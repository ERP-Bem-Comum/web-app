import { Button } from '@/components/ui/button'

interface AccountsChartsButtonProps {
  chartToggle: () => void
  isOpenChart: boolean
}

const AccountsChartsButton = ({ chartToggle, isOpenChart }: AccountsChartsButtonProps) => {
  return (
    <Button variant="erpSecondary" className="mr-4" onClick={chartToggle}>
      {isOpenChart ? 'Tabela' : 'Grafico'}
    </Button>
  )
}

export { AccountsChartsButton }
