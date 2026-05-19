import { Login } from '@/services/login'
import { NextAuthOptions, SessionStrategy } from 'next-auth'
import NextAuth from 'next-auth/next'
import CredentialsProvider from 'next-auth/providers/credentials'

const nextAuthOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',

      credentials: {
        email: { label: 'Email', type: 'text', placeholder: 'jsmith' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        const data = {
          email: credentials?.email,
          password: credentials?.password,
        }

        try {
          const res = await Login(data)
          let user = null
          if (res.data?.user) {
            user = {
              ...res.data?.user,
              token: res.data.token,
            }
          }
          return user
        } catch (e) {
          console.error(e)
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt' as SessionStrategy,
    maxAge: 8 * 60 * 60,
  },
  jwt: {
    maxAge: 8 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === 'update') {
        return { ...token, user: session.user }
      }
      user && (token.user = user)
      return { ...token }
    },
    async session({ session, token }) {
      session.user = token.user as any
      return session
    },
  },
}
const handler = NextAuth(nextAuthOptions)

export { handler as GET, nextAuthOptions, handler as POST }
