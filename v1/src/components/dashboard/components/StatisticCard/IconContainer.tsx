import { cn } from 'lib/utils'
import { IconType } from 'react-icons/lib'

interface IconProps {
  icon: IconType
  bgColor: string
}

export const IconContainer = ({ icon: IconComponent, bgColor }: IconProps) => {
  return (
    <div
      className={cn(`flex items-center justify-center p-[11px] rounded-full shadow-sm`, bgColor)}
    >
      <IconComponent size={35} color="#FFF" />
    </div>
  )
}
