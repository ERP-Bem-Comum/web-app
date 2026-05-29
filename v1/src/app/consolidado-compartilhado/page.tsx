'use client'
import CardLogin from '@/components/auth/CardLogin'
import AccessBudgetPlanShared from '@/components/budgetPlan/budgetPlanShared/AccessBudgetPlanShared'
import ConsolidatedTable from '@/components/consolidated/ConsolidatedTable'
import Image from 'next/image'
import { destroyCookie, parseCookies } from 'nookies'
import { Fragment, useEffect, useState } from 'react'
import { AiOutlineEye } from 'react-icons/ai'

interface SearchParams {
  username: string
  name: string
  budgetPlanId: string
}

export default function ConsolidatedShared({ searchParams }: { searchParams: SearchParams }) {
  const [logged, setLogged] = useState(false)

  useEffect(() => {
    const cookies = parseCookies()
    if (searchParams && cookies) {
      if (searchParams?.username !== cookies?.shareUsername) {
        destroyCookie(null, 'shareBudgetId')
        destroyCookie(null, 'shareUsername')
        destroyCookie(null, 'sharePassword')
        setLogged(false)
      } else {
        setLogged(true)
      }
    }
  }, [searchParams])

  return (
    <Fragment>
      {logged ? (
        <Fragment>
          <div className="bg-white w-full h-14 flex justify-between items-center shadow-[0_4px_22px_0px_rgba(0,0,0,0.05)] ps-3 pe-7 fixed z-50">
            <div className="flex items-center">
              <Image src="/images/logo-bem-comum.png" alt="Logo" width={32} height={32} />
              <div className="text-xl font-bold ml-4">Consolidado ABC</div>
            </div>
            <div className="flex items-center">
              <AiOutlineEye size={24} className="mr-1" />
              Modo de Visualização
            </div>
          </div>
          <div className="bg-erp-background min-h-screen w-full z-0 overflow-auto pt-14">
            <div className="py-8 px-6">
              <div className="w-full h-full">
                <ConsolidatedTable shared />
              </div>
            </div>
          </div>
        </Fragment>
      ) : (
        <div
          className={`bg-[url(../../public/images/backgroundLogin.png)] bg-cover w-screen h-screen flex justify-center items-center`}
        >
          <CardLogin title={`${searchParams?.name}`}>
            <AccessBudgetPlanShared
              id={Number(searchParams?.budgetPlanId)}
              changeLogged={setLogged}
              username={searchParams?.username}
            />
          </CardLogin>
        </div>
      )}
    </Fragment>
  )
}
