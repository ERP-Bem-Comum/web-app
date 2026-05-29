import { Button } from '@/components/ui/button'
import { Menu, MenuItem } from '@mui/material'
import { Fragment, useState } from 'react'

interface SeeAllButtonProps {
  onClick?: () => void
}

export const SeeAllButton = ({ onClick }: SeeAllButtonProps) => {
  return (
    <Button variant="outlinedSecondary" onClick={onClick}>
      Ver tudo
    </Button>
  )
}
