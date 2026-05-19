import FlowLabel from './FlowLabel'

interface FlowListHeaderProps {
  title: string
}

const FlowListHeader = ({ title }: FlowListHeaderProps) => {
  return (
    <div className="w-full">
      <FlowLabel text={title} />
      <section className="flex">
        <FlowLabel text="realizado" />
        <FlowLabel text="previsto" />
      </section>
      <section className="flex w-full">
        <CategorySection />
        <CategorySection />
      </section>
    </div>
  )
}

const CategorySection = () => {
  return (
    <section className="flex w-full">
      <FlowLabel text="categoria > subcategoria" position="start" />
      <FlowLabel text="valor (R$)" position="end" />
    </section>
  )
}

export default FlowListHeader
