'use client'
import { useRouter } from 'next/navigation'
import { MdKeyboardArrowLeft } from 'react-icons/md'
import { Button } from './ui/button'
import { IoIosArrowForward } from 'react-icons/io'

type Props = {
  text: string
  nextText: string
  isReturn?: boolean
  path?: string
}
export default function TopPagesWithArrow({ text, nextText, isReturn = true, path }: Props) {
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
      <div className="flex items-center gap-4 ml-4">
        <div className="text-2xl font-bold">{text}</div>
        <IoIosArrowForward size={24} />
        <div className="text-2xl font-bold">{nextText}</div>
      </div>
    </div>
  )
}
