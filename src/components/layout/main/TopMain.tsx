'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { IUser } from '@/services/user'
import { getLetters } from '@/utils/getLetters'
import { Menu, MenuItem } from '@mui/material'
import { signOut } from 'next-auth/react'
import React, { useState } from 'react'
import { MdOutlineArrowDropDown, MdOutlineLogout } from 'react-icons/md'

interface Params {
  user: IUser | undefined
}

export default function TopMain({ user }: Params) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <div className="h-full flex justify-end items-center z-10">
      <Button variant="ghost" type="button" onClick={handleClick}>
        <div>Olá, {user?.name ?? 'Visitante'}</div>
        <Avatar className="ml-3">
          <AvatarImage
            src={
              user?.imageUrl && `${process.env.NEXT_PUBLIC_API_URL}/users/files/${user.imageUrl}`
            }
          />
          <AvatarFallback>{getLetters(user?.name ?? 'Visitante')}</AvatarFallback>
        </Avatar>
        <MdOutlineArrowDropDown size={20} />
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        <MenuItem onClick={() => signOut()}>
          <MdOutlineLogout color={'#FF5353'} className="mr-3" size={20} /> Sair
        </MenuItem>
      </Menu>
    </div>
  )
}
