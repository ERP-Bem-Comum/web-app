import { createHttpClient, isHttpError } from './http-client'

const publicApi = createHttpClient({ baseURL: process.env.NEXT_PUBLIC_API_URL })

export type ILogin = {
  email?: string
  password?: string
}

export async function Login(data: ILogin) {
  try {
    return await publicApi.post('/auth/login', data)
  } catch (error) {
    if (isHttpError(error)) {
      const body = error.response?.data as { message?: string } | undefined
      console.error('error: ', body?.message)
      return {
        status: 400,
        data: {
          message: body?.message,
        },
      }
    }
    return {
      status: 400,
      data: { message: 'Erro inesperado' },
    }
  }
}

export async function RecoveryPassword(email: string) {
  try {
    const response = await publicApi.post('/auth/forgot-password/', { email })
    console.log('response: ', response)
  } catch (error) {
    console.error('error: ', error)
  }
}

export async function newPasswordRequest(token: string | undefined, password: string) {
  try {
    return await publicApi.post('/auth/reset-password', { token, password })
  } catch (error) {
    console.error('error: ', error)
    return {
      status: 401,
      data: {
        message: 'Link de redefinição de senha expirado. Por favor, solicite outro.',
      },
    }
  }
}
