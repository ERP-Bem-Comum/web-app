'use client'
import CardLogin from '@/components/auth/CardLogin'
import AccessBudgetPlanShared from '@/components/budgetPlan/budgetPlanShared/AccessBudgetPlanShared'
import BudgetPlanDetailShared from '@/components/budgetPlan/budgetPlanShared/BudgetPlanDetailShared'
import { useGetBudgetPlanByIdShared } from '@/services/budgetPlanShared'
import Image from 'next/image'
import { destroyCookie, parseCookies } from 'nookies'
import { Fragment, useEffect, useState } from 'react'
import { AiOutlineEye } from 'react-icons/ai'

interface SearchParams {
  budgetPlanId: string
  username: string
  name: string
}

export default function BudgetPlanShared({ searchParams }: { searchParams: SearchParams }) {
  const [budgetPlanId, setBudgetPlanId] = useState<string>('')
  const [logged, setLogged] = useState(false)
  const { data } = useGetBudgetPlanByIdShared(budgetPlanId, !!budgetPlanId && logged)

  useEffect(() => {
    const cookies = parseCookies()
    if (searchParams && cookies) {
      if (
        searchParams.budgetPlanId !== cookies.shareBudgetId ||
        searchParams.username !== cookies.shareUsername
      ) {
        destroyCookie(null, 'shareBudgetId')
        destroyCookie(null, 'shareUsername')
        destroyCookie(null, 'sharePassword')
        setBudgetPlanId('')
        setLogged(false)
      } else {
        setBudgetPlanId(searchParams.budgetPlanId)
        setLogged(true)
      }
    }
  }, [searchParams])

  useEffect(() => {
    if (logged) {
      setBudgetPlanId(searchParams.budgetPlanId)
    }
  }, [logged, searchParams.budgetPlanId])

  return (
    <Fragment>
      {data?.budgetPlan ? (
        <Fragment>
          <div className="bg-white w-full h-14 flex justify-between items-center shadow-[0_4px_22px_0px_rgba(0,0,0,0.05)] ps-3 pe-7 fixed z-50">
            <div className="flex items-center">
              <Image src="/images/logo-bem-comum.png" alt="Logo" width={32} height={32} />
              <div className="text-xl font-bold ml-4">Plano Orçamentario</div>
            </div>
            <div className="flex items-center">
              <AiOutlineEye size={24} className="mr-1" />
              Modo de Visualização
            </div>
          </div>
          <div className="bg-erp-background min-h-screen w-full z-0 overflow-auto pt-14">
            <div className="py-8 px-6">
              <div className="w-full h-full">
                <BudgetPlanDetailShared budget={data?.budgetPlan} />
              </div>
            </div>
          </div>
        </Fragment>
      ) : (
        <div
          className={`bg-[url(../../public/images/backgroundLogin.png)] bg-cover w-screen h-screen flex justify-center items-center`}
        >
          <CardLogin title={`Plano Orçamentário ${searchParams?.name}`}>
            <AccessBudgetPlanShared
              id={Number(searchParams?.budgetPlanId)}
              username={searchParams?.username}
              changeLogged={setLogged}
            />
          </CardLogin>
        </div>
      )}
    </Fragment>
  )
}
