'use client'
import { useRouter } from 'next/navigation'
import { MdKeyboardArrowLeft } from 'react-icons/md'
import { Button } from './ui/button'

type Props = {
  text: string
  isReturn?: boolean
  path?: string
}
export default function TopPages({ text, isReturn = true, path }: Props) {
  const router = useRouter()
  return (
    <div className="flex items-center mb-8">
      {isReturn && (
        <Button
          data-test="return"
          variant="erpReturn"
          size="none"
          onClick={() => (path ? router.push(path) : router.back())}
        >
          <MdKeyboardArrowLeft className="text-erp-primary" size={32} />
        </Button>
      )}
      <div className="text-2xl ml-2 font-bold">{text}</div>
    </div>
  )
}
