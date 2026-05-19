import FlowLabel from './FlowLabel'

interface FlowTotalsProps {
  realizado: number
  previsto: number
}

const FlowTotals = ({ realizado, previsto }: FlowTotalsProps) => {
  return (
    <div>
      <FlowLabel text="saldos" />

      <section className="flex">
        <FlowLabel text="Total realizado:" value={realizado} position="start" />
        <FlowLabel text="Total previsto:" value={previsto} position="start" />
      </section>
      <FlowLabel
        text="Visão geral (previsto - realizado):"
        value={(previsto - realizado) * -1}
        position="center"
      />
    </div>
  )
}

export default FlowTotals
