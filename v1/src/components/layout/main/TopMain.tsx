'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { getLetters } from '@/utils/getLetters'
import React from 'react'
import { MdOutlineArrowDropDown, MdOutlineLogout } from 'react-icons/md'

export default function TopMain() {
  const { user, logout } = useAuth()

  return (
    <div className="h-full flex justify-end items-center z-10">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" type="button">
            <div>Olá, {user?.name ?? 'Visitante'}</div>
            <Avatar className="ml-3 h-8 w-8">
              <AvatarImage
                src={
                  (user as any)?.imageUrl
                    ? `${import.meta.env.VITE_API_URL || ''}/users/files/${(user as any).imageUrl}`
                    : undefined
                }
              />
              <AvatarFallback>{getLetters(user?.name ?? 'Visitante')}</AvatarFallback>
            </Avatar>
            <MdOutlineArrowDropDown size={20} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={4}>
          <DropdownMenuItem onClick={() => logout()}>
            <MdOutlineLogout color={'#FF5353'} className="mr-3" size={20} />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
