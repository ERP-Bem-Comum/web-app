import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'

interface Params {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: any
  title: string
}

export default function CardLogin({ children, title }: Params) {
  return (
    <div className="bg-erp-secondary w-[480px] h-[375px] flex justify-center items-center rounded-[8px]">
      <Card className="w-[448px] z-10 h-[465] flex flex-col items-center justify-center border-0 py-8 px-10 shadow-[0_0_40px_0px_rgba(0,0,0,0.08)]">
        <CardHeader className="flex items-center pt-0 mb-7 px-0">
          <CardTitle>
            <Image src="/images/logo-bem-comum.png" alt="Logo" width={72} height={79.2} />
          </CardTitle>
          <CardDescription className="mt-6 text-xl text-erp-baseDark underline text-center decoration-solid underline-offset-8 decoration-2 decoration-erp-secondary">
            {title}
          </CardDescription>
        </CardHeader>
        {children}
      </Card>
    </div>
  )
}
