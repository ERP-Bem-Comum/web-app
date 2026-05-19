import Image from 'next/image'
import { Fragment } from 'react'

export default function FinishedCollaborator() {
  return (
    <Fragment>
      <div className="bg-white w-full h-14 flex justify-between items-center shadow-[0_4px_22px_0px_rgba(0,0,0,0.05)] ps-3 pe-7 fixed z-50">
        <Image src="/images/logo-bem-comum.png" alt="Logo" width={32} height={32} />
      </div>
      <div className="bg-erp-background min-h-screen w-full z-0 overflow-auto pt-14">
        <div className="py-8 px-6">
          <div className="mt-16 w-full h-full flex justify-center items-center">
            <div>
              <Image src="/images/logo-bem-comum-big.png" alt="Logo" width={260} height={287} />
              <div className="text-xl font-bold">Você pode fechar essa janela.</div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  )
}
