'use client'
import { signOut } from 'next-auth/react'
import { Button } from './ui/button'

export default function Logout() {
  return (
    <div>
      <Button onClick={() => signOut({ callbackUrl: '/login' })}>Logout</Button>
    </div>
  )
}
