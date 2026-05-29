import { maskMonetaryValue } from '@/utils/masks'

interface FlowLabelProps {
  text: string
  value?: number
  position?: 'start' | 'end' | 'center'
}

const FlowLabel = ({ text, value, position = 'center' }: FlowLabelProps) => {
  const getColor = (value: number) => {
    if (value < 0) {
      return '#FF3B30'
    }

    return '#000'
  }

  return (
    <div className={`flex justify-${position} w-full p-5 bg-[#BFEDFC] gap-2`}>
      <span className="w-max">{text.toUpperCase()}</span>
      {value && <span style={{ color: getColor(value) }}>{maskMonetaryValue(value)}</span>}
    </div>
  )
}

export default FlowLabel
