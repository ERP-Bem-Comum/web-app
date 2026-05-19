'use client'
import Image from 'next/image'
import { Card } from '../ui/card'
import { MdOutlineMailOutline, MdOutlinePermIdentity, MdOutlinePhoneIphone } from 'react-icons/md'
import { maskCPF, maskPhone } from '@/utils/masks'
import { Button } from '../ui/button'
import { Fragment, useState } from 'react'
import { ModalEdit } from './ModalEdit'
import { ModalNewPassword } from './ModalNewPassword'
import { getLetters } from '@/utils/getLetters'

export default function CardDetail({ user }: any) {
  const [showModalEdit, setShowModalEdit] = useState(false)
  const [showModalNewPassword, setShowModalNewPassword] = useState(false)

  return (
    <Fragment>
      <Card className="p-8 flex justify-between">
        <div className="flex items-center h-full">
          {user.imageUrl ? (
            <Image
              className="rounded-xl mr-6"
              src={`${process.env.NEXT_PUBLIC_API_URL}/users/files/${user.imageUrl}`}
              alt="Avatar"
              width={144}
              height={160}
            />
          ) : (
            <div className="rounded-xl h-40 w-36 bg-muted mr-6 flex items-center justify-center">
              {getLetters(user.name)}
            </div>
          )}
          <div className="flex flex-col justify-stretch h-full">
            <div className="text-xl mb-2">{user.name}</div>
            <div className="text-sm text-[#8E8E8E] mb-4">{user?.perfil}</div>
            <div className="flex items-center text-sm mb-4">
              <MdOutlinePermIdentity color={'#32C6F4'} size={16} className="mr-1" />{' '}
              {maskCPF(user.cpf)}
            </div>
            <div className="flex items-center text-sm mb-4">
              <MdOutlineMailOutline color={'#32C6F4'} size={16} className="mr-1" /> {user.email}
            </div>
            <div className="flex items-center text-sm mb-4">
              <MdOutlinePhoneIphone color={'#32C6F4'} size={16} className="mr-1" />{' '}
              {maskPhone(user.telephone)}
            </div>
          </div>
        </div>
        <div className="flex">
          <Button
            data-test="changePassword"
            variant="erpSecondary"
            type="button"
            className="mr-4"
            onClick={() => setShowModalNewPassword(true)}
          >
            Redefinir Senha
          </Button>
          <Button
            data-test="edit"
            variant="erpPrimary"
            type="button"
            onClick={() => setShowModalEdit(true)}
          >
            Editar
          </Button>
        </div>
      </Card>
      <ModalEdit open={showModalEdit} onClose={() => setShowModalEdit(false)} user={user} />
      <ModalNewPassword
        open={showModalNewPassword}
        onClose={() => setShowModalNewPassword(false)}
      />
    </Fragment>
  )
}
