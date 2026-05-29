'use client'
import TopPages from '@/components/TopPages'
import CardLogin from '@/components/auth/CardLogin'
import AccessCompleteCollaborator from '@/components/partners/collaborators/AccessCompleteCollaborator'
import FormCompleteCollaborators from '@/components/partners/collaborators/FormCompleteCollaborators'
import Image from 'next/image'
import { Fragment, useState } from 'react'

interface SearchParams {
  collaboratorId: string
}

export default function CompleteCollaborators({ searchParams }: { searchParams: SearchParams }) {
  const [collaborator, setCollaborator] = useState()
  return (
    <Fragment>
      {collaborator ? (
        <Fragment>
          <div className="bg-white w-full h-14 flex justify-between items-center shadow-[0_4px_22px_0px_rgba(0,0,0,0.05)] ps-3 pe-7 fixed z-50">
            <Image src="/images/logo-bem-comum.png" alt="Logo" width={32} height={32} />
          </div>
          <div className="bg-erp-background min-h-screen w-full z-0 overflow-auto pt-14">
            <div className="py-8 px-6">
              <div className="w-full h-full">
                <TopPages isReturn={false} text={'Completar cadastro de colaborador(a):'} />
                <FormCompleteCollaborators first={true} collaborator={collaborator} edit={true} />
              </div>
            </div>
          </div>
        </Fragment>
      ) : (
        <div
          className={`bg-[url(../../public/images/backgroundLogin.png)] bg-cover w-screen h-screen flex justify-center items-center`}
        >
          <CardLogin title="Complete seu cadastro de colaborador(a)">
            <AccessCompleteCollaborator
              id={searchParams?.collaboratorId}
              changeCollaborator={setCollaborator}
            />
          </CardLogin>
        </div>
      )}
    </Fragment>
  )
}
