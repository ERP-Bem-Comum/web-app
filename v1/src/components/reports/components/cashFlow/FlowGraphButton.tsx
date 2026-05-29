import { Button } from '@/components/ui/button'

interface FlowGraphButtonProps {
  graphToggle: () => void
  isOpenGraph: boolean
}

const FlowGraphButton = ({ graphToggle, isOpenGraph }: FlowGraphButtonProps) => {
  return (
    <Button variant="erpSecondary" className="mr-4" onClick={graphToggle}>
      {isOpenGraph ? 'Tabela' : 'Grafico'}
    </Button>
  )
}

export { FlowGraphButton }
