import FlowLabel from './FlowLabel'

interface FlowListFooterProps {
  realizado: number
  previsto: number
}

const FlowListFooter = ({ realizado, previsto }: FlowListFooterProps) => {
  return (
    <section className="flex">
      <FlowLabel text="Total realizado:" value={realizado} position="start" />
      <FlowLabel text="Total previsto:" value={previsto} position="start" />
    </section>
  )
}

export default FlowListFooter
