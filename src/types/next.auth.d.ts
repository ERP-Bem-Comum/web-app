import NextAuth from 'next-auth/next'

declare module 'next-auth' {
  interface Session {
    user: {
      id: number
      name: string
      email: string
      cpf: string
      telephone: string
      imageUrl: string
      token: string
      massApprovalPermission: boolean
    }
  }
  
  interface User {
    id: number
    name: string
    email: string
    cpf: string
    telephone: string
    imageUrl: string
    token: string
    massApprovalPermission: boolean
  }
}
